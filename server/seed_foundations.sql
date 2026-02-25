-- ============================================================
-- SVRTV Foundation Data Seed
-- Run with: psql "postgres://postgres:superayenzone@localhost:5432/svrtfi_donation_system" -f seed_foundations.sql
-- ============================================================

-- Step 1: Fix column size limits that caused "value too long for type character varying(50)" errors
ALTER TABLE foundations
    ALTER COLUMN foundation_name     TYPE VARCHAR(255),
    ALTER COLUMN foundation_address  TYPE TEXT,
    ALTER COLUMN foundation_contact  TYPE VARCHAR(100),
    ALTER COLUMN foundation_email    TYPE VARCHAR(255),
    ALTER COLUMN bank_name           TYPE VARCHAR(255),
    ALTER COLUMN bank_information    TYPE TEXT,
    ALTER COLUMN beneficiaries       TYPE TEXT,
    ALTER COLUMN established         TYPE VARCHAR(20),
    ALTER COLUMN focus_areas         TYPE TEXT,
    ALTER COLUMN about_foundation    TYPE TEXT,
    ALTER COLUMN mission             TYPE TEXT,
    ALTER COLUMN vision              TYPE TEXT;

-- ============================================================
-- Step 2: Seed / Upsert Foundations
-- Uses INSERT ... ON CONFLICT to safely re-run this script
-- ============================================================

-- 1. Anawim - Home Of God's Poor
INSERT INTO foundations (
    foundation_name, foundation_address, foundation_contact, foundation_email,
    bank_name, bank_information, beneficiaries, established,
    focus_areas, about_foundation, mission, vision
) VALUES (
    'Anawim - Home Of God''s Poor',
    'Rizal Province, Philippines',
    NULL,
    NULL,
    'Shepherd''s Voice Radio & Television Foundation, Inc.',
    'Banco De Oro C/A # 3970019804, Banco De Oro S/A # 160506123',
    'Poor and abandoned elderly people (lolos and lolas)',
    NULL,
    'Elderly Care, Poverty Alleviation, Spiritual Care, Community Development',
    'Anawim is a small facility for poor and abandoned elderly people founded by Catholic lay preacher Bo Sanchez in Rizal Province, Philippines. The place provides physical care, home life, medical care, spiritual nourishment, recreational activities and socialization, social service, end-of-life care, and burial services to its indigent residents. Duly recognized by the DSWD and sustained by generous donors and volunteers.',
    'To turn the silver years of abandoned lolos and lolas into gold by providing them physical care, home life, medical care, spiritual nourishment, recreational activities, socialization, social services, end-of-life care, and burial services.',
    'A compassionate home where poor and abandoned elderly people are treated with dignity, love, and the full care they deserve in their final years.'
);

-- 2. Jeremiah Foundation - Healing and a Happy Youth
INSERT INTO foundations (
    foundation_name, foundation_address, foundation_contact, foundation_email,
    bank_name, bank_information, beneficiaries, established,
    focus_areas, about_foundation, mission, vision
) VALUES (
    'Jeremiah Foundation - Healing and a Happy Youth',
    'Pasig Green Park Village, Pasig City, Philippines',
    NULL,
    NULL,
    'Shepherd''s Voice Radio & Television Foundation, Inc.',
    'Banco De Oro C/A # 3970019804, Banco De Oro S/A # 160506123',
    'Young girls who are victims of sexual abuse',
    '2012',
    'Youth, Rehabilitation, Education, Healthcare, Spiritual Care, Legal Aid',
    'Jeremiah 33 Foundation is a shelter for young girls, particularly victims of sexual abuse. It aims to guide the girls in their journey towards a happy, healthy Christian living by providing psycho-spiritual counseling and meeting their daily needs. Founded by Reylindo E. Ortega, a 2012 Blessed Teresa of Calcutta Awardee, the shelter opened on November 27, 2012.',
    'To provide a warm, supportive home-like atmosphere for sexually abused girls, offering rehabilitation, education, healthcare, legal aid, spiritual formation, and family reunification opportunities.',
    'Girls who have experienced abuse are restored to wholeness, empowered to live happy, healthy, and independent Christian lives.'
);

