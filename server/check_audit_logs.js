const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_logs'");
        console.log("Audit Logs columns:", res.rows.map(r => r.column_name));
        
        const res2 = await pool.query("SELECT conname, confrelid::regclass, json_agg(a.attname) AS cols FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey) WHERE c.conrelid = 'audit_logs'::regclass AND c.contype = 'f' GROUP BY conname, confrelid");
        console.log("Audit Logs FKs:", res2.rows);
    } catch (e) {
        console.log("Error or table does not exist");
    }
    process.exit(0);
}
check();
