const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Auth Middleware ──────────────────────────────────────────────────────────
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
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// ── GA4 Client (lazy-init so missing config is graceful) ─────────────────────
let gaClient = null;
let gaConfigured = false;

// Startup diagnostics
const _gaPropertyId = process.env.GA_PROPERTY_ID;
const _gaKeyFile    = process.env.GA_KEY_FILE_PATH;
console.log("🔍 [AnalyticsBackend] GA_PROPERTY_ID:", _gaPropertyId || "NOT SET");
console.log("🔍 [AnalyticsBackend] GA_KEY_FILE_PATH:", _gaKeyFile || "NOT SET");
if (_gaKeyFile) {
    const _resolvedKey = path.isAbsolute(_gaKeyFile)
        ? _gaKeyFile
        : path.join(__dirname, _gaKeyFile);
    const fs = require("fs");
    console.log("🔍 [AnalyticsBackend] Resolved key path:", _resolvedKey);
    console.log("🔍 [AnalyticsBackend] Key file exists:", fs.existsSync(_resolvedKey));
}

function getGAClient() {
    if (gaClient) return gaClient;
    const propertyId = process.env.GA_PROPERTY_ID;
    const keyFile    = process.env.GA_KEY_FILE_PATH;
    if (!propertyId || !keyFile) {
        console.warn("⚠️  [GA4] Missing env vars — GA_PROPERTY_ID:", propertyId, "GA_KEY_FILE_PATH:", keyFile);
        return null;
    }

    try {
        const { BetaAnalyticsDataClient } = require("@google-analytics/data");
        const resolvedKey = path.isAbsolute(keyFile)
            ? keyFile
            : path.join(__dirname, keyFile);
        console.log("🔑 [GA4] Initializing client with key:", resolvedKey);
        gaClient = new BetaAnalyticsDataClient({ keyFilename: resolvedKey });
        gaConfigured = true;
        console.log("✅ [GA4] Client initialized successfully for property:", propertyId);
        return gaClient;
    } catch (err) {
        console.error("❌ [GA4] Client init failed:", err.message);
        console.error(err.stack);
        return null;
    }
}

const GA_PROPERTY = () => `properties/${process.env.GA_PROPERTY_ID}`;

