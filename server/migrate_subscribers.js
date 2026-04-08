
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        console.log("🚀 Starting subscribers migration...");
        
        // Add campaign_id column
        await pool.query(`
            ALTER TABLE subscribers 
            ADD COLUMN IF NOT EXISTS campaign_id BIGINT REFERENCES campaigns(campaign_id) ON DELETE SET NULL
        `);
        console.log("✅ Added campaign_id column to subscribers table");

        // Sync sequence if necessary (usually not needed for column addition but good to have)
        
        console.log("🎉 Migration completed successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
    } finally {
        await pool.end();
    }
}

migrate();
