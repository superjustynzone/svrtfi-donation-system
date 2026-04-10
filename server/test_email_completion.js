const { processDonationCompletion } = require('./EmailService');
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function testCompletionEmail() {
    try {
        // Find a recent completed donation to test with
        console.log("Fetching a sample donation...");
        const res = await pool.query("SELECT donation_id FROM donations ORDER BY initiated_at DESC LIMIT 1");
        
        if (res.rows.length === 0) {
            console.log("No donations found in DB to test with.");
            return;
        }

        const donationId = res.rows[0].donation_id;
        console.log(`Attempting to send email for Donation ID: ${donationId}`);

        const result = await processDonationCompletion(donationId);
        console.log("Result:", result);
    } catch (err) {
        console.error("CRASH DETECTED:");
        console.error(err);
    } finally {
        await pool.end();
        process.exit();
    }
}

testCompletionEmail();
