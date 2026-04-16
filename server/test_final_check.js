const { sendEmail, clearTransporterCache } = require('./EmailService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function test() {
    console.log("🚀 Testing SendGrid with noreply@feast.ph...");
    
    // Clear cache to pick up new DB settings
    clearTransporterCache();
    
    const recipient = "superjustyn01@gmail.com";
    const subject = "Final SendGrid & HTML Fix Test";
    
    // Test with HTML tags that were previously visible
    const testHtml = `
        <h2 style="color: #63A6B2;">You're Invited!</h2>
        <p>This is a paragraph test to ensure that <strong>bold</strong> and <em>italics</em> work.</p>
        <p>The HTML <code>button</code> tag defines a clickable button. (Checking if tags are still visible as text)</p>
        <div style="background: #f0fdfa; padding: 15px; border-radius: 8px; border-left: 4px solid #63A6B2; margin: 20px 0;">
            This is a callout box to verify structural HTML rendering.
        </div>
    `;

    try {
        const result = await sendEmail(recipient, subject, testHtml);
        if (result.success) {
            console.log("✅ Final test email sent successfully via SendGrid!");
            console.log("Sender should be: noreply@feast.ph");
        } else {
            console.error("❌ Failed to send final test email:", result.error);
        }
    } catch (err) {
        console.error("💥 Unexpected error:", err);
    } finally {
        process.exit();
    }
}

test();
