// CampaignBackend.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

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

// Helper to handle multiple file uploads
const handleUpload = (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: "Multer error: " + err.message });
    } else if (err) {
      return res.status(500).json({ message: "Upload error: " + err.message });
    }
    next();
  });
};

// CREATE CAMPAIGN (defaults to 'draft' status)
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
    if (!campaign_name || !foundation_id) {
      return res.status(400).json({ message: "Campaign name and foundation are required." });
    }

    let file_url = null;
    let media_type = null;

    // Default main image to first uploaded file, and the rest to media table later
    if (req.files && req.files.length > 0) {
      file_url = `/uploads/campaigns/${req.files[0].filename}`;
      media_type = "image";
    }

    // Status defaults to 'draft'
    const campaignResult = await pool.query(
      `INSERT INTO campaigns (
        campaign_name, campaign_type, campaign_description,
        goal_amount, start_date, end_date,
        file_url, media_type, is_featured, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
       RETURNING campaign_id`,
      [
        campaign_name, campaign_type, campaign_description,
        goal_amount, start_date, end_date || null,
        file_url, media_type, is_featured === 'true' || is_featured === true
      ]
    );

    const campaignId = campaignResult.rows[0].campaign_id;

    await pool.query(
      `INSERT INTO foundation_campaigns (foundation_id, campaign_id)
       VALUES ($1, $2)`,
      [foundation_id, campaignId]
    );

    // Insert remaining files into campaign_media
    if (req.files && req.files.length > 1) {
      for (let i = 1; i < req.files.length; i++) {
        const url = `/uploads/campaigns/${req.files[i].filename}`;
        await pool.query(
          `INSERT INTO campaign_media (campaign_id, file_url, media_type) VALUES ($1, $2, $3)`,
          [campaignId, url, 'image']
        );
      }
    }

    // Log campaign creation
    if (req.app.locals.logAudit) {
      await req.app.locals.logAudit({
        userId: req.body.userId || null,
        action: "Campaign: Created",
        details: `Created campaign: ${campaign_name} (Type: ${campaign_type})`
      });
    }

    return res.json({
      message: "Campaign created as draft!",
      campaign_id: campaignId
    });

  } catch (err) {
    console.error("CREATE CAMPAIGN ERROR:", err);
    if (req.files) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, "uploads", "campaigns", file.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// GET ALL CAMPAIGNS (admin - returns all drafts and published)
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.campaign_id, c.campaign_name, c.campaign_type,
        c.campaign_description, c.goal_amount, c.current_amount,
        c.start_date, c.end_date, c.file_url, c.media_type,
        c.is_featured, c.status, c.created_at, c.updated_at,
        f.foundation_id, f.foundation_name,
        f.image_logo as foundation_logo,
        (
          SELECT json_agg(json_build_object('media_id', cm.media_id, 'file_url', cm.file_url))
          FROM campaign_media cm
          WHERE cm.campaign_id = c.campaign_id
        ) as media
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

// GET PUBLISHED CAMPAIGNS ONLY (public-facing)
router.get("/published", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.campaign_id, c.campaign_name, c.campaign_type,
        c.campaign_description, c.goal_amount, c.current_amount,
        c.start_date, c.end_date, c.file_url, c.media_type,
        c.is_featured, c.status, c.created_at, c.updated_at,
        f.foundation_id, f.foundation_name,
        f.image_logo as foundation_logo,
        (
          SELECT json_agg(json_build_object('media_id', cm.media_id, 'file_url', cm.file_url))
          FROM campaign_media cm
          WHERE cm.campaign_id = c.campaign_id
        ) as media
       FROM campaigns c
       LEFT JOIN foundation_campaigns fc ON c.campaign_id = fc.campaign_id
       LEFT JOIN foundations f ON fc.foundation_id = f.foundation_id
       WHERE c.status = 'publish'
       ORDER BY c.is_featured DESC, c.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET PUBLISHED CAMPAIGNS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  const campaignId = req.params.id;

  try {
    const campaignResult = await pool.query(
      `SELECT 
        c.*,
        f.foundation_id, f.foundation_name,
        f.image_logo as foundation_logo,
        f.about_foundation as foundation_desc,
        (
          SELECT json_agg(json_build_object('media_id', cm.media_id, 'file_url', cm.file_url))
          FROM campaign_media cm
          WHERE cm.campaign_id = c.campaign_id
        ) as media,
        (
          SELECT COUNT(DISTINCT d.donor_id)::int
          FROM donations d
          JOIN payment_transactions pt ON d.donation_id = pt.donation_id
          WHERE d.campaign_id = c.campaign_id AND pt.payment_status IN ('completed', 'pending')
        ) as donor_count
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

// UPDATE CAMPAIGN STATUS (publish / unpublish)
router.patch("/status/:id", async (req, res) => {
  const campaignId = req.params.id;
  const { status } = req.body;

  if (!['draft', 'publish'].includes(status)) {
    return res.status(400).json({ message: "Status must be 'draft' or 'publish'" });
  }

  try {
    const result = await pool.query(
      `UPDATE campaigns SET status = $1, updated_at = NOW() WHERE campaign_id = $2 RETURNING campaign_id, status`,
      [status, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const action = status === 'publish' ? 'published' : 'moved to draft';

    // Log status update
    if (req.app.locals.logAudit) {
      await req.app.locals.logAudit({
        userId: req.body.userId || null,
        action: `Campaign: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        details: `Campaign ID ${campaignId} status changed to ${status}`
      });
    }

    return res.json({ message: `Campaign ${action} successfully!`, campaign: result.rows[0] });

  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
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
    const checkResult = await pool.query(
      "SELECT file_url FROM campaigns WHERE campaign_id = $1",
      [campaignId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    let file_url = checkResult.rows[0].file_url;
    let media_type = checkResult.rows[0].media_type;

    if (req.files && req.files.length > 0) {
      // For simplicity, overwrite the main image and clear old ones if new ones uploaded
      if (file_url) {
        const relativePath = file_url.startsWith('/') ? file_url.substring(1) : file_url;
        const fullPath = path.join(__dirname, relativePath);
        if (fs.existsSync(fullPath)) {
          try { fs.unlinkSync(fullPath); } catch (e) { console.error("Failed to delete old image", e); }
        }
      }

      const oldMedia = await pool.query("SELECT file_url FROM campaign_media WHERE campaign_id = $1", [campaignId]);
      oldMedia.rows.forEach(m => {
        const relPath = m.file_url.startsWith('/') ? m.file_url.substring(1) : m.file_url;
        const fPath = path.join(__dirname, relPath);
        if (fs.existsSync(fPath)) {
          try { fs.unlinkSync(fPath); } catch (e) { }
        }
      });
      await pool.query("DELETE FROM campaign_media WHERE campaign_id = $1", [campaignId]);

      file_url = `/uploads/campaigns/${req.files[0].filename}`;
      media_type = "image";
    }

    await pool.query(
      `UPDATE campaigns 
       SET campaign_name = $1, campaign_type = $2, campaign_description = $3,
           goal_amount = $4, start_date = $5, end_date = $6,
           file_url = $7, media_type = $8, is_featured = $9,
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

    if (req.files && req.files.length > 1) {
      for (let i = 1; i < req.files.length; i++) {
        const url = `/uploads/campaigns/${req.files[i].filename}`;
        await pool.query(
          `INSERT INTO campaign_media (campaign_id, file_url, media_type) VALUES ($1, $2, $3)`,
          [campaignId, url, 'image']
        );
      }
    }

    if (foundation_id) {
      await pool.query("DELETE FROM foundation_campaigns WHERE campaign_id = $1", [campaignId]);
      await pool.query(
        `INSERT INTO foundation_campaigns (foundation_id, campaign_id) VALUES ($1, $2)`,
        [foundation_id, campaignId]
      );
    }

    // Log update
    if (req.app.locals.logAudit) {
      await req.app.locals.logAudit({
        userId: req.body.userId || null,
        action: "Campaign: Updated",
        details: `Updated campaign ID ${campaignId}: ${campaign_name}`
      });
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
    const checkResult = await pool.query(
      "SELECT file_url FROM campaigns WHERE campaign_id = $1",
      [campaignId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const fileUrl = checkResult.rows[0].file_url;
    if (fileUrl) {
      const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
      const fullPath = path.join(__dirname, relativePath);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) { console.error("Failed to delete file", e); }
      }
    }

    await pool.query("DELETE FROM campaigns WHERE campaign_id = $1", [campaignId]);

    // Log deletion
    if (req.app.locals.logAudit) {
      await req.app.locals.logAudit({
        userId: req.body.userId || null,
        action: "Campaign: Deleted",
        details: `Deleted campaign ID ${campaignId}`
      });
    }

    return res.json({ message: "Campaign deleted successfully!" });

  } catch (err) {
    console.error("DELETE CAMPAIGN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
