// DonationBackend.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
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

            if (user_id) {
                // Logged-in: pull info from users / auth_users
                const userInfo = await client.query(
                    `SELECT u.first_name, u.last_name, u.contact_number, u.address, a.email
                     FROM users u
                     LEFT JOIN auth_users a ON u.user_id = a.user_id
                     WHERE u.user_id = $1`,
                    [user_id]
                );
                if (userInfo.rows.length > 0) {
                    const ui = userInfo.rows[0];
                    firstName = ui.first_name;
                    lastName = ui.last_name;
                    email = ui.email;
                    phone = ui.contact_number;
                    address = ui.address;
                }
            } else {
                // Guest: split donor_name into first / last
                const parts = (donor_name || "").trim().split(/\s+/);
                firstName = parts[0] || null;
                lastName = parts.slice(1).join(" ") || null;
                email = donor_email || null;
                phone = donor_phone || null;
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
                        `UPDATE donors SET first_name=$1, last_name=$2, contact_number=$3, address=$4
                         WHERE donor_id=$5`,
                        [firstName, lastName, phone, address, donorId]
                    );
                }
            }

            if (!donorId) {
                const donorResult = await client.query(
                    `INSERT INTO donors (first_name, last_name, email, contact_number, address)
                     VALUES ($1, $2, $3, $4, $5) RETURNING donor_id`,
                    [firstName, lastName, email, phone, address]
                );
                donorId = donorResult.rows[0].donor_id;
            }

        } else {
            // Truly anonymous: create a blank donors row so admin can still count it
            const donorResult = await client.query(
                `INSERT INTO donors (first_name, last_name, email, contact_number, address)
                 VALUES (NULL, NULL, NULL, NULL, NULL) RETURNING donor_id`,
                []
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
        const donationResult = await client.query(
            `INSERT INTO donations (
                user_id, campaign_id, donor_id, amount, payment_method,
                donation_source, currency, frequency, next_due_date,
                initiated_at, message
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PHP', $7, $8, NOW(), $9)
            RETURNING donation_id, initiated_at`,
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
              dn.contact_number                         AS phone,
              dn.address,
              dn.email,
              COUNT(d.donation_id)::int                 AS donation_count,
              COALESCE(SUM(d.amount), 0)::float         AS total_donated,
              MAX(d.initiated_at)                       AS last_donation_at,
              MIN(d.initiated_at)                       AS first_donation_at,
              BOOL_OR(d.frequency = 'monthly')          AS is_recurring
             FROM donors dn
             INNER JOIN donations d ON dn.donor_id = d.donor_id
             GROUP BY dn.donor_id, dn.first_name, dn.last_name,
                      dn.contact_number, dn.address, dn.email
             ORDER BY total_donated DESC`
        );

        const donors = result.rows;

        const stats = {
            totalDonors: donors.length,
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
              COUNT(d.donation_id)::int                                         AS total_donations,
              COALESCE(SUM(d.amount), 0)::float                                 AS total_amount,
              COUNT(CASE WHEN pt.payment_status = 'pending'   THEN 1 END)::int  AS pending_count,
              COUNT(CASE WHEN pt.payment_status = 'completed' THEN 1 END)::int  AS completed_count,
              COUNT(DISTINCT d.donor_id)::int                                   AS unique_donors,
              COALESCE(AVG(d.amount), 0)::float                                 AS avg_donation
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
              pt.payment_reference, pt.payment_status,
              dn.first_name, dn.last_name
             FROM donations d
             LEFT JOIN campaigns c ON d.campaign_id = c.campaign_id
             LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
             LEFT JOIN donors dn ON d.donor_id = dn.donor_id
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
// GET /api/donations/:id — Get single donation
// ─────────────────────────────────────────────
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
              d.*,
              c.campaign_name, c.campaign_type, c.goal_amount, c.current_amount,
              f.foundation_name,
              pt.payment_reference, pt.payment_status,
              dn.first_name AS donor_first_name, dn.last_name AS donor_last_name,
              dn.email AS donor_email, dn.contact_number AS donor_phone
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
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const donationResult = await client.query(
            `UPDATE donations SET completed_at = NOW() WHERE donation_id = $1 RETURNING *`,
            [req.params.id]
        );

        if (donationResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Donation not found" });
        }

        await client.query(
            `UPDATE payment_transactions SET payment_status = 'completed' WHERE donation_id = $1`,
            [req.params.id]
        );

        await client.query("COMMIT");

        return res.json({
            message: "Donation marked as completed!",
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

module.exports = router;
