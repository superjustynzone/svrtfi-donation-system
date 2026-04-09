const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
    const res = await pool.query("SELECT DISTINCT table_name FROM information_schema.columns WHERE column_name = 'user_id'");
    console.log(res.rows.map(r => r.table_name));
    process.exit(0);
}
check();
