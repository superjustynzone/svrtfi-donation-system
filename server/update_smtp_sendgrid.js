const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    const client = await pool.connect();
    try {
        console.log("Adding sender_email column to smtp_settings...");
        await client.query(`ALTER TABLE smtp_settings ADD COLUMN IF NOT EXISTS sender_email VARCHAR(255)`);

        console.log("Updating SMTP settings to SendGrid...");

        const provider = "SendGrid";
        const host = "smtp.sendgrid.net";
        const port = 587;
        const user_email = "apikey";
        const password = process.env.SENDGRID_API_KEY;
        const encryption = "STARTTLS";
        const sender_email = process.env.EMAIL_USER; // Default sender as requested

        const existing = await client.query("SELECT id FROM smtp_settings LIMIT 1");
        if (existing.rows.length > 0) {
            await client.query(
                "UPDATE smtp_settings SET provider=$1, host=$2, port=$3, user_email=$4, password=$5, encryption=$6, sender_email=$7, updated_at=NOW() WHERE id=$8",
                [provider, host, port, user_email, password, encryption, sender_email, existing.rows[0].id]
            );
            console.log("Updated existing SMTP settings.");
        } else {
            await client.query(
                "INSERT INTO smtp_settings (provider, host, port, user_email, password, encryption, sender_email) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                [provider, host, port, user_email, password, encryption, sender_email]
            );
            console.log("Inserted new SMTP settings.");
        }
    } catch (err) {
        console.error("Failed to update SMTP settings:", err);
    } finally {
        client.release();
        process.exit();
    }
}

main();
