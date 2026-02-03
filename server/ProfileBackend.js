const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ================================
// GET USER PROFILE (by user_id)
// ================================
router.get("/profile/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.contact_number,
        u.address,
        u.created_at AS member_since,
        a.email
      FROM users u
      JOIN auth_users a ON u.user_id = a.user_id
      WHERE u.user_id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error retrieving user profile" });
  }
});

module.exports = router;
