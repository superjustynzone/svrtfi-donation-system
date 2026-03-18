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
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
          media_id SERIAL PRIMARY KEY,
          foundation_id INT REFERENCES foundations(foundation_id) ON DELETE CASCADE,
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
          campaign_id SERIAL PRIMARY KEY,
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
          media_id SERIAL PRIMARY KEY,
          campaign_id INT REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
          file_url TEXT NOT NULL,
          media_type VARCHAR(50) DEFAULT 'image',
          uploaded_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Campaign Media table verified");

      // 5. Foundation Campaigns (Many-to-Many)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS foundation_campaigns (
          id SERIAL PRIMARY KEY,
          foundation_id INT REFERENCES foundations(foundation_id) ON DELETE CASCADE,
          campaign_id INT REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
          UNIQUE (foundation_id, campaign_id)
        );
      `);
      console.log("✅ Foundation Campaigns table verified");
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
          audit_id SERIAL PRIMARY KEY,
          user_id INT,
          action VARCHAR(255) NOT NULL,
          details TEXT,
          timestamp TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Audit Logs table verified");
    } catch (e) {
      console.error("❌ Error in Audit Logs table:", e.message);
    }

    // 11. Email Campaigns Configuration table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS email_campaigns (
            campaign_id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            category VARCHAR(100),
            status VARCHAR(50) DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      // Seed default receipt template if missing
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

// Multer configuration for profile image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads", "profiles");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: user_ID_timestamp.extension
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.body.userId || 'unknown'}_${uniqueSuffix}${ext}`);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});


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

// ─────────────────────────────────────────────
// Mailing Routes
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

// Get Receipt Template (Global or Campaign-specific)
app.get("/api/admin/receipt-template", async (req, res) => {
    const { campaign_id } = req.query;
    try {
        if (campaign_id && campaign_id !== 'global') {
            const result = await pool.query("SELECT receipt_email_subject as title, receipt_email_message as message FROM campaigns WHERE campaign_id = $1", [campaign_id]);
            if (result.rows.length > 0 && result.rows[0].title) {
                return res.json(result.rows[0]);
            }
        }
        const result = await pool.query("SELECT * FROM email_campaigns WHERE category = 'receipt_template' LIMIT 1");
        res.json(result.rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Receipt Template (Global or Campaign-specific)
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
        await pool.query(
            "UPDATE email_campaigns SET title = $1, message = $2, updated_at = NOW() WHERE category = 'receipt_template'",
            [title, message]
        );
        res.json({ message: "Global receipt template updated successfully!" });
    } catch (err) {
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
        return response.data.success;
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
app.listen(5000, () => {
  console.log("Nagana na yah!");
});
