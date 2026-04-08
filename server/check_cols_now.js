const { Pool } = require("pg");
require("dotenv").config({ path: "../.env" });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const d = (await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'donors'")).rows.map(r => r.column_name);
  const u = (await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")).rows.map(r => r.column_name);
  const dn = (await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'donations'")).rows.map(r => r.column_name);
  console.log(JSON.stringify({ donors: d, users: u, donations: dn }));
  process.exit(0);
}
run();
