const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkEmailCampaignsTable() {
    try {
        const res = await pool.query("SELECT * FROM email_campaigns LIMIT 1");
        console.log("Email Campaigns columns:", Object.keys(res.rows[0] || {}));
    } catch (err) {
        if (err.message.includes("does not exist")) {
             console.log("Table email_campaigns does not exist");
        } else {
             console.error("Error checking table:", err);
        }
    } finally {
        await pool.end();
    }
}

checkEmailCampaignsTable();
