const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const fs = require('fs');

async function run() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        fs.writeFileSync('tables.json', JSON.stringify(res.rows, null, 2), 'utf-8');
        console.log('Tables written to tables.json');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
