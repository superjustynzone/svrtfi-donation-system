require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    // Check current DB default
    const r = await pool.query(
        "SELECT column_default FROM information_schema.columns WHERE table_name='donations' AND column_name='status'"
    );
    console.log('Current DB default for donations.status:', r.rows[0]?.column_default);

    // Fix the default to 'pending'
    await pool.query("ALTER TABLE donations ALTER COLUMN status SET DEFAULT 'pending'");
    console.log("✅ Fixed: DB default is now 'pending'");

    // Verify
    const r2 = await pool.query(
        "SELECT column_default FROM information_schema.columns WHERE table_name='donations' AND column_name='status'"
    );
    console.log('Verified new default:', r2.rows[0]?.column_default);

    // Also fix any existing 'active' donations that should be 'pending'
    const fix = await pool.query(
        "UPDATE donations SET status = 'pending' WHERE status = 'active'"
    );
    console.log(`✅ Reset ${fix.rowCount} 'active' donations back to 'pending'`);

    process.exit();
}

main().catch(e => { console.error(e); process.exit(1); });
