const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Reverting SMTP settings to Gmail (from .env)...");
    
    const provider = "Gmail";
    const host = "smtp.gmail.com";
    const port = 465;
    const user_email = process.env.EMAIL_USER;
    const password = process.env.EMAIL_PASS;
    const encryption = "SSL/TLS";
    const sender_email = process.env.EMAIL_USER;

    await client.query(
      "UPDATE smtp_settings SET provider=$1, host=$2, port=$3, user_email=$4, password=$5, encryption=$6, sender_email=$7, updated_at=NOW() WHERE id=1",
      [provider, host, port, user_email, password, encryption, sender_email]
    );
    console.log("✅ SMTP settings reverted to Gmail.");
  } catch (err) {
    console.error("❌ Failed to revert SMTP settings:", err);
  } finally {
    client.release();
    process.exit();
  }
}

main();