-- 3. Grace to be Born - Love and Care for the Unborn
INSERT INTO foundations (
    foundation_name, foundation_address, foundation_contact, foundation_email,
    bank_name, bank_information, beneficiaries, established,
    focus_areas, about_foundation, mission, vision
) VALUES (
    'Grace to be Born - Love and Care for the Unborn',
    '53 Dr. Sixto Antonio Ave., Bgy. Kapasigan, Pasig City 1600',
    '(+63) 2 654 1377',
    'gtbbofficial15@gmail.com',
    'Shepherd''s Voice Radio & Television Foundation, Inc.',
    'Banco De Oro C/A # 3970019804, Banco De Oro S/A # 160506123',
    'Pregnant unwed mothers in crisis and their newborn babies',
    '2009',
    'Maternity, Pro-Life, Child Care, Community Development, Poverty Alleviation',
    'Grace to Be Born Maternity Home and Nursery is a halfway house established in 2009 by Basti and Betty Roxas-Chua. It serves as a temporary shelter for pregnant unwed mothers and an orphanage for children. The ministry empowers women in crisis and provides a safe environment for unborn and newly born babies, duly registered with the SEC, DSWD, BIR, and Mayor''s Office.',
    'To provide pregnant girls/women in crisis a wholesome physical, psychological, and spiritual environment; to empower them to deal with their situation and make the best decision for themselves and their baby; to care for newborn babies and facilitate adoption where needed.',
    'A Philippines where every unborn child is welcomed with love and where every mother in crisis finds compassionate support, healing, and hope.'
);

-- 4. Pag-Asa ng Pamilya - Empowerment through Education
INSERT INTO foundations (
    foundation_name, foundation_address, foundation_contact, foundation_email,
    bank_name, bank_information, beneficiaries, established,
    focus_areas, about_foundation, mission, vision
) VALUES (
    'Pag-Asa ng Pamilya - Empowerment through Education',
    'Philippines',
    NULL,
    NULL,
    'Shepherd''s Voice Radio & Television Foundation, Inc.',
    'Banco De Oro C/A # 3970019804, Banco De Oro S/A # 160506123',
    'Poor and persevering students needing college scholarships',
    NULL,
    'Education, Poverty Alleviation, Scholarships, Community Development',
    'Pag-asa ng Pamilya Scholarship Foundation, founded by Bro. Rey Ortega, gives scholarships to poor and persevering students from primary to tertiary level. Aside from financial assistance, the foundation organizes motivational seminars to encourage scholars to pursue their dreams and rise from poverty through education.',
    'To serve and glorify the Lord by helping the poor rise from poverty through education — providing scholarships and financial assistance for primary, secondary, and tertiary studies to selected deserving children.',
    'Empowered families who have broken the cycle of poverty through quality education and deep faith in God.'
);

-- 5. Shepherd's Voice Radio and Television Inc.
INSERT INTO foundations (
    foundation_name, foundation_address, foundation_contact, foundation_email,
    bank_name, bank_information, beneficiaries, established,
    focus_areas, about_foundation, mission, vision
) VALUES (
    'Shepherd''s Voice Radio and Television Inc.',
    'Philippines',
    NULL,
    NULL,
    'Shepherd''s Voice Radio & Television Foundation, Inc.',
    'Banco De Oro C/A # 3970019804, Banco De Oro S/A # 160506123',
    'Unchurched Filipinos reached through media; partner organizations',
    '2005',
    'Broadcasting, Media, Evangelization, Community Development',
    'Shepherd''s Voice Radio and Television Foundation, Inc. (SVRTV) is a non-government organization under the ministry of Catholic lay preacher Bro. Bo Sanchez. It evangelizes people for Jesus Christ through media development and supports partner organizations. SVRTV produces TV programs (Kerygma TV on ANC and IBC13), radio programs (Gabay sa Bibliya sa Radyo on Veritas 846), and manages major events like the annual Kerygma Conference.',
    'To evangelize Filipinos for Jesus Christ through media development and to provide support to partner organizations for their evangelization efforts.',
    'A Philippines where the Good News of Jesus Christ reaches every home through the power of media and technology.'
);

-- 6. LOJ Prison Ministry - Mercy and Compassion to Prisoners
INSERT INTO foundations (
    foundation_name, foundation_address, foundation_contact, foundation_email,
    bank_name, bank_information, beneficiaries, established,
    focus_areas, about_foundation, mission, vision
) VALUES (
    'LOJ Prison Ministry - Mercy and Compassion to Prisoners',
    'Correctional Institution for Women (CIW), Philippines',
    NULL,
    NULL,
    'Shepherd''s Voice Radio & Television Foundation, Inc.',
    'Banco De Oro C/A # 3970019804, Banco De Oro S/A # 160506123',
    'Women inmates at the Correctional Institution for Women',
    NULL,
    'Spiritual Care, Community Development, Poverty Alleviation',
    'The LOJ Prison Ministry holds regular prayer meetings at the Correctional Institution for Women (CIW) every second Saturday of the month. The ministry assures inmates that God has not abandoned them and provides spiritual care, basic needs (toiletries, snacks), and compassionate presence to those who have no visitors. Annual events include a post-Christmas party and a Lenten recollection.',
    'To assure women inmates that God is always present for them, ministering to their spiritual and basic needs, and offering compassionate presence so that what seems dire will turn into a blessing in God''s perfect time.',
    'Imprisoned women who experience the mercy, love, and transforming presence of Jesus Christ and find hope and healing within the walls of detention.'
);

