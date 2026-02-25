const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Middleware to verify admin/finance/auditor token
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
        console.error("verifyAdmin Error:", error.message);
        return res.status(401).json({ message: "Invalid token" });
    }
};

// GET /api/admin/dashboard - Aggregated data for the dashboard
router.get("/", verifyAdmin, async (req, res) => {
    console.log("Dashboard data request from:", req.user?.email);
    try {
        // 1. Core Summary Stats
        const statsQuery = `
            SELECT 
                COALESCE(SUM(d.amount), 0) as total_donations,
                COUNT(DISTINCT d.user_id) as active_donors,
                (SELECT COUNT(*) FROM campaigns WHERE status = 'publish') as active_campaigns,
                COALESCE(AVG(d.amount), 0) as avg_donation
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            WHERE pt.payment_status = 'completed'
        `;
        const statsResult = await pool.query(statsQuery);
        const stats = statsResult.rows[0];

        // 2. Donation Trends (Monthly - last 12 months)
        const trendsQuery = `
            SELECT 
                TO_CHAR(DATE_TRUNC('month', d.initiated_at), 'Mon') as month,
                COALESCE(SUM(d.amount), 0) as amount
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            WHERE pt.payment_status = 'completed' 
              AND d.initiated_at > NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', d.initiated_at)
            ORDER BY DATE_TRUNC('month', d.initiated_at) ASC
        `;
        const trendsResult = await pool.query(trendsQuery);

        // 3. Top Campaigns (Progress based on target)
        const topCampaignsQuery = `
            SELECT 
                c.campaign_name as name,
                COALESCE(sub.raised, 0) as raised,
                c.goal_amount as goal,
                CASE 
                    WHEN c.goal_amount > 0 THEN ROUND((COALESCE(sub.raised, 0) / c.goal_amount) * 100)
                    ELSE 0 
                END as progress
            FROM campaigns c
            LEFT JOIN (
                SELECT d.campaign_id, SUM(d.amount) as raised 
                FROM donations d
                JOIN payment_transactions pt ON d.donation_id = pt.donation_id
                WHERE pt.payment_status = 'completed' 
                GROUP BY d.campaign_id
            ) sub ON c.campaign_id = sub.campaign_id
            ORDER BY raised DESC
            LIMIT 5
        `;
        const topCampaignsResult = await pool.query(topCampaignsQuery);

        // 4. Recent Donations
        const recentDonationsQuery = `
            SELECT 
                d.donation_id as id,
                COALESCE(u.first_name || ' ' || u.last_name, 'Anonymous') as donor_name,
                a.email as donor_email,
                c.campaign_name as campaign,
                d.amount,
                d.payment_method as method,
                pt.payment_status as status,
                TO_CHAR(d.initiated_at, 'Mon DD, YYYY') as date,
                UPPER(LEFT(COALESCE(u.first_name, 'A'), 1) || LEFT(COALESCE(u.last_name, 'N'), 1)) as initials
            FROM donations d
            LEFT JOIN campaigns c ON d.campaign_id = c.campaign_id
            LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            LEFT JOIN users u ON d.user_id = u.user_id
            LEFT JOIN auth_users a ON u.user_id = a.user_id
            ORDER BY d.initiated_at DESC
            LIMIT 5
        `;
        const recentDonationsResult = await pool.query(recentDonationsQuery);

        // 5. Recent Activity (From Audit Logs)
        const activityQuery = `
            SELECT 
                a.audit_id as id,
                COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), 'System/Deleted User') as user,
                a.action,
                a.details,
                CASE 
                    WHEN a.action ILIKE '%donation%' THEN 'dollar'
                    WHEN a.action ILIKE '%user%' THEN 'user'
                    WHEN a.action ILIKE '%campaign%' THEN 'chart'
                    ELSE 'file'
                END as icon,
                CASE 
                    WHEN a.timestamp > NOW() - INTERVAL '1 hour' THEN 'Just recently'
                    WHEN a.timestamp > NOW() - INTERVAL '1 day' THEN 'Earlier today'
                    ELSE TO_CHAR(a.timestamp, 'Mon DD')
                END as time
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.user_id
            ORDER BY a.timestamp DESC
            LIMIT 6
        `;
        const activityResult = await pool.query(activityQuery);

        // 6. Payment method distribution
        const paymentStatsQuery = `
            SELECT 
                d.payment_method as name,
                ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM donations d2 JOIN payment_transactions pt2 ON d2.donation_id = pt2.donation_id WHERE pt2.payment_status = 'completed'), 0), 0) as percentage
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            WHERE pt.payment_status = 'completed'
            GROUP BY d.payment_method
        `;
        const paymentStatsResult = await pool.query(paymentStatsQuery);

        // 7. Donor Types
        const donorTypesQuery = `
          SELECT 
            COUNT(CASE WHEN frequency = 'monthly' THEN 1 END) as recurring,
            COUNT(CASE WHEN frequency = 'one_time' THEN 1 END) as one_time
          FROM donations d
          JOIN payment_transactions pt ON d.donation_id = pt.donation_id
          WHERE pt.payment_status = 'completed'
        `;
        const donorTypesResult = await pool.query(donorTypesQuery);
        const donorTypesRaw = donorTypesResult.rows[0];

        res.json({
            stats: {
                totalDonations: parseFloat(stats.total_donations),
                activeDonors: parseInt(stats.active_donors),
                activeCampaigns: parseInt(stats.active_campaigns),
                avgDonation: parseFloat(stats.avg_donation),
                trends: {
                    donations: 0,
                    donors: 0,
                    campaigns: 0,
                    avgDonation: 0
                }
            },
            donationTrends: trendsResult.rows,
            topCampaigns: topCampaignsResult.rows,
            recentDonations: recentDonationsResult.rows.map(d => ({
                ...d,
                donor: {
                    name: d.donor_name,
                    email: d.donor_email,
                    initials: d.initials,
                    color: 'from-blue-400 to-blue-600'
                }
            })),
            recentActivity: activityResult.rows,
            paymentMethods: paymentStatsResult.rows,
            donorTypes: {
                recurring: parseInt(donorTypesRaw.recurring),
                oneTime: parseInt(donorTypesRaw.one_time)
            }
        });

    } catch (err) {
        console.error("Dashboard error:", err.message);
        res.status(500).json({ message: "Failed to load dashboard data" });
    }
});

module.exports = router;

module.exports = router;
