const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const fs = require('fs');

async function run() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'donation_reminders'");
        fs.writeFileSync('reminders_schema.json', JSON.stringify(res.rows, null, 2), 'utf-8');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