-- 7. LOJ Pastoral Care - Wisdom and Comfort to the Depressed
INSERT INTO foundations (
    foundation_name, foundation_address, foundation_contact, foundation_email,
    bank_name, bank_information, beneficiaries, established,
    focus_areas, about_foundation, mission, vision
) VALUES (
    'LOJ Pastoral Care - Wisdom and Comfort to the Depressed',
    'Philippines (Online and face-to-face)',
    NULL,
    NULL,
    'Shepherd''s Voice Radio & Television Foundation, Inc.',
    'Banco De Oro C/A # 3970019804, Banco De Oro S/A # 160506123',
    'Individuals experiencing depression, anxiety, and emotional struggles',
    NULL,
    'Mental Health, Spiritual Care, Counseling, Community Development',
    'LOJ Pastoral Care offers counseling services to those experiencing depression and emotional difficulties. Services include telephone counseling (Mon–Sat, 6am–5pm), face-to-face counseling by appointment, and online chat support via kerygmafamily.com. Core values are Harmony, Empathy, Acceptance, Love, Integrity, Nurturance, and Generosity (HEALING).',
    'To help carry one another''s burdens through professional and compassionate counseling — telephone, face-to-face, and online — grounded in faith and love.',
    'A community where every person struggling emotionally finds wisdom, comfort, and the healing presence of God through accessible pastoral counseling.'
);

-- 8. He Cares Mission - About Us
INSERT INTO foundations (
    foundation_name, foundation_address, foundation_contact, foundation_email,
    bank_name, bank_information, beneficiaries, established,
    focus_areas, about_foundation, mission, vision
) VALUES (
    'He Cares Mission - Street Children Caring Center',
    'Quezon City, Philippines (also serves Montalban, Bulacan, and Bacolod)',
    NULL,
    NULL,
    'Shepherd''s Voice Radio & Television Foundation, Inc.',
    'Banco De Oro C/A # 3970019804, Banco De Oro S/A # 160506123',
    'Poor and vulnerable street children and their families',
    NULL,
    'Street Children, Education, Healthcare, Poverty Alleviation, Spiritual Care, Community Development',
    'He Cares Mission Streetchildren Caring Center Inc. is a Christian non-profit organization dedicated to serving poor and vulnerable street children and families in Quezon City, Montalban, Bulacan, and Bacolod. Programs include Balik-Loob sa Diyos (spiritual formation), Balik-Kalusugan (feeding and medical), Balik-Aral (education and school support), Balik-Hanapbuhay (livelihood skills), and Balik-Bahay (safe housing and sustainable farm).',
    'To love God and love others by providing food, clothing, education, medical assistance, and spiritual support to poor and vulnerable street children and families, helping them build a brighter future.',
    'Street children and vulnerable families transformed by God''s love — spiritually nourished, educated, healthy, and empowered to live dignified and self-sufficient lives.'
);

-- 9. Jesus Christ Cares For Cancer, Inc.
INSERT INTO foundations (
    foundation_name, foundation_address, foundation_contact, foundation_email,
    bank_name, bank_information, beneficiaries, established,
    focus_areas, about_foundation, mission, vision
) VALUES (
    'Jesus Christ Cares For Cancer, Inc.',
    'Philippines',
    NULL,
    NULL,
    'Shepherd''s Voice Radio & Television Foundation, Inc.',
    'Banco De Oro C/A # 3970019804, Banco De Oro S/A # 160506123',
    'Indigent cancer patients and terminally ill individuals',
    '2015',
    'Healthcare, Cancer Care, Poverty Alleviation, Spiritual Care',
    'Jesus Christ Cares For Cancer (JCCFC) was founded by Reylindo "Rey" Ortega after meeting Brian, a 7-year-old boy who succumbed to cancer in July 2013. In May 2015, Bro. Rey himself was diagnosed with Stage 4 prostate cancer and resolved to spend his remaining days serving indigent cancer patients. JCCFC was officially registered with the SEC on September 28, 2015. All funds raised go directly to beneficiaries, sustained entirely by volunteers and generous donors.',
    'To love and serve Jesus by providing financial assistance to indigent cancer patients and their families, operated entirely by volunteers so all donations go directly to beneficiaries.',
    'A Philippines where no cancer patient suffers alone — every sick and dying person treated with dignity, love, and the compassion of Christ.'
);

-- Done!
SELECT foundation_id, foundation_name, established FROM foundations ORDER BY foundation_id;
