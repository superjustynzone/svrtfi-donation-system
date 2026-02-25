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
            donor_name,
            donor_email,
            donor_phone,
            message,
        } = req.body;

        if (!campaign_id || !amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ message: "Campaign ID and a positive amount are required." });
        }

        await client.query("BEGIN");

        // Map frontend donation_type to DB frequency
        const frequency = donation_type === "monthly" ? "monthly" : "one_time";
        const next_due_date =
            frequency === "monthly"
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                : null;

        // 1. Insert into donations table
        const donationResult = await client.query(
            `INSERT INTO donations (
        user_id, campaign_id, amount, payment_method,
        donation_source, currency, frequency, next_due_date,
        initiated_at, message
      ) VALUES ($1, $2, $3, $4, $5, 'PHP', $6, $7, NOW(), $8)
      RETURNING donation_id, initiated_at`,
            [
                user_id || null,
                campaign_id,
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

        // 2. Insert into payment_transactions table
        await client.query(
            `INSERT INTO payment_transactions (
        donation_id, campaign_id, payment_reference, amount, payment_status
      ) VALUES ($1, $2, $3, $4, 'pending')`,
            [donation.donation_id, campaign_id, paymentReference, parseFloat(amount)]
        );

        // 3. Update campaigns.current_amount
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
// GET /api/donations/donors — Get aggregated donor list (admin)
// ─────────────────────────────────────────────
router.get("/donors", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
          u.user_id,
          u.first_name,
          u.last_name,
          u.contact_number                          AS phone,
          u.address,
          a.email,
          COUNT(d.donation_id)::int                 AS donation_count,
          COALESCE(SUM(d.amount), 0)::float         AS total_donated,
          MAX(d.initiated_at)                       AS last_donation_at,
          MIN(d.initiated_at)                       AS first_donation_at,
          BOOL_OR(d.frequency = 'monthly')          AS is_recurring
         FROM users u
         LEFT JOIN auth_users a ON u.user_id = a.user_id
         INNER JOIN donations d ON u.user_id = d.user_id
         GROUP BY u.user_id, u.first_name, u.last_name, u.contact_number,
                  u.address, a.email
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
          COUNT(d.donation_id)::int               AS total_donations,
          COALESCE(SUM(d.amount), 0)::float        AS total_amount,
          COUNT(CASE WHEN pt.payment_status = 'pending'   THEN 1 END)::int AS pending_count,
          COUNT(CASE WHEN pt.payment_status = 'completed' THEN 1 END)::int AS completed_count,
          COUNT(DISTINCT d.user_id)::int           AS unique_donors,
          COALESCE(AVG(d.amount), 0)::float        AS avg_donation
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
        u.first_name, u.last_name
       FROM donations d
       LEFT JOIN campaigns c ON d.campaign_id = c.campaign_id
       LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
       LEFT JOIN users u ON d.user_id = u.user_id
       ORDER BY d.initiated_at DESC`
        );

        res.json(result.rows);
    } catch (err) {
        console.error("GET ALL DONATIONS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ─────────────────────────────────────────────
// GET /api/donations/user/:userId — Donations by user
// ─────────────────────────────────────────────
router.get("/user/:userId", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
        d.*,
        c.campaign_name, c.campaign_type,
        pt.payment_reference, pt.payment_status
       FROM donations d
       LEFT JOIN campaigns c ON d.campaign_id = c.campaign_id
       LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
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
        u.first_name AS donor_first_name, u.last_name AS donor_last_name,
        a.email AS donor_email_from_auth
       FROM donations d
       LEFT JOIN campaigns c ON d.campaign_id = c.campaign_id
       LEFT JOIN foundation_campaigns fc ON c.campaign_id = fc.campaign_id
       LEFT JOIN foundations f ON fc.foundation_id = f.foundation_id
       LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
       LEFT JOIN users u ON d.user_id = u.user_id
       LEFT JOIN auth_users a ON u.user_id = a.user_id
       WHERE d.donation_id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Donation not found" });
        }

        // Shape the response to match what the frontend expects
        const row = result.rows[0];
        const donation = {
            ...row,
            donor_name: row.donor_first_name
                ? `${row.donor_first_name} ${row.donor_last_name || ""}`.trim()
                : "Anonymous",
            donor_email: row.donor_email_from_auth || null,
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

        // Update donation completed_at
        const donationResult = await client.query(
            `UPDATE donations SET completed_at = NOW() WHERE donation_id = $1 RETURNING *`,
            [req.params.id]
        );

        if (donationResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Donation not found" });
        }

        // Update payment_transactions status
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
