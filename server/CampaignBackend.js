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
    // Ensure directory exists
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

// CREATE CAMPAIGN
router.post("/create", async (req, res) => {
  const {
    campaign_name,
    campaign_type,
    campaign_description,
    foundation_id,
    goal_amount,
    start_date,
    end_date
  } = req.body;

  try {
    // Validate required fields
    if (!campaign_name || !foundation_id) {
      return res.status(400).json({ message: "Campaign name and foundation are required." });
    }

    // 1. Create campaign with new fields
    const campaignResult = await pool.query(
      `INSERT INTO campaigns (
        campaign_name, 
        campaign_type, 
        campaign_description,
        goal_amount,
        start_date,
        end_date
      )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING campaign_id`,
      [campaign_name, campaign_type, campaign_description, goal_amount, start_date, end_date]
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
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL CAMPAIGNS (with foundation details)
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
        c.created_at,
        c.updated_at,
        f.foundation_id,
        f.foundation_name,
        fd.image_logo as foundation_logo
       FROM campaigns c
       LEFT JOIN foundation_campaigns fc ON c.campaign_id = fc.campaign_id
       LEFT JOIN foundations f ON fc.foundation_id = f.foundation_id
       LEFT JOIN foundation_details fd ON f.foundation_id = fd.foundation_id
       ORDER BY c.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET ALL CAMPAIGNS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET SPECIFIC CAMPAIGN (with foundation and media)
router.get("/:id", async (req, res) => {
  const campaignId = req.params.id;

  try {
    // Get campaign with foundation
    const campaignResult = await pool.query(
      `SELECT 
        c.campaign_id,
        c.campaign_name,
        c.campaign_type,
        c.campaign_description,
        c.goal_amount,
        c.current_amount,
        c.start_date,
        c.end_date,
        c.created_at,
        c.updated_at,
        f.foundation_id,
        f.foundation_name,
        fd.image_logo as foundation_logo,
        fd.about_foundation as foundation_desc
       FROM campaigns c
       LEFT JOIN foundation_campaigns fc ON c.campaign_id = fc.campaign_id
       LEFT JOIN foundations f ON fc.foundation_id = f.foundation_id
       LEFT JOIN foundation_details fd ON f.foundation_id = fd.foundation_id
       WHERE c.campaign_id = $1`,
      [campaignId]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Get campaign media
    const mediaResult = await pool.query(
      `SELECT media_id, file_url, media_type, uploaded_at
       FROM campaign_media
       WHERE campaign_id = $1
       ORDER BY uploaded_at DESC`,
      [campaignId]
    );

    const campaign = campaignResult.rows[0];
    campaign.media = mediaResult.rows;

    res.json(campaign);

  } catch (err) {
    console.error("GET CAMPAIGN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE CAMPAIGN
router.put("/update/:id", async (req, res) => {
  const campaignId = req.params.id;
  const {
    campaign_name,
    campaign_type,
    campaign_description,
    foundation_id,
    goal_amount,
    start_date,
    end_date
  } = req.body;

  try {
    // Check if campaign exists
    const checkResult = await pool.query(
      "SELECT * FROM campaigns WHERE campaign_id = $1",
      [campaignId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Update campaign
    await pool.query(
      `UPDATE campaigns 
       SET campaign_name = $1, 
           campaign_type = $2, 
           campaign_description = $3,
           goal_amount = $4,
           start_date = $5,
           end_date = $6,
           updated_at = NOW()
       WHERE campaign_id = $7`,
      [campaign_name, campaign_type, campaign_description, goal_amount, start_date, end_date, campaignId]
    );

    // Update foundation association if provided
    if (foundation_id) {
      // Delete existing association
      await pool.query("DELETE FROM foundation_campaigns WHERE campaign_id = $1", [campaignId]);

      // Create new association
      await pool.query(
        `INSERT INTO foundation_campaigns (foundation_id, campaign_id)
         VALUES ($1, $2)`,
        [foundation_id, campaignId]
      );
    }

    return res.json({ message: "Campaign updated successfully!" });

  } catch (err) {
    console.error("UPDATE CAMPAIGN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE CAMPAIGN
router.delete("/delete/:id", async (req, res) => {
  const campaignId = req.params.id;

  try {
    // Check if campaign exists
    const checkResult = await pool.query(
      "SELECT * FROM campaigns WHERE campaign_id = $1",
      [campaignId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Delete campaign (cascade will handle foundation_campaigns and campaign_media)
    await pool.query("DELETE FROM campaigns WHERE campaign_id = $1", [campaignId]);

    return res.json({ message: "Campaign deleted successfully!" });

  } catch (err) {
    console.error("DELETE CAMPAIGN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPLOAD CAMPAIGN MEDIA
router.post("/upload-media/:id", (req, res, next) => {
  upload.array("images", 10)(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: "Multer error: " + err.message });
    } else if (err) {
      return res.status(500).json({ message: "Upload error: " + err.message });
    }
    next();
  });
}, async (req, res) => {
  const campaignId = parseInt(req.params.id);

  if (isNaN(campaignId)) {
    return res.status(400).json({ message: "Invalid campaign ID" });
  }

  try {
    // Check if campaign exists
    const checkResult = await pool.query(
      "SELECT * FROM campaigns WHERE campaign_id = $1",
      [campaignId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Insert media records into database
    const mediaPromises = req.files.map((file) => {
      const fileUrl = `/uploads/campaigns/${file.filename}`;
      console.log(`Processing upload: ${file.filename} for campaign ${campaignId}`);
      return pool.query(
        `INSERT INTO campaign_media (campaign_id, file_url, media_type)
         VALUES ($1, $2, $3)
         RETURNING media_id, file_url, media_type, uploaded_at`,
        [campaignId, fileUrl, "image"]
      );
    });

    const results = await Promise.all(mediaPromises);
    const uploadedMedia = results.map((result) => result.rows[0]);

    console.log(`Successfully uploaded ${uploadedMedia.length} images for campaign ${campaignId}`);

    return res.json({
      message: "Images uploaded successfully!",
      media: uploadedMedia,
    });

  } catch (err) {
    console.error("UPLOAD MEDIA ERROR DETAILS:", {
      message: err.message,
      detail: err.detail, // PG specific detail
      code: err.code,     // PG specific code
      stack: err.stack,
      campaignId: campaignId,
      files: req.files ? req.files.map(f => f.filename) : 'none'
    });
    res.status(500).json({ message: "Server error during media insertion: " + err.message });
  }
});

// DELETE CAMPAIGN MEDIA
router.delete("/media/:media_id", async (req, res) => {
  const mediaId = req.params.media_id;

  try {
    // Get media info before deleting
    const mediaResult = await pool.query(
      "SELECT * FROM campaign_media WHERE media_id = $1",
      [mediaId]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ message: "Media not found" });
    }

    const media = mediaResult.rows[0];

    // Delete file from filesystem
    const filePath = path.join(__dirname, media.file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await pool.query("DELETE FROM campaign_media WHERE media_id = $1", [mediaId]);

    return res.json({ message: "Media deleted successfully!" });

  } catch (err) {
    console.error("DELETE MEDIA ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
