// LoginBackend.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Load environment variables
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const axios = require("axios");

// ReCAPTCHA Verification Helper
const verifyCaptcha = async (token) => {
    if (!token) return false;
    try {
        const secret = process.env.RECAPTCHA_SECRET_KEY;
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`
        );
        // For v3, we check success AND score
        return response.data.success && (response.data.score === undefined || response.data.score >= 0.5);
    } catch (error) {
        console.error("reCAPTCHA Verification Error:", error);
        return false;
    }
};

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  const { email, password, captchaToken, csrfToken } = req.body;

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
      return res.status(403).json({ message: "Account not verified or deactivated. Please verify your email first." });
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

    // 4. Update last_login
    await pool.query(
      `UPDATE users SET last_login = NOW() WHERE user_id = $1`,
      [user.user_id]
    );

    // 5. Create JWT Token
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

// UPDATE PASSWORD
router.post("/change-password", async (req, res) => {
  const { user_id, currentPassword, newPassword } = req.body;

  if (!user_id || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // 1. Get current hash
    const userRes = await pool.query(
      "SELECT hash_password FROM auth_users WHERE user_id = $1",
      [user_id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const { hash_password } = userRes.rows[0];

    // 2. Validate current password
    const isMatch = await bcrypt.compare(currentPassword, hash_password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    // 3. Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // 4. Update
    await pool.query(
      "UPDATE auth_users SET hash_password = $1, updated_at = NOW() WHERE user_id = $2",
      [newHash, user_id]
    );

    res.json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
