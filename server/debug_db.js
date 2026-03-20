const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Found Tables:");
        res.rows.forEach(row => console.log("- " + row.table_name));
        
        if (res.rows.some(r => r.table_name === 'email_logs')) {
            console.log("✅ Table 'email_logs' EXISTS.");
        } else {
            console.log("❌ Table 'email_logs' MISSING.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

checkTables();
