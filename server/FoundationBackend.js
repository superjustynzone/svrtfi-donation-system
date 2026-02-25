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

// GET ALL FOUNDATIONS
router.get("/all", async (req, res) => {
    try {
        const query = `
            SELECT 
                foundation_id, foundation_name, foundation_address, 
                foundation_contact, foundation_email,
                bank_name, bank_information,
                image_logo, image_cover, focus_areas, about_foundation, 
                mission, vision, created_at, updated_at
            FROM foundations
            ORDER BY foundation_name
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("GET ALL FOUNDATIONS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET SINGLE FOUNDATION
router.get("/:id", async (req, res) => {
    try {
        const query = `
            SELECT * FROM foundations WHERE foundation_id = $1
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
    try {
        const {
            foundation_name, foundation_address, foundation_contact, foundation_email,
            bank_name, bank_information,
            focus_areas, about_foundation, mission, vision
        } = req.body;

        // Note: Files are in req.files['logo'][0] and req.files['cover'][0]
        const image_logo = req.files['logo'] ? `/uploads/foundations/${req.files['logo'][0].filename}` : null;
        const image_cover = req.files['cover'] ? `/uploads/foundations/${req.files['cover'][0].filename}` : null;

        const result = await pool.query(
            `INSERT INTO foundations (
                foundation_name, foundation_address, foundation_contact, foundation_email,
                bank_name, bank_information,
                image_logo, image_cover, focus_areas, about_foundation, mission, vision
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
            RETURNING foundation_id`,
            [
                foundation_name, foundation_address, foundation_contact, foundation_email,
                bank_name, bank_information,
                image_logo, image_cover, focus_areas, about_foundation, mission, vision
            ]
        );

        const foundationId = result.rows[0].foundation_id;
        res.json({ message: "Foundation created successfully!", foundationId });

    } catch (err) {
        console.error("CREATE FOUNDATION ERROR DETAILS:", err);

        // Clean up uploaded files on error
        if (req.files) {
            Object.values(req.files).flat().forEach(file => {
                const filePath = path.join(__dirname, "uploads", "foundations", file.filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
        }

        res.status(500).json({ message: "Server error during creation: " + err.message });
    }
});

// UPDATE FOUNDATION
router.put("/update/:id", handleUpload, async (req, res) => {
    const { id } = req.params;

    try {
        const {
            foundation_name, foundation_address, foundation_contact, foundation_email,
            bank_name, bank_information,
            focus_areas, about_foundation, mission, vision
        } = req.body;

        // Get existing images to handle replacement/cleanup
        const existingRes = await pool.query(
            "SELECT image_logo, image_cover FROM foundations WHERE foundation_id = $1",
            [id]
        );

        if (existingRes.rows.length === 0) {
            return res.status(404).json({ message: "Foundation not found" });
        }

        // Initialize with existing paths
        let image_logo = existingRes.rows[0].image_logo || null;
        let image_cover = existingRes.rows[0].image_cover || null;

        // Handle new logo upload
        if (req.files['logo']) {
            if (image_logo) {
                const relativePath = image_logo.startsWith('/') ? image_logo.substring(1) : image_logo;
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

        // Update the single foundations table
        await pool.query(
            `UPDATE foundations SET
                foundation_name = $1, foundation_address = $2, 
                foundation_contact = $3, foundation_email = $4,
                bank_name = $5, bank_information = $6,
                image_logo = $7, image_cover = $8, focus_areas = $9, 
                about_foundation = $10, mission = $11, vision = $12, 
                updated_at = NOW()
            WHERE foundation_id = $13`,
            [
                foundation_name, foundation_address, foundation_contact, foundation_email,
                bank_name, bank_information,
                image_logo, image_cover, focus_areas, about_foundation,
                mission, vision, id
            ]
        );

        res.json({ message: "Foundation updated successfully!" });

    } catch (err) {
        console.error("UPDATE FOUNDATION ERROR DETAILS:", err);
        res.status(500).json({ message: "Server error during update: " + err.message });
    }
});

// DELETE FOUNDATION
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // Get images to delete
        const foundationRes = await pool.query(
            "SELECT image_logo, image_cover FROM foundations WHERE foundation_id = $1",
            [id]
        );

        if (foundationRes.rows.length > 0) {
            const { image_logo, image_cover } = foundationRes.rows[0];

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

        // Delete from foundations
        const deleteRes = await pool.query("DELETE FROM foundations WHERE foundation_id = $1", [id]);

        if (deleteRes.rowCount === 0) {
            return res.status(404).json({ message: "Foundation not found" });
        }

        res.json({ message: "Foundation deleted successfully!" });

    } catch (err) {
        console.error("DELETE FOUNDATION ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
