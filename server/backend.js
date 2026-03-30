//Backend.js (Handles the Backend)
console.log("🚀 BACKEND VERSION: TXN_FIX_V4");
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");
const multer = require("multer");
const fs = require("fs");

const app = express();
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Logger for debugging API calls
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads", "profiles");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user_${req.body.userId || 'unknown'}_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|csv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const isCSV = path.extname(file.originalname).toLowerCase() === '.csv';

  if (isCSV || extname) {
    return cb(null, true);
  } else {
    cb(new Error("Allowed files: images and csv"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ─────────────────────────────────────────────
// Mailing Routes (Priority)
// ─────────────────────────────────────────────
const { sendEmail } = require("./EmailService");

app.post("/api/admin/send-email", async (req, res) => {
  const { to, subject, message } = req.body;
  if (!to || !subject || !message) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const result = await sendEmail(
    to,
    subject,
    `<div style="font-family: sans-serif; line-height: 1.6; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            ${message.replace(/\n/g, '<br>')}
        </div>`
  );

  if (result.success) {
    res.json({ message: "Email sent successfully!" });
  } else {
    res.status(500).json({ message: "Failed to send email", error: result.error });
  }
});

app.get("/api/admin/email-logs", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/subscribers", async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT s.*, 
                   COALESCE(s.first_name, u.first_name) as first_name, 
                   COALESCE(s.last_name, u.last_name) as last_name
            FROM subscribers s 
            LEFT JOIN users u ON s.user_id = u.user_id 
            ORDER BY subscribed_at DESC
        `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching subscribers:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/subscribers", async (req, res) => {
  console.log("📬 Mailing API Hit: POST /api/admin/subscribers", req.body);
  const { email, first_name, last_name, newsletter } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const existing = await pool.query("SELECT * FROM subscribers WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists in mailing list" });
    }

    const result = await pool.query(
      "INSERT INTO subscribers (email, first_name, last_name, full_name, newsletters_opt_in) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [email, first_name, last_name, `${first_name} ${last_name}`.trim(), newsletter || false]
    );
    res.json({ message: "Subscriber added successfully", subscriber: result.rows[0] });
  } catch (err) {
    console.error("❌ Subscriber addition error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Toggle Subscriber Receipt Opt-in
app.patch("/api/admin/subscribers/:id/toggle-receipts", async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query("SELECT receipts_opt_in FROM subscribers WHERE subscriber_id = $1", [id]);
    if (check.rows.length === 0) return res.status(404).json({ message: "Subscriber not found" });
    const newValue = !check.rows[0].receipts_opt_in;
    await pool.query("UPDATE subscribers SET receipts_opt_in = $1 WHERE subscriber_id = $2", [newValue, id]);
    res.json({ message: `Receipts ${newValue ? 'enabled' : 'disabled'} successfully`, receipts_opt_in: newValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Subscriber
app.delete("/api/admin/subscribers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM subscribers WHERE subscriber_id = $1", [id]);
    res.json({ message: "Subscriber removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/receipt-template", async (req, res) => {
  const { campaign_id } = req.query;
  try {
    if (campaign_id && campaign_id !== 'global') {
      const result = await pool.query("SELECT receipt_email_subject as title, receipt_email_message as message FROM campaigns WHERE campaign_id = $1", [campaign_id]);
      if (result.rows.length > 0) {
        return res.json(result.rows[0]);
      }
    }
    res.json({ title: '', message: '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/receipt-template", async (req, res) => {
  const { title, message, campaign_id } = req.body;
  try {
    if (campaign_id && campaign_id !== 'global') {
      await pool.query(
        "UPDATE campaigns SET receipt_email_subject = $1, receipt_email_message = $2 WHERE campaign_id = $3",
        [title, message, campaign_id]
      );
      return res.json({ message: "Campaign-specific receipt template updated successfully!" });
    }
    res.status(400).json({ error: "Campaign ID is required for receipt templates." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SMTP Configuration Routes
app.get("/api/admin/smtp-settings", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM smtp_settings ORDER BY id DESC LIMIT 1");
    if (result.rows.length > 0) {
      const settings = result.rows[0];
      // Don't send the password back (or send it as stars)
      // settings.password = "********"; 
      res.json(settings);
    } else {
      res.json({ provider: "Gmail", host: "smtp.gmail.com", port: 465, user_email: "", encryption: "SSL/TLS" });
    }
  } catch (err) {
    console.error("Error fetching SMTP settings:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/smtp-settings", async (req, res) => {
  const { provider, host, port, user_email, password, encryption } = req.body;
  try {
    // We only keep one main SMTP config for now
    const existing = await pool.query("SELECT id FROM smtp_settings LIMIT 1");

    if (existing.rows.length > 0) {
      // Update
      const id = existing.rows[0].id;
      let updateFields = ["provider = $1", "host = $2", "port = $3", "user_email = $4", "encryption = $5", "updated_at = NOW()"];
      let values = [provider, host, port, user_email, encryption];

      // Only update password if it's provided and not the stars/placeholder
      if (password && password !== "********" && password.trim() !== "") {
        updateFields.push(`password = $${values.length + 1}`);
        values.push(password);
      }

      await pool.query(
        `UPDATE smtp_settings SET ${updateFields.join(", ")} WHERE id = $${values.length + 1}`,
        [...values, id]
      );
    } else {
      // Insert
      await pool.query(
        "INSERT INTO smtp_settings (provider, host, port, user_email, password, encryption) VALUES ($1, $2, $3, $4, $5, $6)",
        [provider, host, port, user_email, password, encryption]
      );
    }
    res.json({ message: "SMTP settings updated successfully!" });
  } catch (err) {
    console.error("Error saving SMTP settings:", err);
    res.status(500).json({ error: err.message });
  }
});

// Download CSV Template for Mailing List
app.get("/api/admin/subscribers/template", (req, res) => {
  const csvContent = "first_name,last_name,email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com";
  res.setHeader("Content-Type", "text/csv");
  res.attachment("mailing_list_template.csv");
  res.status(200).send(csvContent);
});

// Import CSV for Mailing List
app.post("/api/admin/subscribers/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, "utf8");
    const rows = fileContent.split(/\r?\n/).filter(row => row.trim() !== "");

    if (rows.length < 2) {
      return res.status(400).json({ message: "CSV file is empty or missing headers" });
    }

    const headers = rows[0].split(",").map(h => h.trim().toLowerCase());
    const emailIndex = headers.indexOf("email");
    const firstNameIndex = headers.indexOf("first_name");
    const lastNameIndex = headers.indexOf("last_name");

    if (emailIndex === -1) {
      return res.status(400).json({ message: "CSV must have an 'email' column" });
    }

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const columns = rows[i].split(",").map(c => c.trim());
      const email = columns[emailIndex];
      const firstName = firstNameIndex !== -1 ? columns[firstNameIndex] : "";
      const lastName = lastNameIndex !== -1 ? columns[lastNameIndex] : "";

      if (!email || !email.includes("@")) {
        errorCount++;
        continue;
      }

      try {
        const existing = await pool.query("SELECT email FROM subscribers WHERE email = $1", [email]);
        if (existing.rows.length === 0) {
          await pool.query(
            "INSERT INTO subscribers (email, first_name, last_name, full_name, receipts_opt_in) VALUES ($1, $2, $3, $4, TRUE)",
            [email, firstName, lastName, `${firstName} ${lastName}`.trim()]
          );
          successCount++;
        } else {
          duplicateCount++;
        }
      } catch (err) {
        console.error("Row import error:", err);
        errorCount++;
      }
    }

    // Clean up uploaded file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({
      message: `Import completed: ${successCount} successful, ${duplicateCount} duplicates skipped, ${errorCount} errors skipped.`,
      stats: { successCount, duplicateCount, errorCount }
    });
  } catch (err) {
    console.error("❌ CSV Import Error:", err);
    res.status(500).json({ message: "Error parsing CSV file", error: err.message });
  }
});

const jwt = require("jsonwebtoken");

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

// CSRF TOKEN ROUTE (Simple signed-token implementation)
app.get("/api/csrf-token", (req, res) => {
  const token = jwt.sign({ type: "csrf_v1" }, process.env.JWT_SECRET, { expiresIn: "15m" });
  res.json({ csrfToken: token });
});



// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Initialize database tables
const initDB = async () => {
  console.log("🚀 Starting Database Initialization...");
  try {
    // 1. Roles table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS roles (
          role_id SERIAL PRIMARY KEY,
          role_name VARCHAR(50) UNIQUE NOT NULL
        );
      `);
      console.log("✅ Roles table structure verified");

      const defaultRoles = ['admin', 'editor', 'viewer', 'donor'];
      for (const role of defaultRoles) {
        const roleCheck = await pool.query('SELECT role_id FROM roles WHERE role_name = $1', [role]);
        if (roleCheck.rows.length === 0) {
          await pool.query('INSERT INTO roles (role_name) VALUES ($1)', [role]);
          console.log(`+ Inserted default role: ${role}`);
        } else {
          console.log(`- Role already exists: ${role} (ID: ${roleCheck.rows[0].role_id})`);
        }
      }

      const seqCheck = await pool.query(`
        SELECT setval(pg_get_serial_sequence('roles', 'role_id'), COALESCE((SELECT MAX(role_id) FROM roles), 1));
      `);
      console.log("✅ Roles sequence synchronized:", seqCheck.rows[0].setval);
    } catch (e) {
      console.error("❌ Error in Roles Initialization:", e.message);
      if (e.detail) console.error("Detail:", e.detail);
    }

    // 2. Users table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          contact_number VARCHAR(50),
          address TEXT,
          profile_image TEXT,
          donor_type VARCHAR(50),
          preferred_contact_method VARCHAR(100),
          notes TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          last_login TIMESTAMP
        );
      `);

      // Ensure existing tables get the new column dynamically
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP`);

      console.log("✅ Users table verified");
    } catch (e) {
      console.error("❌ Error in Users table:", e.message);
    }

    // 3. Auth Users table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_users (
          auth_id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
          email VARCHAR(255) UNIQUE NOT NULL,
          hash_password TEXT NOT NULL,
          reset_password_token TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Auth Users table verified");
    } catch (e) {
      console.error("❌ Error in Auth Users table:", e.message);
    }

    // 4. User Roles table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_roles (
          user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
          role_id INT REFERENCES roles(role_id) ON DELETE CASCADE,
          PRIMARY KEY (user_id, role_id)
        );
      `);
      console.log("✅ User Roles table verified");
    } catch (e) {
      console.error("❌ Error in User Roles table:", e.message);
    }

    // 5. Foundations table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS foundations (
          foundation_id SERIAL PRIMARY KEY,
          foundation_name VARCHAR(200) NOT NULL,
          foundation_address TEXT,
          foundation_contact VARCHAR(50),
          foundation_email VARCHAR(150),
          bank_name TEXT,
          bank_information TEXT,
          bank_ca_label VARCHAR(100),
          bank_ca_number VARCHAR(100),
          bank_sa_label VARCHAR(100),
          bank_sa_number VARCHAR(100),
          account_name VARCHAR(150),
          image_logo TEXT,
          image_cover TEXT,
          focus_areas TEXT,
          about_foundation TEXT,
          mission TEXT,
          vision TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Foundations table verified");

      // 2b. Foundation Media Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS foundation_media (
          media_id BIGSERIAL PRIMARY KEY,
          foundation_id BIGINT REFERENCES foundations(foundation_id) ON DELETE CASCADE,
          file_url TEXT NOT NULL,
          media_type VARCHAR(50) DEFAULT 'image',
          uploaded_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Foundation Media table verified");
    } catch (e) {
      console.error("❌ Error in Foundations table or Foundation Media table:", e.message);
    }

    // 6. Campaigns table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS campaigns (
          campaign_id BIGSERIAL PRIMARY KEY,
          campaign_name VARCHAR(200) NOT NULL,
          campaign_type VARCHAR(100),
          campaign_description TEXT,
          goal_amount NUMERIC(12,2),
          current_amount NUMERIC(12,2) DEFAULT 0.00,
          start_date DATE,
          end_date DATE,
          file_url TEXT,
          media_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_featured BOOLEAN DEFAULT FALSE,
          status VARCHAR(20) DEFAULT 'draft',
          receipt_email_subject VARCHAR(255),
          receipt_email_message TEXT
        );

        -- Migration Check for existing table
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='receipt_email_subject') THEN
                ALTER TABLE campaigns ADD COLUMN receipt_email_subject VARCHAR(255);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='receipt_email_message') THEN
                ALTER TABLE campaigns ADD COLUMN receipt_email_message TEXT;
            END IF;
        END $$;
      `);
      console.log("✅ Campaigns table verified");

      // 4. Campaign Media Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS campaign_media (
          media_id BIGSERIAL PRIMARY KEY,
          campaign_id BIGINT REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
          file_url TEXT NOT NULL,
          media_type VARCHAR(50) DEFAULT 'image',
          uploaded_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Campaign Media table verified");

      // 5. Foundation Campaigns (Many-to-Many)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS foundation_campaigns (
          id BIGSERIAL PRIMARY KEY,
          foundation_id BIGINT REFERENCES foundations(foundation_id) ON DELETE CASCADE,
          campaign_id BIGINT REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
          UNIQUE (foundation_id, campaign_id)
        );
      `);
      console.log("✅ Foundation Campaigns table verified");

      // 6. Migration: Harmonize IDs to BIGINT
      await pool.query(`
        DO $$ 
        BEGIN 
            -- foundations.foundation_id is usually already BIGINT if using BIGSERIAL, but ensure others are too
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='foundation_media' AND column_name='foundation_id' AND data_type='integer') THEN
                ALTER TABLE foundation_media ALTER COLUMN foundation_id TYPE BIGINT;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='foundation_media' AND column_name='media_id' AND data_type='integer') THEN
                ALTER TABLE foundation_media ALTER COLUMN media_id TYPE BIGINT;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_media' AND column_name='campaign_id' AND data_type='integer') THEN
                ALTER TABLE campaign_media ALTER COLUMN campaign_id TYPE BIGINT;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_media' AND column_name='media_id' AND data_type='integer') THEN
                ALTER TABLE campaign_media ALTER COLUMN media_id TYPE BIGINT;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_campaigns' AND column_name='associated_campaign_id' AND data_type='integer') THEN
                ALTER TABLE email_campaigns ALTER COLUMN associated_campaign_id TYPE BIGINT;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='template_id' AND data_type='integer') THEN
                ALTER TABLE email_templates ALTER COLUMN template_id TYPE BIGINT;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_id' AND data_type='integer') THEN
                ALTER TABLE audit_logs ALTER COLUMN user_id TYPE BIGINT;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='audit_id' AND data_type='integer') THEN
                ALTER TABLE audit_logs ALTER COLUMN audit_id TYPE BIGINT;
            END IF;
        END $$;
      `);
      console.log("✅ ID Harmonization (BigInt) completed");
    } catch (e) {
      console.error("❌ Error in Campaigns table or related tables:", e.message);
    }

    // 7. Stories table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS stories (
            story_id SERIAL PRIMARY KEY,
            foundation_id INT REFERENCES foundations(foundation_id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            image_file TEXT,
            is_published BOOLEAN DEFAULT FALSE,
            published_at TIMESTAMP,
            author VARCHAR(150),
            tags TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Stories table verified");
    } catch (e) {
      console.error("❌ Error in Stories table:", e.message);
    }

    // 8. Donations table (Comprehensive with missing columns check)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS donations (
          donation_id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(user_id),
          campaign_id INT REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
          amount DECIMAL(15, 2) NOT NULL,
          donation_source VARCHAR(50) DEFAULT 'website',
          currency VARCHAR(10) DEFAULT 'PHP',
          frequency VARCHAR(50) DEFAULT 'one_time',
          message TEXT,
          is_anonymous BOOLEAN DEFAULT FALSE,
          initiated_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP,
          next_due_date DATE
        );
      `);

      const donationsColumns = [
        { name: 'donation_source', type: "VARCHAR(50) DEFAULT 'website'" },
        { name: 'currency', type: "VARCHAR(10) DEFAULT 'PHP'" },
        { name: 'frequency', type: "VARCHAR(50) DEFAULT 'one_time'" },
        { name: 'initiated_at', type: 'TIMESTAMP DEFAULT NOW()' },
        { name: 'completed_at', type: 'TIMESTAMP' },
        { name: 'next_due_date', type: 'DATE' },
        { name: 'message', type: 'TEXT' },
        { name: 'cancellation_reason', type: 'TEXT' },
        { name: 'campaign_id_cascade', type: 'CAMPAIGN_ID_CASCADE' }
      ];

      for (const col of donationsColumns) {
        if (col.name === 'campaign_id_cascade') {
          // Special handling to add CASCADE if not already present
          await pool.query(`
            DO $$ 
            BEGIN 
              IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'donations_campaign_id_fkey') THEN
                ALTER TABLE donations DROP CONSTRAINT donations_campaign_id_fkey;
              END IF;
              ALTER TABLE donations ADD CONSTRAINT donations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id) ON DELETE CASCADE;
            END $$;
          `);
        } else {
          await pool.query(`ALTER TABLE donations ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
        }
      }
      console.log("✅ Donations table verified");
      
      // 8.5. Donation Reminders table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS donation_reminders (
          reminder_id BIGSERIAL PRIMARY KEY,
          donation_id BIGINT REFERENCES donations(donation_id) ON DELETE CASCADE,
          user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
          campaign_id BIGINT REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
          started_date TIMESTAMP DEFAULT NOW(),
          next_payment DATE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(donation_id)
        );
      `);
      console.log("✅ Donation Reminders table verified");
    } catch (e) {
      console.error("❌ Error in Donations table:", e.message);
    }

    // 9. Payment Transactions table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payment_transactions (
          transaction_id SERIAL PRIMARY KEY,
          donation_id INT REFERENCES donations(donation_id) ON DELETE CASCADE,
          campaign_id INT REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
          payment_reference VARCHAR(100) UNIQUE,
          amount DECIMAL(15, 2) NOT NULL,
          payment_status VARCHAR(50) DEFAULT 'pending',
          payment_method VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Payment Transactions table verified");

      // Ensure cascade for payment_transactions
      await pool.query(`
        DO $$ 
        BEGIN 
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payment_transactions_campaign_id_fkey') THEN
            ALTER TABLE payment_transactions DROP CONSTRAINT payment_transactions_campaign_id_fkey;
          END IF;
          ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id) ON DELETE CASCADE;
        END $$;
      `);
      console.log("✅ Payment Transactions cascade verified");
    } catch (e) {
      console.error("❌ Error in Payment Transactions table:", e.message);
    }

    // 10. Audit Logs table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          audit_id BIGSERIAL PRIMARY KEY,
          user_id BIGINT,
          action VARCHAR(255) NOT NULL,
          details TEXT,
          timestamp TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Audit Logs table verified");
    } catch (e) {
      console.error("❌ Error in Audit Logs table:", e.message);
    }

    // 11. Story Categories table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS story_categories (
          category_id BIGSERIAL PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Story Categories table verified");
    } catch (e) {
      console.error("❌ Error in Story Categories table:", e.message);
    }

    // 11. Email Campaigns Configuration table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS email_campaigns (
            campaign_id BIGSERIAL PRIMARY KEY,
            associated_campaign_id BIGINT REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            category VARCHAR(100),
            status VARCHAR(50) DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await pool.query(`ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS from_email VARCHAR(255)`);
      await pool.query(`ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS cc_email VARCHAR(255)`);
      await pool.query(`ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS auto_send BOOLEAN DEFAULT FALSE`);

      const checkTemplate = await pool.query("SELECT * FROM email_campaigns WHERE category = 'receipt_template'");
      if (checkTemplate.rows.length === 0) {
        await pool.query(`
          INSERT INTO email_campaigns (title, message, category, status)
          VALUES (
            'Donation Receipt Template',
            'Thank you for your generous support! Your donation helps us make a difference.',
            'receipt_template',
            'active'
          )
        `);
      }
      console.log("✅ Email Campaigns table verified");
    } catch (e) {
      console.error("❌ Error in Email Campaigns table:", e.message);
    }

    // 12. Email Logs table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS email_logs (
          log_id SERIAL PRIMARY KEY,
          recipient_email VARCHAR(255) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          message TEXT,
          status VARCHAR(50) DEFAULT 'success',
          error_message TEXT,
          sent_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Email Logs table verified");
    } catch (e) {
      console.error("❌ Error in Email Logs table:", e.message);
    }

    // 13. Subscribers table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS subscribers (
          subscriber_id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          full_name VARCHAR(255),
          receipts_opt_in BOOLEAN DEFAULT TRUE,
          newsletters_opt_in BOOLEAN DEFAULT FALSE,
          status VARCHAR(50) DEFAULT 'active',
          subscribed_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Ensure existing tables see the new columns if necessary
      await pool.query(`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)`);
      await pool.query(`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)`);

      console.log("✅ Subscribers table verified");

      // Seed subscribers from users if empty
      const subRes = await pool.query("SELECT COUNT(*) FROM subscribers");
      if (parseInt(subRes.rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO subscribers (user_id, email, full_name, receipts_opt_in, newsletters_opt_in)
          SELECT u.user_id, a.email, u.first_name || ' ' || u.last_name, TRUE, FALSE
          FROM users u
          JOIN auth_users a ON u.user_id = a.user_id
          ON CONFLICT (email) DO NOTHING
        `);
        console.log("✅ Root subscribers list seeded from existing users");
      }
    } catch (e) {
      console.error("❌ Error in Subscribers table:", e.message);
    }





    console.log("🌟 Database Initialization Complete!");
  } catch (err) {
    console.error("❌ Global Initialization Error:", err.message);
  }
};

initDB();

// Global audit logging helper (Revised)
const logAudit = async (data) => {
  const { userId, action, details } = data;
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [userId, action, details]
    );
  } catch (err) {
    console.error("❌ Failed to log audit action:", err.message);
  }
};

// Make logAudit available to other modules if needed (via app.locals or similar)
app.locals.logAudit = logAudit;
app.locals.pool = pool;

// Multer configuration relocated to top


// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// Import Login Routes
const loginRoutes = require("./LoginBackend");
app.use("/api/auth", loginRoutes);

const profileRoutes = require("./ProfileBackend");
app.use("/api/user", profileRoutes);

try {
  const campaignRoutes = require("./CampaignBackend");
  app.use("/api/campaigns", campaignRoutes);
  console.log("✅ Campaign routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading Campaign routes:", error.message);
}

try {
  const foundationRoutes = require("./FoundationBackend");
  app.use("/api/foundations", foundationRoutes);
  console.log("✅ Foundation routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading Foundation routes:", error.message);
}

try {
  const storyRoutes = require("./StoryBackend");
  app.use("/api/stories", storyRoutes);
  console.log("✅ Story routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading Story routes:", error.message);
}

try {
  const { router: userManagementRoutes } = require("./UserManagementBackend");
  app.use("/api/admin", userManagementRoutes);
  console.log("✅ User Management routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading User Management routes:", error.message);
}

try {
  const auditRoutes = require("./AuditBackend");
  app.use("/api/audit", auditRoutes);
  console.log("✅ Audit routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading Audit routes:", error.message);
}

// Story Categories CRUD
app.get("/api/admin/story-categories", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM story_categories ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/story-categories", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Category name is required" });
  try {
    const result = await pool.query(
      "INSERT INTO story_categories (name) VALUES ($1) RETURNING *",
      [name]
    );
    res.status(201).json({ message: "Category created", category: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: "Category already exists" });
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/story-categories/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    await pool.query(
      "UPDATE story_categories SET name = $1 WHERE category_id = $2",
      [name, id]
    );
    res.json({ message: "Category updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/story-categories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM story_categories WHERE category_id = $1", [id]);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

try {
  const donationRoutes = require("./DonationBackend");
  app.use("/api/donations", donationRoutes);
  app.use("/api/admin/donations", donationRoutes); // Reusing for admin specific if needed
  console.log("✅ Donation routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading Donation routes:", error.message);
}

try {
  const reportRoutes = require("./ReportsBackend");
  app.use("/api/admin/reports", reportRoutes);
  console.log("✅ Report routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading Report routes:", error.message);
}

try {
  const dashboardRoutes = require("./DashboardBackend");
  app.use("/api/admin/dashboard", dashboardRoutes);
  console.log("✅ Dashboard routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading Dashboard routes:", error.message);
}

try {
  const transactionRoutes = require("./TransactionBackend");
  app.use("/api/transactions", transactionRoutes);
  console.log("✅ Transaction routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading Transaction routes:", error.message);
}

// Relocated to top

// ─────────────────────────────────────────────
// Thank You Letters CRUD
// ─────────────────────────────────────────────

// Get all Thank You Letters
app.get("/api/admin/thank-you-letters", async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT e.*, e.from_email as from, e.cc_email as cc, e.auto_send, c.campaign_name 
            FROM email_campaigns e 
            LEFT JOIN campaigns c ON e.associated_campaign_id = c.campaign_id 
            WHERE e.category = 'thank_you_letter' 
            ORDER BY e.updated_at DESC
        `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Thank You Letter
app.post("/api/admin/thank-you-letters", async (req, res) => {
  const { title, message, status, associated_campaign_id, from, cc, auto_send } = req.body;
  try {
    const campaignId = (!associated_campaign_id || associated_campaign_id === 'global') ? null : associated_campaign_id;
    const result = await pool.query(
      "INSERT INTO email_campaigns (title, message, category, status, associated_campaign_id, from_email, cc_email, auto_send) VALUES ($1, $2, 'thank_you_letter', $3, $4, $5, $6, $7) RETURNING *",
      [title, message, status || 'draft', campaignId, from || null, cc || null, auto_send || false]
    );
    res.json({ message: "Thank You Letter created successfully!", letter: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Thank You Letter
app.put("/api/admin/thank-you-letters/:id", async (req, res) => {
  const { id } = req.params;
  const { title, message, status, associated_campaign_id, from, cc, auto_send } = req.body;
  try {
    const campaignId = (!associated_campaign_id || associated_campaign_id === 'global') ? null : associated_campaign_id;
    const result = await pool.query(
      "UPDATE email_campaigns SET title = $1, message = $2, status = $3, associated_campaign_id = $4, from_email = $5, cc_email = $6, auto_send = $7, updated_at = NOW() WHERE campaign_id = $8 RETURNING *",
      [title, message, status, campaignId, from || null, cc || null, auto_send || false, id]
    );
    res.json({ message: "Thank You Letter updated successfully!", letter: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Thank You Letter
app.delete("/api/admin/thank-you-letters/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM email_campaigns WHERE campaign_id = $1", [id]);
    res.json({ message: "Thank You Letter deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Send Emails
app.post("/api/admin/bulk-send-emails", async (req, res) => {
  const { recipients, subject, html, campaign_name, from_email, cc } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ message: "No recipients provided" });
  }

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (const donor of recipients) {
    try {
      const emailAddr = donor.email;
      if (!emailAddr) continue;

      // Variable Replacement Logic
      const replacements = {
        '{{firstname}}': donor.first_name || '',
        '{{lastname}}': donor.last_name || '',
        '{{campaign_name}}': campaign_name || 'Our Campaign',
        '{{address}}': donor.address || 'Standard Address'
      };

      let personalizedSubject = subject;
      let personalizedHtml = html;

      Object.entries(replacements).forEach(([key, val]) => {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        personalizedSubject = personalizedSubject.replace(regex, val);
        personalizedHtml = personalizedHtml.replace(regex, val);
      });

      // Wrap in standard container - Trusting Quill HTML
      const finalHtml = `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                ${personalizedHtml}
            </div>`;

      const result = await sendEmail(emailAddr, personalizedSubject, finalHtml, from_email, cc);
      if (result.success) successCount++;
      else {
        failCount++;
        errors.push({ email: emailAddr, error: result.error });
      }
    } catch (err) {
      failCount++;
      errors.push({ donor: donor.email, error: err.message });
    }
  }

  res.json({
    message: `Batch complete: ${successCount} successful, ${failCount} failed.`,
    successCount,
    failCount,
    errors
  });
});

// Get Donors for Manual Sending
app.get("/api/admin/mailing-donors", async (req, res) => {

  const { campaign_id } = req.query;
  try {
    let query = `
            SELECT DISTINCT dn.donor_id, dn.first_name, dn.last_name, dn.email, dn.address
            FROM donors dn
            INNER JOIN donations d ON dn.donor_id = d.donor_id
            WHERE dn.email IS NOT NULL AND dn.email != ''
        `;
    const params = [];
    if (campaign_id && campaign_id !== 'global' && campaign_id !== 'null') {
      query += ` AND d.campaign_id = $1`;
      params.push(campaign_id);
    }
    query += ` ORDER BY dn.first_name`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Mailing donors error:", err);
    res.status(500).json({ error: err.message });
  }
});


// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// Get all users example
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

const bcrypt = require("bcrypt");

//GET USERS TABLE FOR PROFILE
app.get("/api/user/profile/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.contact_number,
        u.address,
        u.donor_type,
        u.preferred_contact_method,
        u.notes,
        u.profile_image,
        u.created_at,
        a.email
      FROM users u
      LEFT JOIN auth_users a ON u.user_id = a.user_id
      WHERE u.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


const axios = require("axios");

// ReCAPTCHA Verification Helper
const verifyCaptcha = async (token) => {
  if (!token) return false;
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    );
    // For v3, we check success AND score (typically 0.5+)
    return response.data.success && (response.data.score === undefined || response.data.score >= 0.5);
  } catch (error) {
    console.error("reCAPTCHA Verification Error:", error);
    return false;
  }
};

// REGISTER USER
app.post("/api/auth_users/register", async (req, res) => {
  const { firstName, lastName, email, password, captchaToken, csrfToken } = req.body;

  // 1. Verify CSRF
  if (!csrfToken) return res.status(403).json({ message: "Missing CSRF token." });
  try {
    const decoded = jwt.verify(csrfToken, process.env.JWT_SECRET);
    if (decoded.type !== "csrf_v1") throw new Error();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired CSRF token." });
  }

  // 2. Verify CAPTCHA
  const isCaptchaValid = await verifyCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: "Invalid CAPTCHA verification. Please try again." });
  }

  try {
    // 1. Check if email already exists
    const emailCheck = await pool.query(
      "SELECT * FROM auth_users WHERE email = $1",
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // 2. Create user entry
    const userResult = await pool.query(
      `INSERT INTO users (first_name, last_name)
       VALUES ($1, $2)
       RETURNING user_id`,
      [firstName, lastName]
    );

    const userId = userResult.rows[0].user_id;

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save auth_users record
    await pool.query(
      `INSERT INTO auth_users (user_id, email, hash_password)
       VALUES ($1, $2, $3)`,
      [userId, email, hashedPassword]
    );

    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, 4)`, // 7 = Viewer/User
      [userId]
    )

    // 5. Add to subscribers mailing list
    try {
      await pool.query(
        `INSERT INTO subscribers (user_id, email, full_name, receipts_opt_in, newsletters_opt_in)
             VALUES ($1, $2, $3, TRUE, FALSE)
             ON CONFLICT (email) DO NOTHING`,
        [userId, email, `${firstName} ${lastName}`]
      );
    } catch (subErr) {
      console.error("Failed to add to subscribers:", subErr.message);
    }

    return res.json({ message: "Registration successful!", userId });


  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPLOAD PROFILE IMAGE
app.post("/api/user/profile/upload-image", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Generate the image path (relative URL for frontend)
    const imagePath = `/uploads/profiles/${req.file.filename}`;

    // Update user's profile_image in database
    await pool.query(
      "UPDATE users SET profile_image = $1 WHERE user_id = $2",
      [imagePath, userId]
    );

    res.json({
      success: true,
      imagePath: imagePath,
      message: "Profile image uploaded successfully"
    });

  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ message: "Failed to upload image" });
  }
});

// UPDATE USER PROFILE
app.put("/api/user/profile/:id", async (req, res) => {
  const userId = req.params.id;
  const { firstName, lastName, phone, address, province, city, zipCode, tinNumber, profileImage } = req.body;

  try {
    const updateQuery = `
      UPDATE users 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        contact_number = COALESCE($3, contact_number),
        address = COALESCE($4, address),
        profile_image = COALESCE($5, profile_image)
      WHERE user_id = $6
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      firstName,
      lastName,
      phone,
      address,
      profileImage,
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log the update action
    await logAudit({
      userId: userId,
      action: "Profile Updated",
      details: `Updated profile details for user ID ${userId}.`
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: result.rows[0]
    });

  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Start server - MUST be at the end after all routes are defined
// Start server - Explicitly listen on 127.0.0.1 to avoid IPv6 confusion
app.listen(5000, '127.0.0.1', () => {
  console.log("Nagana na yah! Running on http://127.0.0.1:5000");
});