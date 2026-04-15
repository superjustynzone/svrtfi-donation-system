const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { BetaAnalyticsDataClient } = require("@google-analytics/data");

async function checkGA4() {
    console.log("🔍 Checking GA4 Configuration...");
    const propertyId = process.env.GA_PROPERTY_ID;
    const keyFile = process.env.GA_KEY_FILE_PATH;

    if (!propertyId || !keyFile) {
        console.error("❌ Missing env vars");
        return;
    }

    try {
        const resolvedKey = path.isAbsolute(keyFile) ? keyFile : path.join(__dirname, keyFile);
        const gaClient = new BetaAnalyticsDataClient({ keyFilename: resolvedKey });
        
        console.log("✅ Client created. Running a test report for property:", propertyId);
        
        // Let's run a simple test report
        const [response] = await gaClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
            dimensions: [],
            metrics: [{ name: "totalUsers" }, { name: "sessions" }],
        });

        console.log("=========================================");
        console.log("🎉 SUCCESS! The GA4 Data API is working!");
        console.log("=========================================");
        console.log("Raw Response from Google:", JSON.stringify(response.rows, null, 2));
        
        if (!response.rows || response.rows.length === 0) {
            console.log("\nℹ️ Status: The API sent back empty rows. This is perfectly normal for a new site that hasn't received any tracked traffic yet. The integration works flawlessly.");
        }

    } catch (error) {
        console.error("❌ GA4 Error Encountered:");
        console.error(error.message);
    }
}

checkGA4();
