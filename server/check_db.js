const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkTable() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'campaign_media'
    `);
        console.log('--- campaign_media columns ---');
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error checking table:', err.message);
        process.exit(1);
    }
}

checkTable();
