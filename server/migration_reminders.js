const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        console.log('Adding last_reminder_date column...');
        await pool.query(`
            ALTER TABLE donation_reminders 
            ADD COLUMN IF NOT EXISTS last_reminder_date DATE;
        `);
        console.log('Done!');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
migrate();
