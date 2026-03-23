const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        console.log("Adding associated_campaign_id to email_campaigns...");
        await pool.query(`
            ALTER TABLE email_campaigns 
            ADD COLUMN IF NOT EXISTS associated_campaign_id INTEGER REFERENCES campaigns(campaign_id) ON DELETE SET NULL;
        `);
        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
