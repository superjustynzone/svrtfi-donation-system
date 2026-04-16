const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

let transporterCache = null;

const clearTransporterCache = () => {
    if (transporterCache) {
        try {
            // Close the current transporter pool before clearing
            transporterCache.close();
            console.log("🛑 Closed existing SMTP connection pool.");
        } catch (err) {
            console.error("Error closing SMTP pool:", err);
        }
    }
    transporterCache = null;
    console.log("♻️ SMTP Transporter cache cleared.");
};

const getTransporter = async () => {
    if (transporterCache) return transporterCache;
    try {
        const res = await pool.query("SELECT * FROM smtp_settings ORDER BY id DESC LIMIT 1");
        if (res.rows.length > 0) {
            const s = res.rows[0];
            const isGmail = s.host && s.host.toLowerCase().includes('gmail');
            
            transporterCache = nodemailer.createTransport({
                pool: true,
                host: s.host,
                port: s.port,
                secure: parseInt(s.port) === 465,
                auth: {
                    user: s.user_email,
                    pass: s.password,
                },
                tls: {
                    rejectUnauthorized: false
                },
                // Gmail is extremely sensitive to multiple login attempts.
                // Limit to 1 connection and higher delay for Gmail.
                maxConnections: isGmail ? 1 : 5,
                maxMessages: 100,
                rateDelta: isGmail ? 2000 : 1000,
                rateLimit: isGmail ? 1 : 5,
                connectionTimeout: 60000,
                socketTimeout: 60000,
                greetingTimeout: 30000
            });
            console.log(`🔌 Created ${isGmail ? 'conservative ' : ''}pooled transporter for ${s.provider} (${s.host})`);
            return transporterCache;
        }
    } catch (err) {
        console.error("Error getting SMTP settings from DB, falling back to ENV:", err);
    }

    // Fallback to ENV settings (Usually Gmail)
    transporterCache = nodemailer.createTransport({
        service: "gmail",
        pool: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        maxConnections: 1,
        maxMessages: 100,
        rateLimit: 1,
        connectionTimeout: 60000,
        socketTimeout: 60000,
        greetingTimeout: 30000
    });
    console.log("🔌 Created conservative pooled transporter for Gmail (Fallback)");
    return transporterCache;
};
