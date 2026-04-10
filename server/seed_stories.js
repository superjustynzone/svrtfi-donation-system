const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seedStories() {
    const uploadDir = path.join(__dirname, 'uploads', 'stories');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const brainDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\12330a3f-8768-4309-89d2-caca40332902';
    
    // Define the image source files (using the paths from previous steps)
    const storyData = [
        {
            title: "A Home Filled with Love: Restoring Dignity at Anawim",
            content: "<p>At Anawim, we provide more than just shelter for the abandoned elderly. We provide a family. Recently, Tatay Ruben joined us, having lived on the streets for years. Today, he is thriving, surrounded by friends and caretakers who value his life.</p>",
            foundation_id: 2,
            tags: "Elderly Care, Community",
            author: "Admin",
            imageSource: 'elderly_support_story_1775786078041.png'
        },
        {
            title: "New Beginnings: From Crisis to Hope",
            content: "<p>Maria was hopeless when she first arrived at Grace to be Born. Distressed and alone, she found the support she needed to choose life for her baby. Now, she is a proud mother, empowered by the counseling and care she received here.</p>",
            foundation_id: 3,
            tags: "Crisis Support, Motherhood",
            author: "Social Worker",
            imageSource: 'mother_child_story_1775786113059.png'
        },
        {
            title: "The Strength to Fight: Miracles in Oncology",
            content: "<p>Fighting cancer is an uphill battle, but no one has to do it alone. Jesus Christ Cares For Cancer, Inc. has been a beacon of hope for Jun, providing not only medical assistance but a spiritual support system that keeps his spirits high.</p>",
            foundation_id: 4,
            tags: "Cancer Support, Faith",
            author: "Volunteer",
            imageSource: 'cancer_patient_support_story_1775786197881.png'
        },
        {
            title: "Dreaming Beyond the Streets",
            content: "<p>Education is the key to breaking the cycle of poverty. Through He Cares Mission, children from the streets are given a chance to learn, play, and dream of a better future. Each lesson is a step towards transformation.</p>",
            foundation_id: 5,
            tags: "Education, Youth",
            author: "Teacher Mark",
            imageSource: 'street_children_education_story_1775786269926.png'
        }
    ];

    try {
        console.log("Seeding stories...");

        for (const data of storyData) {
            // 1. Insert Story
            const storyRes = await pool.query(
                `INSERT INTO stories (foundation_id, title, content, tags, author, is_published, published_at, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW(), NOW())
                 RETURNING story_id`,
                [data.foundation_id, data.title, data.content, data.tags, data.author]
            );
            const storyId = storyRes.rows[0].story_id;

            // 2. Prepare Image
            const srcPath = path.join(brainDir, data.imageSource);
            const destFilename = `story-${Date.now()}-${data.imageSource}`;
            const destPath = path.join(uploadDir, destFilename);
            const relativeImagePath = `/uploads/stories/${destFilename}`;

            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, destPath);
                
                // 3. Insert Image record
                await pool.query(
                    `INSERT INTO story_images (story_id, image_file, order_index)
                     VALUES ($1, $2, 0)`,
                    [storyId, relativeImagePath]
                );
                console.log(`Created story: ${data.title} with image ${destFilename}`);
            } else {
                console.warn(`Image src not found: ${srcPath}`);
            }
        }

        console.log("Seeding completed successfully.");
    } catch (err) {
        console.error("Error seeding stories:", err);
    } finally {
        await pool.end();
    }
}

seedStories();
