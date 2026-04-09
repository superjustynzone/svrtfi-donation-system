const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active'");
        console.log('Is is_active in users?', res.rows.length > 0);
        
        const res2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'verification_code'");
        console.log('Is verification_code in auth_users?', res2.rows.length > 0);

        if (res.rows.length === 0 || res2.rows.length === 0) {
            const allUsers = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
            console.log('All Users columns:', allUsers.rows.map(r => r.column_name));
            
            const allAuth = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'auth_users'");
            console.log('All Auth Users columns:', allAuth.rows.map(r => r.column_name));
        }
    } catch (err) {

        console.error(err);
    }
    process.exit(0);
}
check();
