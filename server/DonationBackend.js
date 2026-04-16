// DonationBackend.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const { sendDonationReceipt, sendEmail, processDonationCompletion } = require("./EmailService");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Helper: generate a payment reference
const generatePaymentReference = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let ref = "PAY-";
    for (let i = 0; i < 8; i++) {
        ref += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ref;
};

// Helper: generate a standardized transaction ID
const generateTransactionId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `TXN-${timestamp}-${random}`;
};

// ─────────────────────────────────────────────
// POST /api/donations — Create a new donation
// Always creates a donors row first, then links via donor_id
// ─────────────────────────────────────────────
router.post("/", async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            campaign_id,
            user_id,
            amount,
            payment_method,
            donation_type,    // "one-time" or "monthly"
            is_anonymous,
            donor_name,       // guest full name
            donor_email,
            donor_phone,
            donor_address,    // guest address
            message,
        } = req.body;

        if (!campaign_id || !amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ message: "Campaign ID and a positive amount are required." });
        }

        await client.query("BEGIN");

        // ── Step 1: Resolve donor info and upsert into donors table ──
        let donorId = null;

        if (!is_anonymous) {
            let firstName = null, lastName = null, email = null, phone = null, address = null;
            let addr2 = null, brgy = null, prov = null, cityVal = null, zip = null, tin = null, countryVal = null;

            if (user_id) {
                // Logged-in: pull info from users / auth_users
                const userInfo = await client.query(
                    `SELECT u.*, a.email
                     FROM users u
                     LEFT JOIN auth_users a ON u.user_id = a.user_id
                     WHERE u.user_id = $1`,
                    [user_id]
                );
                if (userInfo.rows.length > 0) {
                    const ui = userInfo.rows[0];
                    firstName = ui.first_name;
                    lastName = ui.last_name;
                    // PRIORITY: always use donor_email from the frontend (localStorage) first,
                    // since that is the email the user actually checks.
                    // Fall back to auth_users email only if no donor_email was provided.
                    email = donor_email || ui.email || null;
                    phone = ui.contact_number;
                    address = ui.address;
                    addr2 = ui.address2;
                    brgy = ui.barangay;
                    prov = ui.province;
                    cityVal = ui.city;
                    zip = ui.zip_code;
                    tin = ui.tin_number;
                    countryVal = ui.country;
                }
            } else {
                // Guest: split donor_name into first / last
                const parts = (donor_name || "").trim().split(/\s+/);
                firstName = parts[0] || null;
                lastName = parts.slice(1).join(" ") || null;
                email = donor_email || null;
                phone = donor_phone || null;
                address = donor_address || null;
                // Guests don't provide granular address in the basic form usually, 
                // but we could map them if they were passed in req.body. For now, NULLs.
            }

            // For registered users: reuse existing donors row if email matches
            if (email) {
                const existing = await client.query(
                    `SELECT donor_id FROM donors WHERE email = $1 LIMIT 1`,
                    [email]
                );
                if (existing.rows.length > 0) {
                    donorId = existing.rows[0].donor_id;
                    // Keep donor info up to date
                    await client.query(
                        `UPDATE donors SET 
                           first_name=$1, last_name=$2, contact_number=$3, address=$4,
                           address2=$5, barangay=$6, province=$7, city=$8, zip_code=$9,
                           tin_number=$10, country=$11
                         WHERE donor_id=$12`,
                        [firstName, lastName, phone, address, addr2, brgy, prov, cityVal, zip, tin, countryVal, donorId]
                    );
                }
            }

            if (!donorId) {
                const donorResult = await client.query(
                    `INSERT INTO donors (
                        first_name, last_name, email, contact_number, address,
                        address2, barangay, province, city, zip_code, tin_number, country
                    )
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING donor_id`,
                    [firstName, lastName, email, phone, address, addr2, brgy, prov, cityVal, zip, tin, countryVal]
                );
                donorId = donorResult.rows[0].donor_id;
            }

        } else {
            // Anonymous: store email for receipt purposes (name stays NULL)
            const donorResult = await client.query(
                `INSERT INTO donors (first_name, last_name, email, contact_number, address)
                 VALUES (NULL, NULL, $1, NULL, NULL) RETURNING donor_id`,
                [donor_email || null]
            );
            donorId = donorResult.rows[0].donor_id;
        }

        // ── Step 2: Map frequency ──
        const frequency = donation_type === "monthly" ? "monthly" : "one_time";
        const next_due_date =
            frequency === "monthly"
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                : null;

        // ── Step 3: Insert into donations ──
        const transactionId = generateTransactionId();
        const donationResult = await client.query(
            `INSERT INTO donations (
                user_id, campaign_id, donor_id, amount, payment_method,
                donation_source, currency, frequency, next_due_date,
                initiated_at, message, status, transaction_id
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PHP', $7, $8, NOW(), $9, 'pending', $10)
            RETURNING donation_id, initiated_at, transaction_id`,
            [
                user_id || null,
                campaign_id,
                donorId,
                parseFloat(amount),
                payment_method || null,
                "website",
                frequency,
                next_due_date,
                message || null,
                transactionId
            ]
        );

        const donation = donationResult.rows[0];
        const paymentReference = generatePaymentReference();

        // ── Step 4: Insert into payment_transactions ──
        await client.query(
            `INSERT INTO payment_transactions (
                donation_id, campaign_id, payment_reference, amount, payment_status
            ) VALUES ($1, $2, $3, $4, 'pending')`,
            [donation.donation_id, campaign_id, paymentReference, parseFloat(amount)]
        );

        // ── Step 5: Update campaigns.current_amount ──
        await client.query(
            `UPDATE campaigns
             SET current_amount = COALESCE(current_amount, 0) + $1,
                 updated_at = NOW()
             WHERE campaign_id = $2`,
            [parseFloat(amount), campaign_id]
        );

        await client.query("COMMIT");

        return res.json({
            message: "Donation submitted successfully!",
            donation_id: donation.donation_id,
            donor_id: donorId,
            payment_reference: paymentReference,
            initiated_at: donation.initiated_at,
            transaction_id: donation.transaction_id,
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("CREATE DONATION ERROR:", err);
        res.status(500).json({ message: "Server error: " + err.message });
    } finally {
        client.release();
    }
});

