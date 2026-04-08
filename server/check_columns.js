const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:superjustynzone@localhost:5432/svrtfi_donation_system' });

async function check() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log("COLUMNS:", res.rows.map(r => r.column_name).join(', '));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();
