const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkSmtpTable() {
    try {
        const res = await pool.query("SELECT * FROM smtp_settings LIMIT 1");
        console.log("Table exists", res.rows);
    } catch (err) {
        if (err.code === '42P01') {
            console.log("Table does not exist, creating...");
            await pool.query(`
                CREATE TABLE IF NOT EXISTS smtp_settings (
                    id SERIAL PRIMARY KEY,
                    provider VARCHAR(50) DEFAULT 'Gmail',
                    host VARCHAR(255) DEFAULT 'smtp.gmail.com',
                    port INTEGER DEFAULT 465,
                    user_email VARCHAR(255),
                    password VARCHAR(255),
                    encryption VARCHAR(50) DEFAULT 'SSL/TLS',
                    is_active BOOLEAN DEFAULT TRUE,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            // Insert default from env if exists
            await pool.query(`
                INSERT INTO smtp_settings (provider, host, port, user_email, password, encryption)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, ['Gmail', 'smtp.gmail.com', 465, process.env.EMAIL_USER || '', process.env.EMAIL_PASS || '', 'SSL/TLS']);
            console.log("Table created and default settings inserted.");
        } else {
            console.error("Error checking table:", err);
        }
    } finally {
        await pool.end();
    }
}

checkSmtpTable();
