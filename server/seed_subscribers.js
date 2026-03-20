const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runSeed() {
    try {
        console.log("Database URL used:", process.env.DATABASE_URL.replace(/:[^:]*@/, ":****@"));
        
        const users = await pool.query("SELECT user_id FROM users LIMIT 1");
        console.log("Users connection OK, found rows:", users.rows.length);

        const auth = await pool.query("SELECT auth_id FROM auth_users LIMIT 1");
        console.log("Auth connection OK, found rows:", auth.rows.length);

        const join = await pool.query("SELECT u.user_id FROM users u JOIN auth_users a ON u.user_id = a.user_id");
        console.log("Join connection OK, found rows:", join.rows.length);

        if (join.rows.length > 0) {
            console.log("Proceeding to insert into subscribers...");
            const res = await pool.query(`
                INSERT INTO subscribers (user_id, email, full_name, receipts_opt_in, newsletters_opt_in) 
                SELECT u.user_id, a.email, u.first_name || ' ' || u.last_name, TRUE, FALSE 
                FROM users u 
                JOIN auth_users a ON u.user_id = a.user_id 
                ON CONFLICT (email) DO NOTHING
            `);
            console.log(`Successfully seeded ${res.rowCount} subscribers.`);
        } else {
            console.log("No data found to seed.");
        }

    } catch (err) {
        console.error("Seed error:", err.message);
    } finally {
        await pool.end();
    }
}

runSeed();
