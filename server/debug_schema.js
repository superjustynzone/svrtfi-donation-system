const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    const tables = ['payment_transactions', 'donations', 'donors'];
    for (const table of tables) {
        const columns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1
        `, [table]);
        console.log(`--- ${table} ---`);
        columns.rows.forEach(r => console.log(r.column_name));
    }
    process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
