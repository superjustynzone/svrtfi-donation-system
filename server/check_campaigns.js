
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    const res = await pool.query("SELECT campaign_id, campaign_name, status FROM campaigns");
    console.log(res.rows);
    await pool.end();
}
check();
