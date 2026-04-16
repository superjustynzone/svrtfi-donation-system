const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Adding transaction_id column to donations table...");
    await client.query(`ALTER TABLE donations ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(50) UNIQUE`);
    
    console.log("Backfilling transaction_id for existing donations...");
    const result = await client.query(`SELECT donation_id FROM donations WHERE transaction_id IS NULL`);
    for (const row of result.rows) {
      const txnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await client.query(`UPDATE donations SET transaction_id = $1 WHERE donation_id = $2`, [txnId, row.donation_id]);
    }
    
    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    process.exit();
  }
}

migrate();
