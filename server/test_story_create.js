// test_story_create.js
const fetch = require('node-fetch');

async function test() {
    const formData = new URLSearchParams();
    formData.append('foundation_id', '1');
    formData.append('title', 'Scheduled Test Story');
    formData.append('content', '<p>Test content</p>');
    formData.append('tags', 'Test');
    formData.append('author', 'Admin');
    formData.append('is_published', 'false');
    formData.append('scheduled_publish_at', '2026-04-01T10:00:00');

    try {
        const response = await fetch('http://localhost:5000/api/stories/create', {
            method: 'POST',
            body: formData,
            headers: {
                // Since I'm using URLSearchParams, node-fetch sets content-type.
                // But real app uses FormData (multer).
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (err) {
        console.error(err);
    }
}

test();