// ── Helper: run a GA4 report ─────────────────────────────────────────────────
async function runGAReport(dimensions, metrics, dateRange = "30daysAgo") {
    const client = getGAClient();
    if (!client) return null;
    try {
        const [response] = await client.runReport({
            property: GA_PROPERTY(),
            dateRanges: [{ startDate: dateRange, endDate: "today" }],
            dimensions,
            metrics,
        });
        return response;
    } catch (err) {
        console.error("GA4 runReport error:", err.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/analytics/ga-overview
// Total users, sessions, page views over last 30 days
// ─────────────────────────────────────────────────────────────────────────────
router.get("/ga-overview", verifyAdmin, async (req, res) => {
    const { days = "30" } = req.query;
    const dateRange = `${parseInt(days) || 30}daysAgo`;

    const data = await runGAReport(
        [],
        [
            { name: "totalUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "bounceRate" },
            { name: "averageSessionDuration" },
        ],
        dateRange
    );

    if (!data) {
        return res.json({
            configured: false,
            message: "Google Analytics not configured. Add GA_PROPERTY_ID and GA_KEY_FILE_PATH to your .env file.",
        });
    }

    const row = data.rows?.[0]?.metricValues || [];
    res.json({
        configured: true,
        totalUsers:              parseInt(row[0]?.value || 0),
        sessions:                parseInt(row[1]?.value || 0),
        pageViews:               parseInt(row[2]?.value || 0),
        bounceRate:              parseFloat(row[3]?.value || 0).toFixed(1),
        avgSessionDuration:      parseFloat(row[4]?.value || 0).toFixed(0),
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/analytics/ga-geography
// Users by country and city (top 10 countries)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/ga-geography", verifyAdmin, async (req, res) => {
    const { days = "30" } = req.query;
    const dateRange = `${parseInt(days) || 30}daysAgo`;

    const [countryData, cityData] = await Promise.all([
        runGAReport([{ name: "country" }], [{ name: "totalUsers" }, { name: "sessions" }], dateRange),
        runGAReport([{ name: "city" }],    [{ name: "totalUsers" }], dateRange),
    ]);

    if (!countryData) {
        return res.json({ configured: false, message: "Google Analytics not configured." });
    }

    const countries = (countryData.rows || []).slice(0, 15).map(row => ({
        country:  row.dimensionValues[0]?.value || "Unknown",
        users:    parseInt(row.metricValues[0]?.value || 0),
        sessions: parseInt(row.metricValues[1]?.value || 0),
    }));

    const cities = (cityData?.rows || []).slice(0, 10).map(row => ({
        city:  row.dimensionValues[0]?.value || "Unknown",
        users: parseInt(row.metricValues[0]?.value || 0),
    }));

    res.json({ configured: true, countries, cities });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/analytics/ga-devices
// Sessions breakdown: device category + operating system
// ─────────────────────────────────────────────────────────────────────────────
router.get("/ga-devices", verifyAdmin, async (req, res) => {
    const { days = "30" } = req.query;
    const dateRange = `${parseInt(days) || 30}daysAgo`;

    const [deviceData, osData] = await Promise.all([
        runGAReport([{ name: "deviceCategory" }],  [{ name: "sessions" }, { name: "totalUsers" }], dateRange),
        runGAReport([{ name: "operatingSystem" }],  [{ name: "sessions" }], dateRange),
    ]);

    if (!deviceData) {
        return res.json({ configured: false, message: "Google Analytics not configured." });
    }

    // Desktop / Mobile / Tablet
    const deviceCategories = (deviceData.rows || []).map(row => ({
        device:   row.dimensionValues[0]?.value || "Other",
        sessions: parseInt(row.metricValues[0]?.value || 0),
        users:    parseInt(row.metricValues[1]?.value || 0),
    }));

    // OS breakdown — map to iOS / Android / Windows / macOS / etc.
    const osSessions = (osData?.rows || []).map(row => ({
        os:       row.dimensionValues[0]?.value || "Other",
        sessions: parseInt(row.metricValues[0]?.value || 0),
    }));

    // Aggregate iOS + Android for mobile
    const iosSessions     = osSessions.filter(r => r.os === "iOS").reduce((a, r) => a + r.sessions, 0);
    const androidSessions = osSessions.filter(r => r.os === "Android").reduce((a, r) => a + r.sessions, 0);
    const desktopSessions = deviceCategories.find(r => r.device === "desktop")?.sessions || 0;
    const mobileSessions  = deviceCategories.find(r => r.device === "mobile")?.sessions  || 0;
    const tabletSessions  = deviceCategories.find(r => r.device === "tablet")?.sessions  || 0;

    res.json({
        configured: true,
        deviceCategories,
        osSessions: osSessions.slice(0, 10),
        summary: {
            ios:     iosSessions,
            android: androidSessions,
            desktop: desktopSessions,
            mobile:  mobileSessions - iosSessions - androidSessions > 0
                         ? mobileSessions - iosSessions - androidSessions
                         : 0,
            tablet:  tabletSessions,
        },
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/analytics/partial-donations
// Donations with status = 'pending' or 'initiated' (never completed)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/partial-donations", verifyAdmin, async (req, res) => {
    try {
        const { startDate, endDate, campaignId, limit = 50 } = req.query;
        let whereClauses = [`(pt.payment_status = 'pending' OR pt.payment_status = 'initiated' OR pt.payment_status = 'failed')`];
        let params = [];

        if (startDate) { params.push(startDate); whereClauses.push(`d.initiated_at >= $${params.length}`); }
        if (endDate)   { params.push(endDate);   whereClauses.push(`d.initiated_at::date <= $${params.length}`); }
        if (campaignId){ params.push(campaignId); whereClauses.push(`d.campaign_id = $${params.length}`); }

        const result = await pool.query(`
            SELECT
                d.donation_id,
                d.initiated_at,
                d.amount,
                d.payment_method,
                COALESCE(NULLIF(TRIM(dn.first_name || ' ' || dn.last_name), ''), dn.email, 'Anonymous') AS donor_name,
                dn.email                  AS donor_email,
                c.campaign_name,
                pt.payment_status,
                pt.payment_reference
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            WHERE ${whereClauses.join(" AND ")}
            ORDER BY d.initiated_at DESC
            LIMIT $${params.push(parseInt(limit) || 50)}
        `, params);

        // Count totals per status
        const countResult = await pool.query(`
            SELECT pt.payment_status, COUNT(*) AS count, COALESCE(SUM(d.amount), 0) AS total_amount
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            WHERE pt.payment_status IN ('pending', 'initiated', 'failed')
            GROUP BY pt.payment_status
        `);

        res.json({
            donations: result.rows,
            summary: countResult.rows,
        });
    } catch (err) {
        console.error("Partial donations error:", err);
        res.status(500).json({ message: "Failed to fetch partial donations", error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/analytics/top-donors-per-campaign
// Top 5 donors for each campaign (completed donations only)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/top-donors-per-campaign", verifyAdmin, async (req, res) => {
    try {
        const { campaignId, limit = 5 } = req.query;
        const maxRank = parseInt(limit) || 5;
        // Build params only for optional campaignId filter — limit is applied in JS
        let params = [];
        let campFilter = campaignId ? `AND d.campaign_id = $${params.push(parseInt(campaignId))}` : "";

        const result = await pool.query(`
            SELECT
                c.campaign_id,
                c.campaign_name,
                COALESCE(NULLIF(TRIM(dn.first_name || ' ' || dn.last_name), ''), dn.email, 'Anonymous') AS donor_name,
                dn.email                   AS donor_email,
                SUM(d.amount)              AS total_amount,
                COUNT(d.donation_id)       AS donation_count,
                ROW_NUMBER() OVER (
                    PARTITION BY c.campaign_id
                    ORDER BY SUM(d.amount) DESC
                ) AS rank_in_campaign
            FROM donations d
            JOIN payment_transactions pt ON d.donation_id = pt.donation_id
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            WHERE pt.payment_status = 'completed'
              AND dn.email IS NOT NULL AND dn.email != ''
              ${campFilter}
            GROUP BY c.campaign_id, c.campaign_name, dn.donor_id, dn.first_name, dn.last_name, dn.email
        `, params);

        // Group by campaign
        const campaignMap = {};
        for (const row of result.rows) {
            if (row.rank_in_campaign > (parseInt(limit) || 5)) continue;
            if (!campaignMap[row.campaign_id]) {
                campaignMap[row.campaign_id] = {
                    campaign_id:   row.campaign_id,
                    campaign_name: row.campaign_name,
                    donors: [],
                };
            }
            campaignMap[row.campaign_id].donors.push({
                rank:           row.rank_in_campaign,
                donor_name:     row.donor_name,
                donor_email:    row.donor_email,
                total_amount:   parseFloat(row.total_amount),
                donation_count: parseInt(row.donation_count),
            });
        }

        res.json(Object.values(campaignMap).sort((a, b) => a.campaign_name.localeCompare(b.campaign_name)));
    } catch (err) {
        console.error("Top donors per campaign error:", err);
        res.status(500).json({ message: "Failed to fetch top donors per campaign", error: err.message });
    }
});

module.exports = router;
