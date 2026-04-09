const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        console.log("Adding missing columns to 'donors' table...");

        const columns = [
            'tin_number VARCHAR(50)',
            'address2 TEXT',
            'barangay VARCHAR(100)',
            'province VARCHAR(100)',
            'city VARCHAR(100)',
            'zip_code VARCHAR(20)',
            'country VARCHAR(100)'
        ];

        for (const col of columns) {
            const [name] = col.split(' ');
            await pool.query(`ALTER TABLE donors ADD COLUMN IF NOT EXISTS ${col}`);
            console.log(`✅ Column '${name}' verified/added.`);
        }

        console.log("🚀 Migration successful!");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrate();
