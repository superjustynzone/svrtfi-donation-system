const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkLatestDonations() {
    try {
        console.log("--- LATEST DONATIONS ---");
        const res = await pool.query(`
            SELECT d.donation_id, d.donor_id, d.amount, d.status, dn.email
            FROM donations d
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            ORDER BY d.initiated_at DESC
            LIMIT 5
        `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkLatestDonations();
