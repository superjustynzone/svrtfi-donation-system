
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        console.log("🚀 Starting random campaign assignment for unassigned subscribers...");
        
        // 1. Get all campaigns
        const campaignRes = await pool.query("SELECT campaign_id FROM campaigns WHERE status IN ('active', 'published', 'publish') LIMIT 100");
        const campaigns = campaignRes.rows.map(r => r.campaign_id);

        if (campaigns.length === 0) {
            console.error("❌ No active campaigns found to assign subscribers to.");
            return;
        }

        console.log(`Found ${campaigns.length} campaigns for distribution.`);

        // 2. Get unassigned subscribers
        const subRes = await pool.query("SELECT subscriber_id FROM subscribers WHERE campaign_id IS NULL");
        const subscribers = subRes.rows;

        console.log(`Found ${subscribers.length} unassigned subscribers.`);

        if (subscribers.length === 0) {
            console.log("✅ All subscribers already have campaigns assigned.");
            return;
        }

        // 3. Randomly assign
        let updatedCount = 0;
        for (const sub of subscribers) {
            const randomCampaignId = campaigns[Math.floor(Math.random() * campaigns.length)];
            await pool.query("UPDATE subscribers SET campaign_id = $1 WHERE subscriber_id = $2", [randomCampaignId, sub.subscriber_id]);
            updatedCount++;
        }

        console.log(`🎉 Successfully assigned ${updatedCount} subscribers to random campaigns!`);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
    } finally {
        await pool.end();
    }
}

migrate();
