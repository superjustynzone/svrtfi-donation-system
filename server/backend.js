//Backend.js (Handles the Backend)
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
      VALUES ($1, 7)`, // 7 = Viewer/User
      [userId]
    )



    return res.json({ message: "Registration successful!", userId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Start server - MUST be at the end after all routes are defined
app.listen(5000, () => {
  console.log("Nagana na yah!");
  console.log("Server running on http://localhost:5000");
  console.log("Available routes:");
  console.log("  - POST /api/campaigns/create");
  console.log("  - GET  /api/campaigns/all");
  console.log("  - GET  /api/foundations/all");
});
