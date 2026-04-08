
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const dummyData = [
    { first: 'Emman', last: 'Cruz', email: 'emman.cruz@example.com' },
    { first: 'Marga', last: 'Santos', email: 'marga.santos@example.com' },
    { first: 'Justine', last: 'Reyes', email: 'justine.reyes@example.com' },
    { first: 'Bea', last: 'Lopez', email: 'bea.lopez@example.com' },
    { first: 'Kevin', last: 'Dizon', email: 'kevin.dizon@example.com' },
    { first: 'Sofia', last: 'Garcia', email: 'sofia.garcia@example.com' },
    { first: 'Rafael', last: 'Torres', email: 'rafael.torres@example.com' },
    { first: 'Nikki', last: 'Mendoza', email: 'nikki.mendoza@example.com' },
    { first: 'Paolo', last: 'Aquino', email: 'paolo.aquino@example.com' },
    { first: 'Isha', last: 'Velasco', email: 'isha.velasco@example.com' },
    { first: 'Mico', last: 'Bautista', email: 'mico.bautista@example.com' },
    { first: 'Dani', last: 'Pascual', email: 'dani.pascual@example.com' },
    { first: 'Gabe', last: 'Salvador', email: 'gabe.salvador@example.com' },
    { first: 'Lia', last: 'Santiago', email: 'lia.santiago@example.com' },
    { first: 'Enzo', last: 'Villanueva', email: 'enzo.villanueva@example.com' },
    { first: 'Ria', last: 'Castillo', email: 'ria.castillo@example.com' },
    { first: 'Marco', last: 'Del Rosario', email: 'marco.delrosario@example.com' },
    { first: 'Tania', last: 'Guevarra', email: 'tania.guevarra@example.com' },
    { first: 'Inigo', last: 'Perez', email: 'inigo.perez@example.com' },
    { first: 'Clara', last: 'Ocampo', email: 'clara.ocampo@example.com' }
];

async function seed() {
    try {
        console.log("🌱 Seeding mailing list with organized dummy data...");
        
        // 1. Get all campaigns
        const campaignRes = await pool.query("SELECT campaign_id, campaign_name FROM campaigns WHERE status IN ('active', 'published', 'publish')");
        const campaigns = campaignRes.rows;

        if (campaigns.length === 0) {
            console.error("❌ No active campaigns found to seed data into.");
            return;
        }

        console.log(`Found ${campaigns.length} campaigns to populate.`);

        let totalSeeded = 0;
        for (const campaign of campaigns) {
            console.log(`Populating "${campaign.campaign_name}"...`);
            
            // Pick 5-8 random people from dummyData for each campaign
            const count = Math.floor(Math.random() * 4) + 5; 
            const shuffled = [...dummyData].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, count);

            for (const person of selected) {
                // To avoid duplicate email conflicts across different campaigns for now, 
                // we'll unique-ify the email if we were seeding hundreds, 
                // but since these are campaigns, we can use slightly different emails.
                const uniqueEmail = `${person.first.toLowerCase()}.${person.last.replace(' ', '').toLowerCase()}.${campaign.campaign_id}@svrtf-test.org`;
                
                try {
                    await pool.query(
                        "INSERT INTO subscribers (email, first_name, last_name, full_name, campaign_id, receipts_opt_in) VALUES ($1, $2, $3, $4, $5, TRUE) ON CONFLICT (email) DO NOTHING",
                        [uniqueEmail, person.first, person.last, `${person.first} ${person.last}`, campaign.campaign_id]
                    );
                    totalSeeded++;
                } catch (err) {
                    // Skip if fails
                }
            }
        }

        console.log(`🎉 Organized seeding complete! Added ${totalSeeded} new dummy subscribers.`);
    } catch (err) {
        console.error("❌ Seeding failed:", err.message);
    } finally {
        await pool.end();
    }
}

seed();
