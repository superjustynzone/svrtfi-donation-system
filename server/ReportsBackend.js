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

// GET /api/admin/reports/summary - Overall stats with filters
router.get("/summary", verifyAdmin, async (req, res) => {
    try {
        const { startDate, endDate, campaignId, foundationId, donorId, userId } = req.query;
        let whereClauses = ["(pt.payment_status = 'completed' OR pt.payment_status = 'failed')"];
        let params = [];

        if (startDate) {
            params.push(startDate);
            whereClauses.push(`d.initiated_at >= $${params.length}`);
        }
        if (endDate) {
            params.push(endDate);
            whereClauses.push(`d.initiated_at::date <= $${params.length}`);
        }
        if (campaignId) {
            params.push(campaignId);
            whereClauses.push(`d.campaign_id = $${params.length}`);
        }
        if (donorId) {
            params.push(donorId);
            whereClauses.push(`d.donor_id = $${params.length}`);
        }
        if (userId) {
            params.push(userId);
            whereClauses.push(`d.user_id = $${params.length}`);
        }
        if (foundationId) {
            params.push(foundationId);
            whereClauses.push(`d.campaign_id IN (SELECT campaign_id FROM foundation_campaigns WHERE foundation_id = $${params.length})`);
        }

        const whereString = whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "WHERE 1=1";

        const statsResult = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN pt.payment_status = 'completed' THEN d.amount ELSE 0 END), 0) as total_amount,
                COUNT(*) as total_count,
                COALESCE(AVG(CASE WHEN pt.payment_status = 'completed' THEN d.amount END), 0) as avg_amount,
                COALESCE(MAX(CASE WHEN pt.payment_status = 'completed' THEN d.amount END), 0) as max_donation,
                COUNT(CASE WHEN pt.payment_status = 'failed' THEN 1 END) as failed_count
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            ${whereString}
        `, params);

        // Top Campaigns with filter
        const campaignWhere = whereClauses.filter(c => !c.includes("d.campaign_id =")).join(" AND ");
        const campaignWhereString = campaignWhere ? "WHERE " + campaignWhere : "";
        const topCampaigns = await pool.query(`
            SELECT c.campaign_name, COALESCE(SUM(d.amount), 0) as total
            FROM donations d
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            ${whereString} AND pt.payment_status = 'completed'
            GROUP BY c.campaign_name
            ORDER BY total DESC
            LIMIT 10
        `, params);
        // NOTE: Simplification for campaignWhere params, ideally we'd rebuild the params array too.
        // For now, I'll pass the same params and hope the placeholder indices align if we don't remove them.
        // Actually, let's just use the full params for simplicity if indices match.

        const recentDonations = await pool.query(`
            SELECT 
                d.*, 
                c.campaign_name,
                COALESCE(NULLIF(TRIM(dn.first_name || ' ' || dn.last_name), ''), dn.email, 'Anonymous') as donor_name,
                dn.email as donor_email
            FROM donations d
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            ${whereString} AND pt.payment_status = 'completed' AND dn.email IS NOT NULL AND dn.email != ''
            ORDER BY d.initiated_at DESC
            LIMIT 10
        `, params);

        const topDonors = await pool.query(`
            SELECT 
                COALESCE(NULLIF(TRIM(dn.first_name || ' ' || dn.last_name), ''), dn.email, 'Anonymous') as donor_name,
                SUM(d.amount) as total_amount,
                COUNT(d.donation_id) as donation_count
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            ${whereString} AND pt.payment_status = 'completed' AND dn.email IS NOT NULL AND dn.email != ''
            GROUP BY dn.donor_id, dn.first_name, dn.last_name, dn.email
            ORDER BY total_amount DESC
            LIMIT 10
        `, params);

        res.json({
            summary: statsResult.rows[0],
            topCampaigns: topCampaigns.rows,
            topDonors: topDonors.rows,
            recentDonations: recentDonations.rows
        });
    } catch (err) {
        console.error("Summary report error:", err);
        res.status(500).json({ message: "Failed to generate summary", error: err.message });
    }
});

// GET /api/admin/reports/trends - Data for charts with filters
router.get("/trends", verifyAdmin, async (req, res) => {
    const { interval = 'month', startDate, endDate, campaignId, foundationId, donorId, userId } = req.query;
    
    const allowedIntervals = {
        'week': "DATE_TRUNC('week', d.initiated_at)",
        'month': "DATE_TRUNC('month', d.initiated_at)",
        'day': "DATE_TRUNC('day', d.initiated_at)"
    };

    const dbInterval = allowedIntervals[interval] || allowedIntervals['month'];

    let whereClauses = ["pt.payment_status = 'completed'"];
    let params = [];

    if (startDate) {
        params.push(startDate);
        whereClauses.push(`d.initiated_at >= $${params.length}`);
    }
    if (endDate) {
        params.push(endDate);
        whereClauses.push(`d.initiated_at <= $${params.length}`);
    }
    if (campaignId) {
        params.push(campaignId);
        whereClauses.push(`d.campaign_id = $${params.length}`);
    }
    if (donorId) {
        params.push(donorId);
        whereClauses.push(`d.donor_id = $${params.length}`);
    }
    if (userId) {
        params.push(userId);
        whereClauses.push(`d.user_id = $${params.length}`);
    }
    if (foundationId) {
        params.push(foundationId);
        whereClauses.push(`d.campaign_id IN (SELECT campaign_id FROM foundation_campaigns WHERE foundation_id = $${params.length})`);
    }

    const whereString = "WHERE " + whereClauses.join(" AND ");

    try {
        const query = `
            SELECT 
                ${dbInterval} as period,
                COALESCE(SUM(d.amount), 0) as total_amount,
                COUNT(*) as donation_count
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            ${whereString}
            GROUP BY period
            ORDER BY period ASC
            LIMIT 50
        `;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Trends report error:", err);
        res.status(500).json({ message: "Failed to generate trends", error: err.message });
    }
});

// GET /api/admin/reports/download - CSV Export
router.get("/download", verifyAdmin, async (req, res) => {
    try {
        const { startDate, endDate, campaignId, foundationId, donorId, userId } = req.query;
        let whereClauses = ["pt.payment_status = 'completed'"];
        let params = [];

        if (startDate) {
            params.push(startDate);
            whereClauses.push(`d.initiated_at >= $${params.length}`);
        }
        if (endDate) {
            params.push(endDate);
            whereClauses.push(`d.initiated_at::date <= $${params.length}`);
        }
        if (campaignId) {
            params.push(campaignId);
            whereClauses.push(`d.campaign_id = $${params.length}`);
        }
        if (donorId) {
            params.push(donorId);
            whereClauses.push(`d.donor_id = $${params.length}`);
        }
        if (userId) {
            params.push(userId);
            whereClauses.push(`d.user_id = $${params.length}`);
        }
        if (foundationId) {
            params.push(foundationId);
            whereClauses.push(`d.campaign_id IN (SELECT campaign_id FROM foundation_campaigns WHERE foundation_id = $${params.length})`);
        }

        const whereString = "WHERE " + whereClauses.join(" AND ");

        const query = `
            SELECT 
                d.donation_id,
                d.initiated_at as date,
                COALESCE(NULLIF(TRIM(dn.first_name || ' ' || dn.last_name), ''), dn.email, 'Anonymous') as donor_name,
                c.campaign_name,
                d.amount,
                d.payment_method,
                pt.payment_reference,
                dn.email as donor_email
            FROM donations d
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            ${whereString} AND dn.email IS NOT NULL AND dn.email != ''
            ORDER BY d.initiated_at DESC
        `;

        const result = await pool.query(query, params);
        
        // Generate CSV
        const header = ["Donation ID", "Date", "Donor", "Campaign", "Amount", "Method", "Reference"];
        const rows = result.rows.map(r => [
            r.donation_id,
            new Date(r.date).toLocaleString(),
            r.donor_name,
            r.campaign_name,
            r.amount,
            r.payment_method,
            r.payment_reference
        ]);

        const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=donation_report.csv');
        res.send(csvContent);

    } catch (err) {
        console.error("Export error:", err);
        res.status(500).json({ message: "Failed to export report" });
    }
});

// GET /api/admin/reports/distribution - Data for campaign distribution doughnut chart
router.get("/distribution", verifyAdmin, async (req, res) => {
    try {
        const { startDate, endDate, campaignId, foundationId, donorId, userId } = req.query;
        let whereClauses = ["pt.payment_status = 'completed'"];
        let params = [];

        if (startDate) {
            params.push(startDate);
            whereClauses.push(`d.initiated_at >= $${params.length}`);
        }
        if (endDate) {
            params.push(endDate);
            whereClauses.push(`d.initiated_at::date <= $${params.length}`);
        }
        if (campaignId) {
            params.push(campaignId);
            whereClauses.push(`d.campaign_id = $${params.length}`);
        }
        if (foundationId) {
            params.push(foundationId);
            whereClauses.push(`d.campaign_id IN (SELECT campaign_id FROM foundation_campaigns WHERE foundation_id = $${params.length})`);
        }
        if (donorId) {
            params.push(donorId);
            whereClauses.push(`d.donor_id = $${params.length}`);
        }

        const whereString = "WHERE " + whereClauses.join(" AND ");

        const query = `
            SELECT 
                c.campaign_name as label,
                SUM(d.amount) as value
            FROM donations d
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            ${whereString}
            GROUP BY c.campaign_name
            ORDER BY value DESC
            LIMIT 10
        `;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("DISTRIBUTION ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/admin/reports/payment-methods - Data for payment method distribution
router.get("/payment-methods", verifyAdmin, async (req, res) => {
    try {
        const { startDate, endDate, campaignId, foundationId, donorId, userId } = req.query;
        let whereClauses = ["pt.payment_status = 'completed'"];
        let params = [];

        if (startDate) {
            params.push(startDate);
            whereClauses.push(`d.initiated_at >= $${params.length}`);
        }
        if (endDate) {
            params.push(endDate);
            whereClauses.push(`d.initiated_at::date <= $${params.length}`);
        }
        if (campaignId) {
            params.push(campaignId);
            whereClauses.push(`d.campaign_id = $${params.length}`);
        }
        if (foundationId) {
            params.push(foundationId);
            whereClauses.push(`d.campaign_id IN (SELECT campaign_id FROM foundation_campaigns WHERE foundation_id = $${params.length})`);
        }

        const whereString = "WHERE " + whereClauses.join(" AND ");

        const statsResult = await pool.query(`
            SELECT 
                d.payment_method as label,
                COUNT(*) as value
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            ${whereString}
            GROUP BY d.payment_method
            ORDER BY value DESC
        `, params);

        res.json(statsResult.rows);
    } catch (err) {
        console.error("PAYMENT METHODS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
