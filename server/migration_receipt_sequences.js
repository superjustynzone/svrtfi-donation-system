const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    try {
        console.log('Creating receipt_sequences table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS receipt_sequences (
                id SERIAL PRIMARY KEY,
                sequence_number VARCHAR(255) NOT NULL UNIQUE,
                is_used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Done!');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
migrate();
