const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function alterDefault() {
    try {
        console.log("Altering default value of status to pending...");
        await pool.query("ALTER TABLE donations ALTER COLUMN status SET DEFAULT 'pending'");
        console.log("Done");
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

alterDefault();
