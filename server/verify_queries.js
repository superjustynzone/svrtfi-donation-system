const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function verify() {
    console.log("🔍 Verifying Dashboard Stats Query...");
    try {
        const statsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(d.amount), 0) as total_donations,
        COUNT(DISTINCT d.user_id) as active_donors,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'publish') as active_campaigns,
        COALESCE(AVG(d.amount), 0) as avg_donation
      FROM donations d
      JOIN payment_transactions pt ON d.donation_id = pt.donation_id
      WHERE pt.payment_status = 'completed'
    `);
        console.log("✅ Dashboard stats successful:", statsResult.rows[0]);
    } catch (err) {
        console.error("❌ Dashboard stats failed:", err.message);
    }

    console.log("\n🔍 Verifying Recent Donations Query...");
    try {
        const recentResult = await pool.query(`
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
    `);
        console.log("✅ Recent donations successful. Row count:", recentResult.rows.length);
    } catch (err) {
        console.error("❌ Recent donations failed:", err.message);
    }

    console.log("\n🔍 Verifying Reports Summary Query...");
    try {
        const summaryResult = await pool.query(`
      SELECT 
        COALESCE(SUM(d.amount), 0) as total_amount,
        COUNT(*) as total_count,
        COALESCE(AVG(d.amount), 0) as avg_amount,
        COALESCE(MAX(d.amount), 0) as max_donation
      FROM donations d
      JOIN payment_transactions pt ON d.donation_id = pt.donation_id
      WHERE pt.payment_status = 'completed'
    `);
        console.log("✅ Reports summary successful:", summaryResult.rows[0]);
    } catch (err) {
        console.error("❌ Reports summary failed:", err.message);
    }

    await pool.end();
}

verify();
