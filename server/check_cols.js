const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkCols() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'payment_transactions'");
    console.log('COLUMNS:', res.rows.map(r => r.column_name));
    
    const countRes = await pool.query("SELECT COUNT(*) FROM payment_transactions");
    console.log('COUNT:', countRes.rows[0].count);
    
    const sample = await pool.query("SELECT * FROM payment_transactions LIMIT 1");
    console.log('SAMPLE:', JSON.stringify(sample.rows[0], null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkCols();
