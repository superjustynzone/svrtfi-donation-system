const { sendEmail, clearTransporterCache } = require('./EmailService');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
    console.log("🚀 Testing Provider Switch Stability...");
    
    const recipient = "superjustyn01@gmail.com";
    const subject = "Provider Switch Test";

    // 1. Set to SendGrid
    console.log("➡️ Switching to SendGrid...");
    await pool.query("UPDATE smtp_settings SET provider='SendGrid', host='smtp.sendgrid.net', port=587, user_email='apikey', password=$1, encryption='STARTTLS', sender_email='noreply@feast.ph' WHERE id=1", [process.env.SENDGRID_API_KEY]);
    clearTransporterCache();
    
    let res1 = await sendEmail(recipient, subject, "Testing SendGrid");
    console.log("SendGrid Result:", res1.success ? "✅ Success" : "❌ Failed: " + res1.error);

    // 2. Wait 2 seconds
    console.log("⏳ Waiting 2 seconds...");
    await new Promise(r => setTimeout(r, 2000));

    // 3. Set to Gmail
    console.log("➡️ Switching to Gmail...");
    // Use fallback to ENV for Gmail
    await pool.query("UPDATE smtp_settings SET provider='Gmail', host='smtp.gmail.com', port=465, user_email='superjustyn01@gmail.com', password=$1, encryption='SSL/TLS' WHERE id=1", [process.env.EMAIL_PASS]);
    clearTransporterCache();

    console.log("🚀 Attempting Gmail Send (Should be limited to 1 connection)...");
    let res2 = await sendEmail(recipient, subject, "Testing Gmail Switch Recovery");
    console.log("Gmail Result:", res2.success ? "✅ Success" : "❌ Failed: " + res2.error);

    process.exit();
}

main();
