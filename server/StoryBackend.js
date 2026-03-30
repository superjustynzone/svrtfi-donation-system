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
router.post("/create", upload.array("images", 10), async (req, res) => {
  const {
    foundation_id,
    title,
    content,
    tags,
    author,
    is_published,
    scheduled_publish_at
  } = req.body;
  
  const isNow = is_published === 'true' || is_published === true;

  try {
    if (!title || !foundation_id) {
      return res.status(400).json({ message: "Story title and foundation are required." });
    }

    const publishedDate = isNow ? new Date() : null;

    const result = await pool.query(
      `INSERT INTO stories (
        foundation_id, title, content, tags, author, is_published, published_at, scheduled_publish_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING story_id`,
      [
        foundation_id, title, content, tags, author,
        isNow, publishedDate, scheduled_publish_at || null
      ]
    );

    const storyId = result.rows[0].story_id;

    // Handle multiple images
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const imagePath = `/uploads/stories/${req.files[i].filename}`;
        await pool.query(
          `INSERT INTO story_images (story_id, image_file, order_index) VALUES ($1, $2, $3)`,
          [storyId, imagePath, i]
        );
      }
    }

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
        f.image_logo as foundation_logo,
        COALESCE(
          (SELECT json_agg(json_build_object('image_id', si.image_id, 'image_file', si.image_file, 'order_index', si.order_index) ORDER BY si.order_index)
           FROM story_images si WHERE si.story_id = s.story_id),
          '[]'
        ) as images
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
        f.image_logo as foundation_logo,
        COALESCE(
          (SELECT json_agg(json_build_object('image_id', si.image_id, 'image_file', si.image_file, 'order_index', si.order_index) ORDER BY si.order_index)
           FROM story_images si WHERE si.story_id = s.story_id),
          '[]'
        ) as images
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
        f.image_logo as foundation_logo,
        COALESCE(
          (SELECT json_agg(json_build_object('image_id', si.image_id, 'image_file', si.image_file, 'order_index', si.order_index) ORDER BY si.order_index)
           FROM story_images si WHERE si.story_id = s.story_id),
          '[]'
        ) as images
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
        f.image_logo as foundation_logo,
        COALESCE(
          (SELECT json_agg(json_build_object('image_id', si.image_id, 'image_file', si.image_file, 'order_index', si.order_index) ORDER BY si.order_index)
           FROM story_images si WHERE si.story_id = s.story_id),
          '[]'
        ) as images
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
      `UPDATE stories 
       SET is_published = $1, 
           published_at = $2, 
           scheduled_publish_at = NULL, 
           updated_at = NOW() 
       WHERE story_id = $3 
       RETURNING story_id`,
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
router.put("/update/:id", upload.array("images", 10), async (req, res) => {
  const storyId = req.params.id;
  const {
    foundation_id,
    title,
    content,
    tags,
    author,
    is_published,
    scheduled_publish_at,
    keepExistingImages // Array of image_ids to keep
  } = req.body;

  const isNow = is_published === 'true' || is_published === true;

  try {
    const publishedDate = isNow ? new Date() : null;

    await pool.query(
      `UPDATE stories 
       SET foundation_id = $1, title = $2, content = $3,
           tags = $4, author = $5, is_published = $6, published_at = $7,
           scheduled_publish_at = $8,
           updated_at = NOW()
       WHERE story_id = $9`,
      [
        foundation_id, title, content, tags, author,
        isNow, publishedDate, scheduled_publish_at || null,
        storyId
      ]
    );

    // Handle image updates
    let imagesToKeep = [];
    if (keepExistingImages) {
        imagesToKeep = Array.isArray(keepExistingImages) ? keepExistingImages : [keepExistingImages];
    }

    // Delete images not in keep list
    const imagesToDelete = await pool.query(
        `SELECT image_file FROM story_images WHERE story_id = $1 AND image_id != ALL($2::bigint[])`,
        [storyId, imagesToKeep]
    );

    for (const img of imagesToDelete.rows) {
        const relativePath = img.image_file.startsWith('/') ? img.image_file.substring(1) : img.image_file;
        const fullPath = path.join(__dirname, relativePath);
        if (fs.existsSync(fullPath)) {
            try { fs.unlinkSync(fullPath); } catch (e) { console.error("Failed to delete removed image", e); }
        }
    }

    await pool.query(
        `DELETE FROM story_images WHERE story_id = $1 AND image_id != ALL($2::bigint[])`,
        [storyId, imagesToKeep]
    );

    // Add new images
    if (req.files && req.files.length > 0) {
        const lastOrderResult = await pool.query(`SELECT MAX(order_index) FROM story_images WHERE story_id = $1`, [storyId]);
        let nextOrder = (lastOrderResult.rows[0].max || 0) + 1;
        
        for (const file of req.files) {
            const imagePath = `/uploads/stories/${file.filename}`;
            await pool.query(
                `INSERT INTO story_images (story_id, image_file, order_index) VALUES ($1, $2, $3)`,
                [storyId, imagePath, nextOrder++]
            );
        }
    }

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
    const imagesResult = await pool.query(
      "SELECT image_file FROM story_images WHERE story_id = $1",
      [storyId]
    );

    if (imagesResult.rows.length > 0) {
      for (const img of imagesResult.rows) {
        const relativePath = img.image_file.startsWith('/') ? img.image_file.substring(1) : img.image_file;
        const fullPath = path.join(__dirname, relativePath);
        if (fs.existsSync(fullPath)) {
          try { fs.unlinkSync(fullPath); } catch (e) { console.error("Failed to delete file", e); }
        }
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

// BACKGROUND JOB: Process scheduled stories
// Automatically publish stories whose scheduled_publish_at time has passed
const processScheduledStories = async () => {
  try {
    const now = new Date();
    // Find stories that are NOT published but have a scheduled time in the past
    const result = await pool.query(
      `UPDATE stories 
       SET is_published = true, 
           published_at = scheduled_publish_at,
           scheduled_publish_at = NULL,
           updated_at = NOW()
       WHERE is_published = false 
       AND scheduled_publish_at IS NOT NULL 
       AND scheduled_publish_at <= $1
       RETURNING story_id, title`,
      [now]
    );

    if (result.rowCount > 0) {
      console.log(`[Scheduler] Automatically published ${result.rowCount} stories:`);
      result.rows.forEach(story => {
        console.log(`- ${story.title} (ID: ${story.story_id})`);
      });
    }
  } catch (err) {
    console.error("[Scheduler] Error processing scheduled stories:", err);
  }
};

// Check every minute
setInterval(processScheduledStories, 60 * 1000);
// Run once on startup
processScheduledStories();

module.exports = router;
