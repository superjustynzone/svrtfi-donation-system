const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    try {
        const res = await pool.query("SELECT * FROM subscribers LIMIT 1");
        console.log("SUBSCRIBERS_COLUMNS:", Object.keys(res.rows[0] || {}));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
