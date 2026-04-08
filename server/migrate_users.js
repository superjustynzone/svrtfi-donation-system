const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:superjustynzone@localhost:5432/svrtfi_donation_system' });

async function migrate() {
    try {
        console.log("🚀 Starting Users table migration...");
        
        // Add missing columns
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS address2 TEXT,
            ADD COLUMN IF NOT EXISTS barangay TEXT,
            ADD COLUMN IF NOT EXISTS province TEXT,
            ADD COLUMN IF NOT EXISTS city TEXT,
            ADD COLUMN IF NOT EXISTS zip_code TEXT,
            ADD COLUMN IF NOT EXISTS tin_number TEXT,
            ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Philippines';
        `);
        
        console.log("✅ Users table updated successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
