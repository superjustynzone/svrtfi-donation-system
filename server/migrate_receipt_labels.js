const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://postgres:superjustynzone@localhost:5432/svrtfi_donation_system'
});

async function run() {
    const dryRun = process.argv.includes('--dry-run');
    console.log(dryRun ? '--- DRY RUN MODE ---' : '--- EXECUTION MODE ---');

    try {
        // 1. Update email_logs (message and subject)
        const logUpdate = `
            UPDATE email_logs 
            SET 
                message = REPLACE(message, 'Receipt No.', 'Receipt'),
                subject = REPLACE(subject, 'Receipt No.', 'Receipt')
            WHERE message LIKE '%Receipt No.%' OR subject LIKE '%Receipt No.%'
        `;

        if (dryRun) {
            const res = await pool.query("SELECT COUNT(*) FROM email_logs WHERE message LIKE '%Receipt No.%' OR subject LIKE '%Receipt No.%'");
            console.log(`email_logs: Found ${res.rows[0].count} records to update.`);
        } else {
            const res = await pool.query(logUpdate);
            console.log(`email_logs: Updated ${res.rowCount} records.`);
        }

        // 2. Update campaigns (receipt_email_message and receipt_email_subject)
        const campaignUpdate = `
            UPDATE campaigns 
            SET 
                receipt_email_message = REPLACE(receipt_email_message, 'Receipt No.', 'Receipt'),
                receipt_email_subject = REPLACE(receipt_email_subject, 'Receipt No.', 'Receipt')
            WHERE receipt_email_message LIKE '%Receipt No.%' OR receipt_email_subject LIKE '%Receipt No.%'
        `;

        if (dryRun) {
            const res = await pool.query("SELECT COUNT(*) FROM campaigns WHERE receipt_email_message LIKE '%Receipt No.%' OR receipt_email_subject LIKE '%Receipt No.%'");
            console.log(`campaigns: Found ${res.rows[0].count} records to update.`);
        } else {
            const res = await pool.query(campaignUpdate);
            console.log(`campaigns: Updated ${res.rowCount} records.`);
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

run();
