const { sendEmail } = require('./EmailService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function test() {
    console.log("🚀 Debugging HTML Rendering...");
    
    const recipient = "superjustyn01@gmail.com";
    const subject = "HTML Rendering Debug - SVRTFI";
    
    // Example content with tags
    const testHtml = `
        <h3>Look at me!</h3>
        <p>This is a <strong>working</strong> paragraph.</p>
        <p>The HTML <code>button</code> tag defines a clickable button.</p>
    `;

    try {
        const result = await sendEmail(recipient, subject, testHtml);
        if (result.success) {
            console.log("✅ Debug email sent. Please check if tags are visible.");
        } else {
            console.error("❌ Failed to send debug email:", result.error);
        }
    } catch (err) {
        console.error("💥 Error during test:", err);
    } finally {
        process.exit();
    }
}

test();
