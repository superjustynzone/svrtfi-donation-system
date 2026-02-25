//Backend.js (Handles the Backend)
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
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
  const donationRoutes = require("./DonationBackend");
  app.use("/api/donations", donationRoutes);
  console.log("✅ Donation routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading Donation routes:", error.message);
}

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
