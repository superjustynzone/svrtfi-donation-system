const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkDonorsTable() {
    try {
        const res = await pool.query("SELECT * FROM donors LIMIT 1");
        console.log("Donors columns:", Object.keys(res.rows[0] || {}));
    } catch (err) {
        console.error("Error checking table:", err);
    } finally {
        await pool.end();
    }
}

checkDonorsTable();
