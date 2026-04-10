const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seedMailingTemplates() {
    const thankYouLetters = [
        {
            title: "Welcome to our Mission",
            message: "<h3>Dear {{firstname}},</h3><p>Thank you for joining our mission in <strong>{{campaign_name}}</strong>. Your support is vital to our work and helps us reach more souls in need.</p><p>God bless your generous heart!</p><p>Sincerely,<br/>SVRTV Team</p>",
            category: "thank_you_letter",
            status: "active"
        },
        {
            title: "Empowering Lives Together",
            message: "<h3>Hello {{firstname}},</h3><p>Your recent gift to <strong>{{campaign_name}}</strong> has already begun making an impact. Because of your kindness, we are able to continue our programs for the marginalized.</p><p>We are grateful for your partnership in this ministry.</p><p>In Christ,<br/>The Foundation Office</p>",
            category: "thank_you_letter",
            status: "active"
        },
        {
            title: "Faith in Action",
            message: "<h3>Dearest {{firstname}},</h3><p>We are writing to express our deepest gratitude for your donation to <strong>{{campaign_name}}</strong>. Your faith in action is an inspiration to us all.</p><p>May you be blessed a hundredfold for your generosity.</p><p>Warmly,<br/>SVRTV Foundation</p>",
            category: "thank_you_letter",
            status: "active"
        }
    ];

    const emailBlasts = [
        {
            title: "Easter Sunday Celebration",
            message: "<h3>He is Risen!</h3><p>Join us this coming Easter Sunday for a special live broadcast. We'll be sharing stories of hope and the joyous message of the Resurrection.</p><p>Tune in at 8:00 AM on our official channels.</p><p>Blessings to you and your family!</p>",
            category: "email_blast",
            status: "active"
        },
        {
            title: "Urgent Relief Efforts",
            message: "<h3>Emergency Appeal</h3><p>Our brothers and sisters in the affected areas need our help. Please consider contributing to our relief efforts as we provide food, water, and shelter to those displaced by the recent typhoon.</p><p>Every little bit helps. Thank you for your compassion.</p>",
            category: "email_blast",
            status: "active"
        },
        {
            title: "Annual Donor Appreciation Brunch",
            message: "<h3>You're Invited!</h3><p>We would like to invite you to our annual donor appreciation event. We want to celebrate the milestones we've achieved together this year.</p><p><strong>Date:</strong> May 15, 2026<br/><strong>Time:</strong> 10:00 AM<br/><strong>Location:</strong> SVRTV Hall</p><p>RSPV by replying to this email.</p>",
            category: "email_blast",
            status: "active"
        }
    ];

    try {
        console.log("Seeding mailing templates...");

        // Seed Thank You Letters
        for (const template of thankYouLetters) {
            await pool.query(
                `INSERT INTO email_campaigns (title, message, category, status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                [template.title, template.message, template.category, template.status]
            );
            console.log(`Created Thank You Letter: ${template.title}`);
        }

        // Seed Email Blasts
        for (const template of emailBlasts) {
            await pool.query(
                `INSERT INTO email_campaigns (title, message, category, status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                [template.title, template.message, template.category, template.status]
            );
            console.log(`Created Email Blast: ${template.title}`);
        }

        console.log("Seeding completed successfully.");
    } catch (err) {
        console.error("Error seeding templates:", err);
    } finally {
        await pool.end();
    }
}

seedMailingTemplates();
