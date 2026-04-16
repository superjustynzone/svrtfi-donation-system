const { sendEmail } = require('./EmailService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function test() {
    console.log("🚀 Testing SendGrid Integration...");
    console.log("Using API Key from .env");
    
    // Test recipient
    const recipient = "superjustyn01@gmail.com"; // User's email from previous logs
    const subject = "SendGrid Integration Test - SVRTFI";
    const message = "<h1>Success!</h1><p>Your SendGrid SMTP integration is working perfectly.</p>";

    try {
        const result = await sendEmail(recipient, subject, message);
        if (result.success) {
            console.log("✅ Email sent successfully via SendGrid!");
        } else {
            console.log("❌ Failed to send email:");
            console.error(result.error);
        }
    } catch (err) {
        console.error("💥 Unexpected error:", err);
    } finally {
        process.exit();
    }
}

test();
