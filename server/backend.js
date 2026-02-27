//Backend.js (Handles the Backend)
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

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
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
          foundation_name VARCHAR(255) NOT NULL,
          focus_areas TEXT[],
          about_foundation TEXT,
          mission TEXT,
          vision TEXT,
          contact_number VARCHAR(50),
          email VARCHAR(255),
          address TEXT,
          image_cover TEXT,
          image_logo TEXT,
          bank_name VARCHAR(255),
          bank_account_name VARCHAR(255),
          bank_account_number VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Foundations table verified");
    } catch (e) {
      console.error("❌ Error in Foundations table:", e.message);
    }

    // 6. Campaigns table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS campaigns (
          campaign_id SERIAL PRIMARY KEY,
          campaign_name VARCHAR(255) NOT NULL,
          campaign_type VARCHAR(100),
          campaign_description TEXT,
          goal_amount DECIMAL(15, 2),
          current_amount DECIMAL(15, 2) DEFAULT 0,
          start_date DATE,
          end_date DATE,
          file_url TEXT,
          media_type VARCHAR(50),
          is_featured BOOLEAN DEFAULT FALSE,
          status VARCHAR(50) DEFAULT 'draft',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Campaigns table verified");
    } catch (e) {
      console.error("❌ Error in Campaigns table:", e.message);
    }

    // 7. Foundation Campaigns table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS foundation_campaigns (
          foundation_id INT REFERENCES foundations(foundation_id) ON DELETE CASCADE,
          campaign_id INT REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
          PRIMARY KEY (foundation_id, campaign_id)
        );
      `);
      console.log("✅ Foundation Campaigns table verified");
    } catch (e) {
      console.error("❌ Error in Foundation Campaigns table:", e.message);
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
  const userManagementRoutes = require("./UserManagementBackend");
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


// REGISTER USER
app.post("/api/auth_users/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

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
