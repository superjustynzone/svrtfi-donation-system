// LoginBackend.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Load environment variables
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists in auth_users
    const userCheck = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.is_active, a.hash_password
       FROM auth_users a
       JOIN users u ON a.user_id = u.user_id
       WHERE a.email = $1`,
      [email]
    );

    if (userCheck.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const user = userCheck.rows[0];

    // 2. Validate password
    const isMatch = await bcrypt.compare(password, user.hash_password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // 3. Check if account is active
    if (user.is_active === false) {
      return res.status(403).json({ message: "Account deactivated. Please contact administrator." });
    }

    // 3. Fetch user role
    const roleResult = await pool.query(
      `SELECT r.role_name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = $1`,
      [user.user_id]
    );

    const role = roleResult.rows[0]?.role_name || "viewer";

    // 4. Create JWT Token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email,
        role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Return data to frontend
    return res.json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email,
        role,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
