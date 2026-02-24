// CampaignBackend.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Load environment variables
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads", "campaigns");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "campaign-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Helper to handle single file upload
const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: "Multer error: " + err.message });
    } else if (err) {
      return res.status(500).json({ message: "Upload error: " + err.message });
    }
    next();
  });
};

// CREATE CAMPAIGN
router.post("/create", handleUpload, async (req, res) => {
  const {
    campaign_name,
    campaign_type,
    campaign_description,
    foundation_id,
    goal_amount,
    start_date,
    end_date,
    is_featured
  } = req.body;

  try {
    // Validate required fields
    if (!campaign_name || !foundation_id) {
      return res.status(400).json({ message: "Campaign name and foundation are required." });
    }

    // Handle image upload
    const file_url = req.file ? `/uploads/campaigns/${req.file.filename}` : null;
    const media_type = req.file ? "image" : null;

    // 1. Create campaign (end_date can be null for endless campaigns)
    const campaignResult = await pool.query(
      `INSERT INTO campaigns (
        campaign_name, campaign_type, campaign_description,
        goal_amount, start_date, end_date,
        file_url, media_type, is_featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING campaign_id`,
      [
        campaign_name, campaign_type, campaign_description,
        goal_amount, start_date, end_date || null,
        file_url, media_type, is_featured === 'true' || is_featured === true
      ]
    );

    const campaignId = campaignResult.rows[0].campaign_id;

    // 2. Link campaign to foundation
    await pool.query(
      `INSERT INTO foundation_campaigns (foundation_id, campaign_id)
       VALUES ($1, $2)`,
      [foundation_id, campaignId]
    );

    return res.json({
      message: "Campaign created successfully!",
      campaign_id: campaignId
    });

  } catch (err) {
    console.error("CREATE CAMPAIGN ERROR:", err);

    // Clean up uploaded file on error
    if (req.file) {
      const filePath = path.join(__dirname, "uploads", "campaigns", req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// GET ALL CAMPAIGNS (with foundation info)
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.campaign_id,
        c.campaign_name,
        c.campaign_type,
        c.campaign_description,
        c.goal_amount,
        c.current_amount,
        c.start_date,
        c.end_date,
        c.file_url,
        c.media_type,
        c.is_featured,
        c.created_at,
        c.updated_at,
        f.foundation_id,
        f.foundation_name,
        f.image_logo as foundation_logo
       FROM campaigns c
       LEFT JOIN foundation_campaigns fc ON c.campaign_id = fc.campaign_id
       LEFT JOIN foundations f ON fc.foundation_id = f.foundation_id
       ORDER BY c.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET ALL CAMPAIGNS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET SPECIFIC CAMPAIGN
router.get("/:id", async (req, res) => {
  const campaignId = req.params.id;

  try {
    const campaignResult = await pool.query(
      `SELECT 
        c.*,
        f.foundation_id,
        f.foundation_name,
        f.image_logo as foundation_logo,
        f.about_foundation as foundation_desc
       FROM campaigns c
       LEFT JOIN foundation_campaigns fc ON c.campaign_id = fc.campaign_id
       LEFT JOIN foundations f ON fc.foundation_id = f.foundation_id
       WHERE c.campaign_id = $1`,
      [campaignId]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    res.json(campaignResult.rows[0]);

  } catch (err) {
    console.error("GET CAMPAIGN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE CAMPAIGN
router.put("/update/:id", handleUpload, async (req, res) => {
  const campaignId = req.params.id;
  const {
    campaign_name,
    campaign_type,
    campaign_description,
    foundation_id,
    goal_amount,
    start_date,
    end_date,
    is_featured
  } = req.body;

  try {
    // Check if campaign exists and get existing image
    const checkResult = await pool.query(
      "SELECT file_url FROM campaigns WHERE campaign_id = $1",
      [campaignId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Handle image: use new upload or keep existing
    let file_url = checkResult.rows[0].file_url;
    let media_type = checkResult.rows[0].media_type;

    if (req.file) {
      // Delete old image if exists
      if (file_url) {
        const relativePath = file_url.startsWith('/') ? file_url.substring(1) : file_url;
        const fullPath = path.join(__dirname, relativePath);
        if (fs.existsSync(fullPath)) {
          try { fs.unlinkSync(fullPath); } catch (e) { console.error("Failed to delete old image", e); }
        }
      }
      file_url = `/uploads/campaigns/${req.file.filename}`;
      media_type = "image";
    }

    // Update campaign (end_date can be null for endless campaigns)
    await pool.query(
      `UPDATE campaigns 
       SET campaign_name = $1, 
           campaign_type = $2, 
           campaign_description = $3,
           goal_amount = $4,
           start_date = $5,
           end_date = $6,
           file_url = $7,
           media_type = $8,
           is_featured = $9,
           updated_at = NOW()
       WHERE campaign_id = $10`,
      [
        campaign_name, campaign_type, campaign_description,
        goal_amount, start_date, end_date || null,
        file_url, media_type,
        is_featured === 'true' || is_featured === true,
        campaignId
      ]
    );

    // Update foundation association if provided
    if (foundation_id) {
      await pool.query("DELETE FROM foundation_campaigns WHERE campaign_id = $1", [campaignId]);
      await pool.query(
        `INSERT INTO foundation_campaigns (foundation_id, campaign_id)
         VALUES ($1, $2)`,
        [foundation_id, campaignId]
      );
    }

    return res.json({ message: "Campaign updated successfully!" });

  } catch (err) {
    console.error("UPDATE CAMPAIGN ERROR:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// DELETE CAMPAIGN
router.delete("/delete/:id", async (req, res) => {
  const campaignId = req.params.id;

  try {
    // Get campaign to delete associated image
    const checkResult = await pool.query(
      "SELECT file_url FROM campaigns WHERE campaign_id = $1",
      [campaignId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Delete image file if exists
    const fileUrl = checkResult.rows[0].file_url;
    if (fileUrl) {
      const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
      const fullPath = path.join(__dirname, relativePath);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) { console.error("Failed to delete file", e); }
      }
    }

    // Delete campaign (cascade will handle foundation_campaigns)
    await pool.query("DELETE FROM campaigns WHERE campaign_id = $1", [campaignId]);

    return res.json({ message: "Campaign deleted successfully!" });

  } catch (err) {
    console.error("DELETE CAMPAIGN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
