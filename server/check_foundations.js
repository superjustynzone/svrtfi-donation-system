const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkFoundationsTable() {
    try {
        console.log("--- FOUNDATIONS TABLE ---");
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'foundations'");
        console.table(res.rows);

        const row = await pool.query("SELECT * FROM foundations LIMIT 1");
        console.log("Sample row:", row.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkFoundationsTable();
