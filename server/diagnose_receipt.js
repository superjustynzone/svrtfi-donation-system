require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Import EXACTLY as the server does
const { processDonationCompletion, sendEmail } = require('./EmailService');

async function runDiagnostic() {
    console.log('=== DONATION RECEIPT DIAGNOSTIC ===\n');

    try {
        // 1. Find the most recent donation (any status) with an email
        const recent = await pool.query(`
            SELECT d.donation_id, d.status, d.donor_id, d.campaign_id,
                   dn.email AS donor_email, dn.first_name, dn.last_name,
                   c.campaign_name
            FROM donations d
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            LEFT JOIN campaigns c ON d.campaign_id = c.campaign_id
            ORDER BY d.initiated_at DESC
            LIMIT 5
        `);

        console.log('--- Most recent 5 donations ---');
        console.table(recent.rows.map(r => ({
            donation_id: r.donation_id,
            status: r.status,
            donor_email: r.donor_email,
            campaign: r.campaign_name
        })));

        // 2. Pick the most recent one WITH an email
        const withEmail = recent.rows.find(r => r.donor_email);
        if (!withEmail) {
            console.log('❌ No donations with an email found! Cannot test receipts.');
            return;
        }

        console.log(`\n✅ Using donation ID: ${withEmail.donation_id}`);
        console.log(`   Donor email: ${withEmail.donor_email}`);
        console.log(`   Campaign: ${withEmail.campaign_name}`);
        console.log('\n--- Calling processDonationCompletion() directly ---');

        // 3. Call processDonationCompletion and log result
        const result = await processDonationCompletion(withEmail.donation_id);
        console.log('Result:', result);

        // 4. Check email logs for this recipient
        await new Promise(r => setTimeout(r, 3000)); // wait for async
        const logs = await pool.query(`
            SELECT log_id, recipient_email, subject, status, error_message, sent_at
            FROM email_logs
            WHERE recipient_email = $1
            ORDER BY sent_at DESC
            LIMIT 3
        `, [withEmail.donor_email]);
        
        console.log('\n--- Email logs for this recipient ---');
        console.table(logs.rows);

    } catch (err) {
        console.error('\n❌ DIAGNOSTIC ERROR:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

runDiagnostic();
