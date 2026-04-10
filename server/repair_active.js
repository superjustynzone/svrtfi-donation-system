const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function repairActive() {
    try {
        console.log("Repairing recent donations stuck in 'active' status...");
        await pool.query("UPDATE donations SET status = 'pending' WHERE status = 'active' AND completed_at IS NULL");
        console.log("Done");
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

repairActive();
