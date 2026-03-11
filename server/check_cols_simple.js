const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkCols() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'payment_transactions'");
    console.log('COLUMNS_JOINED:', res.rows.map(r => r.column_name).join(', '));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkCols();