// ─────────────────────────────────────────────
// GET /api/donations/donors — Aggregated donor list (admin)
// Reads directly from the donors table
// ─────────────────────────────────────────────
router.get("/donors", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
              dn.donor_id,
              dn.first_name,
              dn.last_name,
              dn.contact_number                                                          AS phone,
              dn.address,
              dn.email,
              (dn.first_name IS NULL AND dn.last_name IS NULL)                           AS is_anonymous,
              COUNT(d.donation_id)::int                                                  AS donation_count,
              COALESCE(SUM(d.amount), 0)::float                                          AS total_donated,
              MAX(d.initiated_at)                                                        AS last_donation_at,
              MIN(d.initiated_at)                                                        AS first_donation_at,
              BOOL_OR(d.frequency = 'monthly')                                           AS is_recurring
             FROM donors dn
             INNER JOIN donations d ON dn.donor_id = d.donor_id
             INNER JOIN payment_transactions pt ON d.donation_id = pt.donation_id
             WHERE pt.payment_status IN ('completed', 'pending')
             AND dn.email IS NOT NULL AND dn.email != ''
             GROUP BY dn.donor_id, dn.first_name, dn.last_name,
                      dn.contact_number, dn.address, dn.email
             ORDER BY total_donated DESC`
        );

        const donors = result.rows;

        const stats = {
            totalDonors: donors.length,
            anonymousDonors: donors.filter(d => d.is_anonymous === true).length,
            activeDonors: donors.filter(d => {
                if (!d.last_donation_at) return false;
                const daysSince = (Date.now() - new Date(d.last_donation_at)) / (1000 * 60 * 60 * 24);
                return daysSince <= 365;
            }).length,
            recurringDonors: donors.filter(d => d.is_recurring === true).length,
            totalLifetimeDonations: donors.reduce((sum, d) => sum + parseFloat(d.total_donated || 0), 0)
        };

        res.json({ donors, stats });
    } catch (err) {
        console.error("GET DONORS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// GET /api/donations/stats — Overall donation stats (admin)
// ─────────────────────────────────────────────
router.get("/stats", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
              COUNT(d.donation_id) FILTER (WHERE pt.payment_status IN ('completed', 'pending'))::int       AS total_donations,
              COALESCE(SUM(d.amount) FILTER (WHERE pt.payment_status IN ('pending','completed')), 0)::float AS total_amount,
              COUNT(CASE WHEN pt.payment_status = 'pending'   THEN 1 END)::int                AS pending_count,
              COUNT(CASE WHEN pt.payment_status = 'completed' THEN 1 END)::int                AS completed_count,
              COUNT(CASE WHEN pt.payment_status = 'cancelled' THEN 1 END)::int                AS cancelled_count,
              COUNT(DISTINCT d.donor_id) FILTER (WHERE pt.payment_status IN ('completed', 'pending'))::int AS unique_donors,
              COALESCE(AVG(d.amount) FILTER (WHERE pt.payment_status IN ('pending','completed')), 0)::float AS avg_donation
             FROM donations d
             LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id`
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("GET STATS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// GET /api/donations/all — Get all donations (admin)
// ─────────────────────────────────────────────
router.get("/all", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
              d.*,
              c.campaign_name, c.campaign_type,
              pt.payment_reference, pt.payment_status,
              dn.first_name, dn.last_name, dn.email AS donor_email
             FROM donations d
             LEFT JOIN campaigns c ON d.campaign_id = c.campaign_id
             LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
             LEFT JOIN donors dn ON d.donor_id = dn.donor_id
             ORDER BY d.initiated_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("GET ALL DONATIONS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// GET /api/donations/recent — Get today's completed donations for public notification
// ─────────────────────────────────────────────
router.get("/recent", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
              d.amount,
              d.initiated_at,
              c.campaign_name,
              dn.first_name,
              dn.last_name
             FROM donations d
             LEFT JOIN campaigns c ON d.campaign_id = c.campaign_id
             LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
             LEFT JOIN donors dn ON d.donor_id = dn.donor_id
             WHERE pt.payment_status = 'completed'
               AND d.initiated_at::date = CURRENT_DATE
             ORDER BY d.initiated_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("GET RECENT DONATIONS ERROR:", err);
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/donations/donor/:donorId — Donations by donor_id
// ─────────────────────────────────────────────
router.get("/donor/:donorId", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
              d.*,
              c.campaign_name, c.campaign_type,
              pt.payment_reference, pt.payment_status
             FROM donations d
             LEFT JOIN campaigns c ON d.campaign_id = c.campaign_id
             LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
             WHERE d.donor_id = $1
             ORDER BY d.initiated_at DESC`,
            [req.params.donorId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("GET DONOR DONATIONS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// GET /api/donations/user/:userId — Donations by user_id (for profile/account page)
// ─────────────────────────────────────────────
router.get("/user/:userId", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
              d.*,
              c.campaign_name, c.campaign_type,
              pt.payment_reference, pt.payment_status, pt.receipt_upload,
              dn.first_name, dn.last_name,
              COALESCE(dr.is_active, false) AS is_reminded
             FROM donations d
             LEFT JOIN campaigns c ON d.campaign_id = c.campaign_id
             LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
             LEFT JOIN donors dn ON d.donor_id = dn.donor_id
             LEFT JOIN donation_reminders dr ON d.donation_id = dr.donation_id
             WHERE d.user_id = $1
             ORDER BY d.initiated_at DESC`,
            [req.params.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("GET USER DONATIONS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// POST /api/donations/:id/reminder/toggle — Toggle donation reminder
// ─────────────────────────────────────────────
router.post("/:id/reminder/toggle", async (req, res) => {
    const client = await pool.connect();
    try {
        const { isActive } = req.body;
        const donationId = req.params.id;

        // Fetch the donation
        const donationResult = await client.query(
            `SELECT user_id, campaign_id, initiated_at, next_due_date 
             FROM donations WHERE donation_id = $1`,
            [donationId]
        );
        
        if (donationResult.rows.length === 0) {
            return res.status(404).json({ message: "Donation not found" });
        }
        
        const d = donationResult.rows[0];

        // Upsert the reminder
        await client.query(
            `INSERT INTO donation_reminders (donation_id, user_id, campaign_id, started_date, next_payment, is_active, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (donation_id) 
             DO UPDATE SET is_active = EXCLUDED.is_active, updated_at = NOW()`,
            [donationId, d.user_id, d.campaign_id, d.initiated_at, d.next_due_date, isActive]
        );

        res.json({ message: "Reminder status updated successfully", isActive });
    } catch (err) {
        console.error("TOGGLE REMINDER ERROR:", err);
        res.status(500).json({ message: "Server error" });
    } finally {
        client.release();
    }
});

// ─────────────────────────────────────────────
// GET /api/donations/admin/reminders — Get active donation reminders (admin)
// ─────────────────────────────────────────────
router.get("/admin/reminders", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
              dr.reminder_id, dr.started_date, dr.next_payment, dr.is_active,
              d.amount, d.frequency,
              c.campaign_name,
              u.first_name, u.last_name, 
              a.email AS user_email
             FROM donation_reminders dr
             INNER JOIN donations d ON dr.donation_id = d.donation_id
             LEFT JOIN campaigns c ON dr.campaign_id = c.campaign_id
             LEFT JOIN users u ON dr.user_id = u.user_id
             LEFT JOIN auth_users a ON u.user_id = a.user_id
             WHERE dr.is_active = TRUE
             ORDER BY dr.started_date DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("GET ADMIN REMINDERS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// POST /api/donations/admin/reminders/:id/send — Manually send reminder email
// ─────────────────────────────────────────────
router.post("/admin/reminders/:id/send", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
              dr.reminder_id, dr.next_payment,
              d.amount, d.frequency,
              c.campaign_name,
              u.first_name, u.last_name, 
              a.email AS user_email
             FROM donation_reminders dr
             INNER JOIN donations d ON dr.donation_id = d.donation_id
             LEFT JOIN campaigns c ON dr.campaign_id = c.campaign_id
             LEFT JOIN users u ON dr.user_id = u.user_id
             LEFT JOIN auth_users a ON u.user_id = a.user_id
             WHERE dr.reminder_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Reminder not found." });
        }

        const rem = result.rows[0];
        const donorName = rem.first_name ? `${rem.first_name} ${rem.last_name || ""}`.trim() : "valued donor";
        const campaignName = rem.campaign_name || "General Operations";
        const nextPayment = rem.next_payment ? new Date(rem.next_payment).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "N/A";
        const amountStr = `₱${parseFloat(rem.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

        const emailHtml = `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #63A6B2; padding: 20px; text-align: center; color: white;">
                    <h2 style="margin: 0;">Donation Reminder</h2>
                </div>
                <div style="padding: 30px;">
                    <p>Dear ${donorName},</p>
                    <p>We hope this email finds you well. This is a friendly reminder from <strong>SVRTFI</strong> regarding your next scheduled donation for the <strong>${campaignName}</strong> campaign.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="color: #666; font-size: 14px;">Amount:</td>
                                <td style="font-weight: bold; text-align: right;">${amountStr}</td>
                            </tr>
                            <tr>
                                <td style="color: #666; font-size: 14px;">Next Payment Date:</td>
                                <td style="font-weight: bold; text-align: right;">${nextPayment}</td>
                            </tr>
                            <tr>
                                <td style="color: #666; font-size: 14px;">Frequency:</td>
                                <td style="font-weight: bold; text-align: right; text-transform: capitalize;">${rem.frequency}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p>Your continuous support makes a huge difference in our ability to serve those in need. If you have any questions or need to update your preferences, please don't hesitate to contact us.</p>
                    
                    <p style="margin-top: 30px;">Warmly,<br/>The SVRTFI Team</p>
                </div>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                    &copy; ${new Date().getFullYear()} SVRTFI Donation System. All rights reserved.
                </div>
            </div>
        `;

        await sendEmail(rem.user_email, `Reminder: Your upcoming donation for ${campaignName}`, emailHtml);

        // Update the database to reflect that a reminder was sent today
        await pool.query("UPDATE donation_reminders SET last_reminder_date = CURRENT_DATE WHERE reminder_id = $1", [id]);

        res.json({ message: "Reminder email sent successfully!" });
    } catch (err) {
        console.error("SEND MANUAL REMINDER ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// GET /api/donations/:id — Get single donation
// ─────────────────────────────────────────────
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
              d.*,
              c.campaign_name, c.campaign_type, c.goal_amount, c.current_amount,
              f.foundation_name,
              pt.payment_reference, pt.payment_status, pt.receipt_upload,
              dn.first_name AS donor_first_name, dn.last_name AS donor_last_name,
              dn.email AS donor_email, dn.contact_number AS donor_phone,
              dn.tin_number, dn.address, dn.address2, dn.barangay, dn.province, dn.city, dn.zip_code, dn.country
             FROM donations d
             LEFT JOIN campaigns c ON d.campaign_id = c.campaign_id
             LEFT JOIN foundation_campaigns fc ON c.campaign_id = fc.campaign_id
             LEFT JOIN foundations f ON fc.foundation_id = f.foundation_id
             LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
             LEFT JOIN donors dn ON d.donor_id = dn.donor_id
             WHERE d.donation_id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Donation not found" });
        }

        const row = result.rows[0];
        const donation = {
            ...row,
            donor_name: row.donor_first_name
                ? `${row.donor_first_name} ${row.donor_last_name || ""}`.trim()
                : "Anonymous",
            donation_type: row.frequency === "monthly" ? "monthly" : "one-time",
            status: row.payment_status || "pending",
            created_at: row.initiated_at,
        };

        res.json(donation);
    } catch (err) {
        console.error("GET DONATION ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// PATCH /api/donations/:id/complete — Mark as completed
// ─────────────────────────────────────────────
router.patch("/:id/complete", async (req, res) => {
    console.log(`✅ Received complete request for donation ID: ${req.params.id}`);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Fetch current donation and check for existing receipt
        const donationCheck = await client.query(
            `SELECT receipt_number FROM donations WHERE donation_id = $1 FOR UPDATE`,
            [req.params.id]
        );

        if (donationCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Donation not found" });
        }

        let receiptNumber = donationCheck.rows[0].receipt_number;

        // 2. Assign receipt sequence if one doesn't exist
        if (!receiptNumber) {
            const seqResult = await client.query(
                `SELECT id, sequence_number FROM receipt_sequences WHERE is_used = FALSE ORDER BY id ASC LIMIT 1 FOR UPDATE SKIP LOCKED`
            );
            if (seqResult.rows.length > 0) {
                receiptNumber = seqResult.rows[0].sequence_number;
                await client.query(`UPDATE receipt_sequences SET is_used = TRUE WHERE id = $1`, [seqResult.rows[0].id]);
            }
        }

        // 3. Mark donation as completed
        const donationResult = await client.query(
            `UPDATE donations SET completed_at = NOW(), status = 'completed', receipt_number = $2 WHERE donation_id = $1 RETURNING *`,
            [req.params.id, receiptNumber || null]
        );

        // 4. Mark transaction as completed
        await client.query(
            `UPDATE payment_transactions SET payment_status = 'completed' WHERE donation_id = $1`,
            [req.params.id]
        );

        await client.query("COMMIT");

        // Send email receipt & auto-thank you (Non-blocking)
        processDonationCompletion(req.params.id).catch(err => console.error("EMAIL COMPLETION ERROR:", err));

        return res.json({
            message: "Donation marked as completed and receipt sent!",
            donation: donationResult.rows[0],
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("COMPLETE DONATION ERROR:", err);
        res.status(500).json({ message: "Server error" });
    } finally {
        client.release();
    }
});

// ─────────────────────────────────────────────
// PATCH /api/donations/:id/cancel — Mark as cancelled
// ─────────────────────────────────────────────
router.patch("/:id/cancel", async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Fetch donation to know the amount and campaign
        const fetchResult = await client.query(
            `SELECT donation_id, amount, campaign_id FROM donations WHERE donation_id = $1`,
            [req.params.id]
        );

        if (fetchResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Donation not found" });
        }

        const { amount, campaign_id } = fetchResult.rows[0];

        // Mark payment_transaction as cancelled
        await client.query(
            `UPDATE payment_transactions SET payment_status = 'cancelled' WHERE donation_id = $1`,
            [req.params.id]
        );

        // Reverse the campaign's current_amount (since payment never completed)
        await client.query(
            `UPDATE campaigns
             SET current_amount = GREATEST(COALESCE(current_amount, 0) - $1, 0),
                 updated_at = NOW()
             WHERE campaign_id = $2`,
            [parseFloat(amount), campaign_id]
        );

        await client.query("COMMIT");

        return res.json({ message: "Donation cancelled successfully." });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("CANCEL DONATION ERROR:", err);
        res.status(500).json({ message: "Server error" });
    } finally {
        client.release();
    }
});

// Edit donation fields
router.put("/:id", async (req, res) => {
    const client = await pool.connect();
    try {
        const { amount, message, frequency, campaign_id } = req.body;
        const id = req.params.id;

        // 1. Fetch current donation and transaction status
        const existing = await client.query(
            `SELECT d.amount, d.campaign_id, pt.payment_status
             FROM donations d
             LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
             WHERE d.donation_id = $1`, [id]
        );
        
        if (existing.rows.length === 0)
            return res.status(404).json({ message: "Donation not found" });

        const old = existing.rows[0];
        const oldAmount = parseFloat(old.amount || 0);
        const oldCampaignId = parseInt(old.campaign_id);
        const currentStatus = old.payment_status || 'pending';

        // Values for update
        const newAmount = amount !== undefined ? parseFloat(amount) : oldAmount;
        const newCampaignId = campaign_id !== undefined ? parseInt(campaign_id) : oldCampaignId;
        const amountDiff = newAmount - oldAmount;

        await client.query("BEGIN");

        // 2. Update donation record
        const updated = await client.query(
            `UPDATE donations SET
                amount    = $1,
                message   = COALESCE($2, message),
                frequency = COALESCE($3, frequency),
                campaign_id = $4
             WHERE donation_id = $5 RETURNING *`,
            [newAmount, message !== undefined ? message : null, frequency || null, newCampaignId, id]
        );

        // 3. Sync payment_transactions
        await client.query(
            `UPDATE payment_transactions 
             SET amount = $1, 
                 campaign_id = $2
             WHERE donation_id = $3`,
            [newAmount, newCampaignId, id]
        );

        // 4. Adjust campaign current_amount
        // Only adjust if the donation is in a 'countable' status (completed or pending)
        if (currentStatus === 'completed' || currentStatus === 'pending') {
            if (newCampaignId !== oldCampaignId) {
                // Campaign changed: subtract from old, add to new
                await client.query(
                    `UPDATE campaigns SET current_amount = GREATEST(COALESCE(current_amount,0) - $1, 0), updated_at = NOW() WHERE campaign_id = $2`,
                    [oldAmount, oldCampaignId]
                );
                await client.query(
                    `UPDATE campaigns SET current_amount = COALESCE(current_amount,0) + $1, updated_at = NOW() WHERE campaign_id = $2`,
                    [newAmount, newCampaignId]
                );
            } else if (amountDiff !== 0) {
                // Same campaign, different amount
                await client.query(
                    `UPDATE campaigns SET current_amount = GREATEST(COALESCE(current_amount,0) + $1, 0), updated_at = NOW() WHERE campaign_id = $2`,
                    [amountDiff, oldCampaignId]
                );
            }
        }

        await client.query("COMMIT");
        res.json({ message: "Donation updated", donation: updated.rows[0] });
    } catch (err) {
        if (client) await client.query("ROLLBACK");
        console.error("EDIT DONATION ERROR:", err);
        res.status(500).json({ message: "Server error: " + err.message });
    } finally {
        if (client) client.release();
    }
});

// ─────────────────────────────────────────────
// PATCH /api/donations/:id/cancel-recurring — Request cancellation for monthly donation
// ─────────────────────────────────────────────
router.patch("/:id/cancel-recurring", async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        const result = await pool.query(
            `UPDATE donations 
             SET status = 'pending_cancellation',
                 cancellation_reason = $2
             WHERE donation_id = $1 AND frequency = 'monthly' 
             RETURNING *`,
            [id, reason || null]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Donation plan not found or not recurring." });
        }

        res.json({ message: "Cancellation request submitted to admin.", donation: result.rows[0] });
    } catch (err) {
        console.error("CANCEL RECURRING REQUEST ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// PATCH /api/donations/:id/approve-cancellation — Admin approves cancellation
// ─────────────────────────────────────────────
router.patch("/:id/approve-cancellation", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE donations 
             SET status = 'cancelled', 
                 next_due_date = NULL
             WHERE donation_id = $1 AND (status = 'pending_cancellation' OR status = 'active' OR status IS NULL)
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Donation plan not found or already cancelled." });
        }

        res.json({ message: "Recurring donation cancelled by admin.", donation: result.rows[0] });
    } catch (err) {
        console.error("APPROVE CANCELLATION ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});



// DELETE /api/donations/:id
router.delete("/:id", async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Fetch donation and status before deleting
        const existing = await client.query(
            `SELECT d.amount, d.campaign_id, pt.payment_status
             FROM donations d
             LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
             WHERE d.donation_id = $1`, [req.params.id]
        );

        if (existing.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Donation not found" });
        }

        const { amount, campaign_id, payment_status } = existing.rows[0];
        const txnAmount = parseFloat(amount || 0);
        const status = (payment_status || 'pending').toLowerCase();

        // 2. Delete the donation (CASCADE will handle receipts and transactions if configured, 
        // but we explicitly delete transactions here to be safe and match existing code)
        await client.query(`DELETE FROM payment_transactions WHERE donation_id = $1`, [req.params.id]);
        await client.query(`DELETE FROM donations WHERE donation_id = $1`, [req.params.id]);

        // 3. Subtract from campaign if it was countable
        if (status === 'completed' || status === 'pending') {
            await client.query(
                `UPDATE campaigns 
                 SET current_amount = GREATEST(COALESCE(current_amount,0) - $1, 0), 
                     updated_at = NOW() 
                 WHERE campaign_id = $2`,
                [txnAmount, campaign_id]
            );
        }

        await client.query("COMMIT");
        res.json({ message: "Donation deleted successfully" });
    } catch (err) {
        if (client) await client.query("ROLLBACK");
        console.error("DELETE DONATION ERROR:", err);
        res.status(500).json({ message: "Server error: " + err.message });
    } finally {
        if (client) client.release();
    }
});

// ─────────────────────────────────────────────
// BACKGROUND JOB: Process automated donation reminders (5 Days Before Deadline)
// ─────────────────────────────────────────────
const processAutoReminders = async () => {
    try {
        const query = `
            SELECT
              dr.reminder_id, dr.next_payment,
              d.amount, d.frequency,
              c.campaign_name,
              u.first_name, u.last_name, 
              a.email AS user_email
            FROM donation_reminders dr
            INNER JOIN donations d ON dr.donation_id = d.donation_id
            LEFT JOIN campaigns c ON dr.campaign_id = c.campaign_id
            LEFT JOIN users u ON dr.user_id = u.user_id
            LEFT JOIN auth_users a ON u.user_id = a.user_id
            WHERE dr.is_active = TRUE
              AND dr.next_payment = CURRENT_DATE + INTERVAL '5 days'
              AND (dr.last_reminder_date IS NULL OR dr.last_reminder_date < CURRENT_DATE)
        `;
        const result = await pool.query(query);

        if (result.rowCount > 0) {
            console.log(`[Scheduler] Auto-sending ${result.rowCount} donation deadline reminders (5 days before)...`);
            for (const rem of result.rows) {
                const donorName = rem.first_name ? `${rem.first_name} ${rem.last_name || ""}`.trim() : "valued donor";
                const campaignName = rem.campaign_name || "General Operations";
                const nextPayment = rem.next_payment ? new Date(rem.next_payment).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "N/A";
                const amountStr = `₱${parseFloat(rem.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

                const emailHtml = `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                        <div style="background-color: #63A6B2; padding: 20px; text-align: center; color: white;">
                            <h2 style="margin: 0;">Donation Reminder</h2>
                        </div>
                        <div style="padding: 30px;">
                            <p>Dear ${donorName},</p>
                            <p>We hope this email finds you well. This is a friendly reminder from <strong>SVRTFI</strong> regarding your next scheduled donation for the <strong>${campaignName}</strong> campaign, which is coming up in approximately 5 days.</p>
                            
                            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="color: #666; font-size: 14px;">Amount:</td>
                                        <td style="font-weight: bold; text-align: right;">${amountStr}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #666; font-size: 14px;">Next Payment Date:</td>
                                        <td style="font-weight: bold; text-align: right;">${nextPayment}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #666; font-size: 14px;">Frequency:</td>
                                        <td style="font-weight: bold; text-align: right; text-transform: capitalize;">${rem.frequency}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <p>Your continuous support makes a huge difference in our ability to serve those in need. If you have any questions or need to update your preferences, please don't hesitate to contact us.</p>
                            
                            <p style="margin-top: 30px;">Warmly,<br/>The SVRTFI Team</p>
                        </div>
                        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                            &copy; ${new Date().getFullYear()} SVRTFI Donation System. All rights reserved.
                        </div>
                    </div>
                `;

                await sendEmail(rem.user_email, `Reminder: Your upcoming donation for ${campaignName}`, emailHtml);
                
                // Track that reminder was sent
                await pool.query("UPDATE donation_reminders SET last_reminder_date = CURRENT_DATE WHERE reminder_id = $1", [rem.reminder_id]);
            }
        }
    } catch (err) {
        console.error("[Scheduler] Error processing automatic reminders:", err);
    }
};

// Check every hour (1000 * 60 * 60)
setInterval(processAutoReminders, 60 * 60 * 1000);
// Run once on startup
processAutoReminders();

module.exports = router;
