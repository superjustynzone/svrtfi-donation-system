require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    // Check auth_users columns
    const au = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='auth_users' ORDER BY ordinal_position`);
    console.log('--- auth_users columns ---');
    au.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

    // Check donors columns
    const dn = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='donors' ORDER BY ordinal_position`);
    console.log('\n--- donors columns ---');
    dn.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

    // Sample a logged-in user: check if their email is in auth_users
    const sample = await pool.query(`SELECT a.user_id, a.email, u.first_name, u.last_name FROM auth_users a JOIN users u ON a.user_id = u.user_id LIMIT 3`);
    console.log('\n--- Sample auth_users JOIN users ---');
    console.table(sample.rows);

    // Check recent donors for email
    const donors = await pool.query(`SELECT donor_id, first_name, last_name, email FROM donors ORDER BY donor_id DESC LIMIT 5`);
    console.log('\n--- Recent donors ---');
    console.table(donors.rows);

    process.exit();
}

main().catch(e => { console.error(e); process.exit(1); });
