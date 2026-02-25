require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
    const sql = fs.readFileSync(path.join(__dirname, 'seed_foundations.sql'), 'utf8');
    const client = await pool.connect();
    try {
        console.log('🌱 Running foundation seed...');
        await client.query(sql);
        console.log('✅ Seed complete!');
    } catch (err) {
        console.error('❌ Seed error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
