const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Multer configuration for foundation images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "uploads", "foundations");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const prefix = file.fieldname === "logo" ? "logo-" : "cover-";
        cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error("Only images are allowed!"));
    },
});

// Fields configuration for multer
const uploadFields = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]);

// Helper to handle multer errors
const handleUpload = (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: "Multer error: " + err.message });
        } else if (err) {
            return res.status(500).json({ message: "Upload error: " + err.message });
        }
        next();
    });
};

// GET ALL FOUNDATIONS WITH DETAILS
router.get("/all", async (req, res) => {
    try {
        const query = `
            SELECT 
                f.foundation_id, f.foundation_name, f.foundation_address, 
                f.foundation_contact, f.foundation_email, f.created_at,
                d.details_id, d.image_logo, d.image_cover, d.beneficiaries, 
                d.established, d.focus_areas, d.about_foundation, 
                d.mission, d.vision
            FROM foundations f
            LEFT JOIN foundation_details d ON f.foundation_id = d.foundation_id
            ORDER BY f.foundation_name
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("GET ALL FOUNDATIONS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET SINGLE FOUNDATION WITH DETAILS
router.get("/:id", async (req, res) => {
    try {
        const query = `
            SELECT 
                f.*, 
                d.details_id, d.image_logo, d.image_cover, d.beneficiaries, 
                d.established, d.focus_areas, d.about_foundation, 
                d.mission, d.vision
            FROM foundations f
            LEFT JOIN foundation_details d ON f.foundation_id = d.foundation_id
            WHERE f.foundation_id = $1
        `;
        const result = await pool.query(query, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Foundation not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("GET SINGLE FOUNDATION ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// CREATE FOUNDATION
router.post("/create", handleUpload, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const {
            foundation_name, foundation_address, foundation_contact, foundation_email,
            beneficiaries, established, focus_areas, about_foundation, mission, vision
        } = req.body;

        // Note: Files are in req.files['logo'][0] and req.files['cover'][0]
        const image_logo = req.files['logo'] ? `/uploads/foundations/${req.files['logo'][0].filename}` : null;
        const image_cover = req.files['cover'] ? `/uploads/foundations/${req.files['cover'][0].filename}` : null;

        // 1. Insert into foundations table
        const foundationResult = await client.query(
            `INSERT INTO foundations (
                foundation_name, foundation_address, foundation_contact, foundation_email
            ) VALUES ($1, $2, $3, $4) RETURNING foundation_id`,
            [foundation_name, foundation_address, foundation_contact, foundation_email]
        );

        const foundationId = foundationResult.rows[0].foundation_id;

        // 2. Insert into foundation_details table
        await client.query(
            `INSERT INTO foundation_details (
                foundation_id, image_logo, image_cover, beneficiaries, 
                established, focus_areas, about_foundation, mission, vision
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                foundationId, image_logo, image_cover, beneficiaries,
                established, focus_areas, about_foundation, mission, vision
            ]
        );

        await client.query('COMMIT');

        res.json({ message: "Foundation created successfully!", foundationId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("CREATE FOUNDATION ERROR DETAILS:", err);

        // Clean up uploaded files on error
        if (req.files) {
            Object.values(req.files).flat().forEach(file => {
                const filePath = path.join(__dirname, "uploads", "foundations", file.filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
        }

        res.status(500).json({ message: "Server error during creation: " + err.message });
    } finally {
        client.release();
    }
});

// UPDATE FOUNDATION
router.put("/update/:id", handleUpload, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const {
            foundation_name, foundation_address, foundation_contact, foundation_email,
            beneficiaries, established, focus_areas, about_foundation, mission, vision
        } = req.body;

        // Get existing images to handle replacement/cleanup
        const existingRes = await client.query(
            "SELECT image_logo, image_cover FROM foundation_details WHERE foundation_id = $1",
            [id]
        );

        // Initialize with existing paths or null (if not found, though should exist)
        let image_logo = existingRes.rows[0]?.image_logo || null;
        let image_cover = existingRes.rows[0]?.image_cover || null;

        // Handle new logo upload
        if (req.files['logo']) {
            if (image_logo) {
                const oldLogoPath = path.join(__dirname, image_logo.replace(/^\/uploads\/foundations\//, 'uploads/foundations/')); // normalize path
                // The saved path usually starts with /uploads... so we need to be careful matching it to filesystem
                // Fix: Construct absolute path correctly based on how it's saved.
                // Saved as: /uploads/foundations/filename.ext
                // __dirname is .../server
                // So we want .../server/uploads/foundations/filename.ext
                // path.join(__dirname, "../uploads/foundations/...") ?? No, code used path.join(__dirname, "uploads", "foundations")

                // Let's use the exact logic from previous code but adapted
                const relativePath = image_logo.startsWith('/') ? image_logo.substring(1) : image_logo;
                // relativePath is now uploads/foundations/filename
                const fullPath = path.join(__dirname, relativePath);
                if (fs.existsSync(fullPath)) {
                    try { fs.unlinkSync(fullPath); } catch (e) { console.error("Failed to delete old logo", e); }
                }
            }
            image_logo = `/uploads/foundations/${req.files['logo'][0].filename}`;
        }

        // Handle new cover upload
        if (req.files['cover']) {
            if (image_cover) {
                const relativePath = image_cover.startsWith('/') ? image_cover.substring(1) : image_cover;
                const fullPath = path.join(__dirname, relativePath);
                if (fs.existsSync(fullPath)) {
                    try { fs.unlinkSync(fullPath); } catch (e) { console.error("Failed to delete old cover", e); }
                }
            }
            image_cover = `/uploads/foundations/${req.files['cover'][0].filename}`;
        }

        // 1. Update foundations table
        await client.query(
            `UPDATE foundations SET
                foundation_name = $1, foundation_address = $2, 
                foundation_contact = $3, foundation_email = $4, updated_at = NOW()
            WHERE foundation_id = $5`,
            [foundation_name, foundation_address, foundation_contact, foundation_email, id]
        );

        // 2. Update foundation_details table
        // Upsert logic (INSERT ON CONFLICT) or simple UPDATE if we assume 1:1 always exists
        // Since we created them together, UPDATE should be fine. If it doesn't exist (legacy data?), we might need INSERT.
        // Let's check existence first to be safe or use INSERT ... ON CONFLICT

        const detailsCheck = await client.query("SELECT details_id FROM foundation_details WHERE foundation_id = $1", [id]);

        if (detailsCheck.rows.length > 0) {
            await client.query(
                `UPDATE foundation_details SET
                    image_logo = $1, image_cover = $2, beneficiaries = $3, 
                    established = $4, focus_areas = $5, about_foundation = $6, 
                    mission = $7, vision = $8, updated_at = NOW()
                WHERE foundation_id = $9`,
                [
                    image_logo, image_cover, beneficiaries,
                    established, focus_areas, about_foundation,
                    mission, vision, id
                ]
            );
        } else {
            // Create details if missing for some reason
            await client.query(
                `INSERT INTO foundation_details (
                    foundation_id, image_logo, image_cover, beneficiaries, 
                    established, focus_areas, about_foundation, mission, vision
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    id, image_logo, image_cover, beneficiaries,
                    established, focus_areas, about_foundation, mission, vision
                ]
            );
        }

        await client.query('COMMIT');
        res.json({ message: "Foundation updated successfully!" });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("UPDATE FOUNDATION ERROR DETAILS:", err);
        res.status(500).json({ message: "Server error during update: " + err.message });
    } finally {
        client.release();
    }
});

// DELETE FOUNDATION
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get images to delete
        const detailsRes = await client.query(
            "SELECT image_logo, image_cover FROM foundation_details WHERE foundation_id = $1",
            [id]
        );

        if (detailsRes.rows.length > 0) {
            const { image_logo, image_cover } = detailsRes.rows[0];

            [image_logo, image_cover].forEach(imgPath => {
                if (imgPath) {
                    const relativePath = imgPath.startsWith('/') ? imgPath.substring(1) : imgPath;
                    const fullPath = path.join(__dirname, relativePath);
                    if (fs.existsSync(fullPath)) {
                        try { fs.unlinkSync(fullPath); } catch (e) { console.error("Failed to delete file", e); }
                    }
                }
            });
        }

        // Delete from foundations (CASCADE will handle details)
        const deleteRes = await client.query("DELETE FROM foundations WHERE foundation_id = $1", [id]);

        if (deleteRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Foundation not found" });
        }

        await client.query('COMMIT');
        res.json({ message: "Foundation deleted successfully!" });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("DELETE FOUNDATION ERROR:", err);
        res.status(500).json({ message: "Server error" });
    } finally {
        client.release();
    }
});

module.exports = router;
