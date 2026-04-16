const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Configuring SendGrid with verified sender (noreply@feast.ph)...");
    
    // Using the API Key provided by the user earlier
    const provider = "SendGrid";
    const host = "smtp.sendgrid.net";
    const port = 587;
    const user_email = "apikey";
    const password = process.env.SENDGRID_API_KEY;
    const encryption = "STARTTLS";
    const sender_email = "noreply@feast.ph";

    await client.query(
      "UPDATE smtp_settings SET provider=$1, host=$2, port=$3, user_email=$4, password=$5, encryption=$6, sender_email=$7, updated_at=NOW() WHERE id=1",
      [provider, host, port, user_email, password, encryption, sender_email]
    );
    console.log("✅ SendGrid settings updated successfully.");
  } catch (err) {
    console.error("❌ Failed to update SMTP settings:", err);
  } finally {
    client.release();
    process.exit();
  }
}

main();
