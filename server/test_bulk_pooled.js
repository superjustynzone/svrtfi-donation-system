const { sendEmail, clearTransporterCache } = require('./EmailService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function test() {
    console.log("🚀 Testing Bulk Pooled Email Sending...");
    
    // Clear cache to start fresh
    clearTransporterCache();
    
    const recipient = "superjustyn01@gmail.com";
    const batchSize = 5;
    const promises = [];

    console.log(`Sending ${batchSize} emails to ${recipient} in rapid succession...`);

    for (let i = 1; i <= batchSize; i++) {
        promises.push(
            sendEmail(recipient, `Bulk Test #${i}`, `<h1>Test #${i}</h1><p>This is part of a pooled bulk send test.</p>`)
            .then(res => {
                if (res.success) console.log(`✅ Email #${i} sent successfully.`);
                else console.error(`❌ Email #${i} failed:`, res.error);
                return res;
            })
        );
    }

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;

    console.log(`\n📊 Summary: ${successCount}/${batchSize} emails sent.`);
    
    if (successCount === batchSize) {
        console.log("🎉 Test PASSED! Pooling is working correctly.");
    } else {
        console.log("⚠️ Test finished with some failures. Check logs.");
    }

    process.exit();
}

test();
