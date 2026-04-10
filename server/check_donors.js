const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkDonorsTable() {
    try {
        console.log("--- DONORS TABLE ---");
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'donors'");
        console.table(res.rows);

        const donor = await pool.query("SELECT * FROM donors LIMIT 1");
        console.log("Sample row:", donor.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkDonorsTable();
