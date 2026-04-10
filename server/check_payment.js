const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkPaymentTable() {
    try {
        console.log("--- PAYMENT TRANSACTIONS TABLE ---");
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'payment_transactions'");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkPaymentTable();
