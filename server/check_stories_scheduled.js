// check_stories_scheduled.js
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    try {
        const result = await pool.query('SELECT story_id, title, is_published, scheduled_publish_at, created_at FROM stories ORDER BY created_at DESC LIMIT 5');
        console.log('--- LATEST STORIES ---');
        result.rows.forEach(r => console.log(r));
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await pool.end();
    }
}

check();
