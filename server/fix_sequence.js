const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  try {
    const res = await pool.query("SELECT setval(pg_get_serial_sequence('email_logs', 'log_id'), COALESCE(max(log_id)+1, 1), false) FROM email_logs;");
    console.log('Sequence updated', res.rows);
  } catch(e) {
    console.error('Error', e);
  } finally {
    pool.end();
  }
}

fix();
