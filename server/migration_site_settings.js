const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        console.log('Creating site_settings table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS site_settings (
                setting_key VARCHAR(255) PRIMARY KEY,
                setting_value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert defaults if not exists
        await pool.query(`
            INSERT INTO site_settings (setting_key, setting_value)
            VALUES 
            ('terms_and_conditions', '<p>Default Terms and Conditions...</p>'),
            ('privacy_policy', '<p>Default Privacy Policy...</p>')
            ON CONFLICT (setting_key) DO NOTHING;
        `);
        console.log('Done!');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
migrate();
