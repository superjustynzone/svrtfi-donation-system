const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        await pool.query("UPDATE email_campaigns SET associated_campaign_id = NULL WHERE category = 'email_blast'");
        console.log('Cleared campaign association for all email blasts.');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
