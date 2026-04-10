const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkSmtpAndLogs() {
    try {
        console.log("--- SMTP SETTINGS ---");
        const smtp = await pool.query("SELECT id, host, port, user_email, SUBSTRING(password, 1, 3) || '...' as pass_hint FROM smtp_settings");
        console.table(smtp.rows);

        console.log("\n--- RECENT EMAIL LOGS ---");
        const logs = await pool.query("SELECT log_id, recipient_email, subject, status, error_message, sent_at FROM email_logs ORDER BY sent_at DESC LIMIT 10");
        console.table(logs.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSmtpAndLogs();
