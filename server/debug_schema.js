const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function listTables() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log('--- Database Tables ---');
        console.table(res.rows);

        for (const row of res.rows) {
            const columns = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [row.table_name]);
            console.log(`\n--- ${row.table_name} Columns ---`);
            console.table(columns.rows);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error listing tables:', err.message);
        process.exit(1);
    }
}

listTables();
