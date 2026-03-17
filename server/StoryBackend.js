// StoryBackend.js
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
    const uploadPath = path.join(__dirname, "uploads", "stories");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "story-" + uniqueSuffix + path.extname(file.originalname));
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

// CREATE STORY
router.post("/create", upload.single("image"), async (req, res) => {
  const {
    foundation_id,
    title,
    content,
    tags,
    author,
    is_published
  } = req.body;

  try {
    if (!title || !foundation_id) {
      return res.status(400).json({ message: "Story title and foundation are required." });
    }

    let image_file = null;
    if (req.file) {
      image_file = `/uploads/stories/${req.file.filename}`;
    }

    const publishedDate = (is_published === 'true' || is_published === true) ? new Date() : null;

    const result = await pool.query(
      `INSERT INTO stories (
        foundation_id, title, content, image_file, tags, author, is_published, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING story_id`,
      [
        foundation_id, title, content, image_file, tags, author,
        is_published === 'true' || is_published === true, publishedDate
      ]
    );

    const storyId = result.rows[0].story_id;

    if (req.app.locals.logAudit) {
      await req.app.locals.logAudit({
        userId: req.body.userId || null,
        action: "Story: Created",
        details: `Created story: ${title}`
      });
    }

    return res.json({
      message: "Story created successfully!",
      story_id: storyId
    });

  } catch (err) {
    console.error("CREATE STORY ERROR:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// GET ALL STORIES (admin)
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        s.*,
        f.foundation_name,
        f.image_logo as foundation_logo
       FROM stories s
       LEFT JOIN foundations f ON s.foundation_id = f.foundation_id
       ORDER BY s.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET ALL STORIES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET PUBLISHED STORIES (public)
router.get("/published", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        s.*,
        f.foundation_name,
        f.image_logo as foundation_logo
       FROM stories s
       LEFT JOIN foundations f ON s.foundation_id = f.foundation_id
       WHERE s.is_published = true
       ORDER BY s.published_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET PUBLISHED STORIES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET STORIES BY FOUNDATION ID
router.get("/foundation/:id", async (req, res) => {
  const foundationId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT 
        s.*,
        f.foundation_name,
        f.image_logo as foundation_logo
       FROM stories s
       LEFT JOIN foundations f ON s.foundation_id = f.foundation_id
       WHERE s.foundation_id = $1
       ORDER BY s.created_at DESC`,
       [foundationId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET STORIES BY FOUNDATION ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET SINGLE STORY
router.get("/:id", async (req, res) => {
  const storyId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT 
        s.*,
        f.foundation_name,
        f.image_logo as foundation_logo
       FROM stories s
       LEFT JOIN foundations f ON s.foundation_id = f.foundation_id
       WHERE s.story_id = $1`,
      [storyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Story not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET STORY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE STORY STATUS
router.patch("/status/:id", async (req, res) => {
  const storyId = req.params.id;
  const { is_published } = req.body;

  try {
    const publishedFlag = is_published === true || is_published === 'true';
    const publishedDate = publishedFlag ? new Date() : null;

    const result = await pool.query(
      `UPDATE stories SET is_published = $1, published_at = $2, updated_at = NOW() WHERE story_id = $3 RETURNING story_id`,
      [publishedFlag, publishedDate, storyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (req.app.locals.logAudit) {
      await req.app.locals.logAudit({
        userId: req.body.userId || null,
        action: "Story: Status Updated",
        details: `Story ID ${storyId} status changed to ${publishedFlag ? 'published' : 'draft'}`
      });
    }

    return res.json({ message: `Story status updated successfully!` });

  } catch (err) {
    console.error("UPDATE STORY STATUS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE STORY
router.put("/update/:id", upload.single("image"), async (req, res) => {
  const storyId = req.params.id;
  const {
    foundation_id,
    title,
    content,
    tags,
    author,
    is_published
  } = req.body;

  try {
    const checkResult = await pool.query(
      "SELECT image_file FROM stories WHERE story_id = $1",
      [storyId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Story not found" });
    }

    let image_file = checkResult.rows[0].image_file;

    if (req.file) {
      if (image_file) {
        const relativePath = image_file.startsWith('/') ? image_file.substring(1) : image_file;
        const fullPath = path.join(__dirname, relativePath);
        if (fs.existsSync(fullPath)) {
          try { fs.unlinkSync(fullPath); } catch (e) { console.error("Failed to delete old image", e); }
        }
      }
      image_file = `/uploads/stories/${req.file.filename}`;
    }

    const publishedDate = (is_published === 'true' || is_published === true) ? new Date() : null;

    await pool.query(
      `UPDATE stories 
       SET foundation_id = $1, title = $2, content = $3,
           image_file = $4, tags = $5, author = $6, is_published = $7, published_at = $8,
           updated_at = NOW()
       WHERE story_id = $9`,
      [
        foundation_id, title, content, image_file, tags, author,
        is_published === 'true' || is_published === true, publishedDate,
        storyId
      ]
    );

    if (req.app.locals.logAudit) {
      await req.app.locals.logAudit({
        userId: req.body.userId || null,
        action: "Story: Updated",
        details: `Updated story ID ${storyId}: ${title}`
      });
    }

    return res.json({ message: "Story updated successfully!" });

  } catch (err) {
    console.error("UPDATE STORY ERROR:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// DELETE STORY
router.delete("/delete/:id", async (req, res) => {
  const storyId = req.params.id;

  try {
    const checkResult = await pool.query(
      "SELECT image_file FROM stories WHERE story_id = $1",
      [storyId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Story not found" });
    }

    const fileUrl = checkResult.rows[0].image_file;
    if (fileUrl) {
      const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
      const fullPath = path.join(__dirname, relativePath);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) { console.error("Failed to delete file", e); }
      }
    }

    await pool.query("DELETE FROM stories WHERE story_id = $1", [storyId]);

    if (req.app.locals.logAudit) {
      await req.app.locals.logAudit({
        userId: req.body.userId || null,
        action: "Story: Deleted",
        details: `Deleted story ID ${storyId}`
      });
    }

    return res.json({ message: "Story deleted successfully!" });

  } catch (err) {
    console.error("DELETE STORY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
