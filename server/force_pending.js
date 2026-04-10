const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function forcePending() {
    try {
        console.log("Forcing 'active' donations to 'pending'...");
        await pool.query("UPDATE donations SET status = 'pending' WHERE status = 'active'");
        console.log("Done");
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

forcePending();
