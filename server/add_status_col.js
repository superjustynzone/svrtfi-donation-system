const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: 'postgres://postgres:superjustynzone@localhost:5432/svrtfi_donation_system',
});

async function migrate() {
    try {
        console.log("Adding 'status' column to donations table...");
        await pool.query("ALTER TABLE donations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';");
        console.log("Migration successful!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
