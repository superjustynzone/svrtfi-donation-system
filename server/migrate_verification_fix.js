const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        console.log("Checking and updating database schema...");

        // 1. Add verification_code to auth_users
        await pool.query(`
            ALTER TABLE auth_users 
            ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10)
        `);
        console.log("✅ Column 'verification_code' verified in 'auth_users' table.");

        // 2. Add is_active to users
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
        `);
        console.log("✅ Column 'is_active' verified in 'users' table.");

        // 3. Add last_login to users
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
        `);
        console.log("✅ Column 'last_login' verified in 'users' table.");

        // Optionally, set existing users to active
        await pool.query(`
            UPDATE users SET is_active = TRUE WHERE is_active IS NULL
        `);

        console.log("🚀 Migration successful!");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrate();
