const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active'");
    console.log(res.rows.length > 0 ? "is_active exists" : "is_active does NOT exist");
    process.exit(0);
}
check();
