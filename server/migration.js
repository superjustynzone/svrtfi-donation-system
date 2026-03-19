// migration.js
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Adding subtitle column to stories...');
        await client.query(`
            ALTER TABLE stories 
            ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255);
        `);

        console.log('Creating story_images table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS story_images (
                image_id SERIAL PRIMARY KEY,
                story_id BIGINT REFERENCES stories(story_id) ON DELETE CASCADE,
                image_file TEXT NOT NULL,
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Migrate existing images if any
        console.log('Migrating existing images to story_images...');
        const existingStories = await client.query('SELECT story_id, image_file FROM stories WHERE image_file IS NOT NULL');
        for (const story of existingStories.rows) {
            // Check if already migrated
            const imgCheck = await client.query('SELECT 1 FROM story_images WHERE story_id = $1 AND image_file = $2', [story.story_id, story.image_file]);
            if (imgCheck.rows.length === 0) {
                await client.query('INSERT INTO story_images (story_id, image_file, order_index) VALUES ($1, $2, 0)', [story.story_id, story.image_file]);
            }
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
