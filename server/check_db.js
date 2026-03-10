const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    try {
        console.log("--- COLUMNS IN payment_transactions ---");
        const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'payment_transactions'");
        console.table(cols.rows);

        console.log("\n--- DONORS ---");
        const donors = await pool.query("SELECT * FROM donors");
        console.table(donors.rows);

        console.log("\n--- DONATIONS ---");
        const donations = await pool.query("SELECT donation_id, donor_id, amount FROM donations");
        console.table(donations.rows);

        console.log("\n--- EXECUTING PROPOSED QUERY ---");
        const result = await pool.query(
            `SELECT
              dn.donor_id,
              dn.first_name,
              dn.last_name,
              COUNT(d.donation_id)::int                                                  AS donation_count,
              COALESCE(SUM(d.amount), 0)::float                                          AS total_donated
             FROM donors dn
             INNER JOIN donations d ON dn.donor_id = d.donor_id
             INNER JOIN payment_transactions pt ON d.donation_id = pt.donation_id
             WHERE pt.payment_status IN ('completed', 'pending')
             GROUP BY dn.donor_id, dn.first_name, dn.last_name
             ORDER BY total_donated DESC`
        );
        console.table(result.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
