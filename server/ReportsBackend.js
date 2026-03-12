const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Middleware to verify admin token
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "No token provided" });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!["admin", "finance", "encoder", "auditor"].includes(decoded.role)) {
            return res.status(403).json({ message: "Access denied." });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// GET /api/admin/reports/summary - Overall stats
router.get("/summary", verifyAdmin, async (req, res) => {
    try {
        console.log("Generating summary report for user:", req.user.email);
        const statsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(d.amount), 0) as total_amount,
        COUNT(*) as total_count,
        COALESCE(AVG(d.amount), 0) as avg_amount,
        COALESCE(MAX(d.amount), 0) as max_donation,
        COUNT(CASE WHEN pt.payment_status = 'failed' THEN 1 END) as failed_count
      FROM donations d
      JOIN payment_transactions pt ON d.donation_id = pt.donation_id
      WHERE pt.payment_status = 'completed' OR pt.payment_status = 'failed'
    `);

        const topCampaigns = await pool.query(`
      SELECT c.campaign_name, COALESCE(SUM(d.amount), 0) as total
      FROM donations d
      JOIN campaigns c ON d.campaign_id = c.campaign_id
      JOIN payment_transactions pt ON d.donation_id = pt.donation_id
      WHERE pt.payment_status = 'completed'
      GROUP BY c.campaign_name
      ORDER BY total DESC
      LIMIT 10
    `);

        const recentDonations = await pool.query(`
            SELECT 
                d.*, 
                c.campaign_name,
                COALESCE(NULLIF(TRIM(dn.first_name || ' ' || dn.last_name), ''), 'Anonymous') as donor_name
            FROM donations d
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            WHERE pt.payment_status = 'completed'
            ORDER BY d.initiated_at DESC
            LIMIT 5
        `);

        res.json({
            summary: statsResult.rows[0],
            topCampaigns: topCampaigns.rows,
            recentDonations: recentDonations.rows
        });
    } catch (err) {
        console.error("Summary report error:", err);
        res.status(500).json({ message: "Failed to generate summary", error: err.message });
    }
});

// GET /api/admin/reports/trends - Data for charts (Weekly/Monthly)
router.get("/trends", verifyAdmin, async (req, res) => {
    const { interval = 'month' } = req.query;
    console.log("Generating trends report. Interval:", interval);

    const allowedIntervals = {
        'week': "DATE_TRUNC('week', d.initiated_at)",
        'month': "DATE_TRUNC('month', d.initiated_at)",
        'day': "DATE_TRUNC('day', d.initiated_at)"
    };

    const dbInterval = allowedIntervals[interval] || allowedIntervals['month'];

    try {
        const query = `
      SELECT 
        ${dbInterval} as period,
        COALESCE(SUM(d.amount), 0) as total_amount,
        COUNT(*) as donation_count
      FROM donations d
      JOIN payment_transactions pt ON d.donation_id = pt.donation_id
      WHERE pt.payment_status = 'completed'
      GROUP BY period
      ORDER BY period ASC
      LIMIT 12
    `;

        const result = await pool.query(query);
        res.json(Array.isArray(result.rows) ? result.rows : []);
    } catch (err) {
        console.error("Trends report error:", err);
        res.status(500).json({ message: "Failed to generate trends", error: err.message });
    }
});

module.exports = router;
