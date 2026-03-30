const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://postgres:superjustynzone@localhost:5432/svrtfi_donation_system'
});

async function fixSchema() {
    console.log("Dropping old donation_reminders table to update to BIGINT...");
    try {
        await pool.query('DROP TABLE IF EXISTS donation_reminders CASCADE;');
        console.log("✅ Successfully dropped old table.");
    } catch (err) {
        console.error("❌ Failed to drop table:", err.message);
    } finally {
        await pool.end();
    }
}

fixSchema();
