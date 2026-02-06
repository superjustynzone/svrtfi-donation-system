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

// Multer configuration for foundation logos
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
        cb(null, "foundation-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
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

// GET ALL FOUNDATIONS
router.get("/all", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM foundations ORDER BY foundation_name`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("GET ALL FOUNDATIONS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET SINGLE FOUNDATION
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM foundations WHERE foundation_id = $1",
            [req.params.id]
        );
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
router.post("/create", (req, res, next) => {
    upload.single("logo")(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: "Multer error: " + err.message });
        } else if (err) {
            return res.status(500).json({ message: "Upload error: " + err.message });
        }
        next();
    });
}, async (req, res) => {
    const {
        foundation_name,
        foundation_desc,
        foundation_address,
        foundation_contact,
        foundation_email,
        accepts_donations,
        bank_name,
        bank_account_name,
        bank_account_number
    } = req.body;

    const foundation_logo = req.file ? `/uploads/foundations/${req.file.filename}` : null;
    console.log("CREATE FOUNDATION - Incoming Body:", req.body);
    console.log("CREATE FOUNDATION - File:", req.file ? req.file.filename : "No logo");

    try {
        const result = await pool.query(
            `INSERT INTO foundations (
                foundation_name, foundation_logo, foundation_desc,
                foundation_address, foundation_contact, foundation_email,
                accepts_donations, bank_name, bank_account_name, bank_account_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                foundation_name, foundation_logo, foundation_desc,
                foundation_address, foundation_contact, foundation_email,
                accepts_donations === 'true', bank_name, bank_account_name, bank_account_number
            ]
        );
        res.json({ message: "Foundation created successfully!", foundation: result.rows[0] });
    } catch (err) {
        console.error("CREATE FOUNDATION ERROR DETAILS:", {
            message: err.message,
            code: err.code,
            detail: err.detail,
            stack: err.stack
        });
        res.status(500).json({ message: "Server error during creation: " + err.message });
    }
});

// UPDATE FOUNDATION
router.put("/update/:id", (req, res, next) => {
    upload.single("logo")(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: "Multer error: " + err.message });
        } else if (err) {
            return res.status(500).json({ message: "Upload error: " + err.message });
        }
        next();
    });
}, async (req, res) => {
    const { id } = req.params;
    const {
        foundation_name,
        foundation_desc,
        foundation_address,
        foundation_contact,
        foundation_email,
        accepts_donations,
        bank_name,
        bank_account_name,
        bank_account_number
    } = req.body;

    try {
        // Get existing foundation to handle logo replacement
        const existing = await pool.query("SELECT foundation_logo FROM foundations WHERE foundation_id = $1", [id]);
        if (existing.rows.length === 0) return res.status(404).json({ message: "Foundation not found" });

        let foundation_logo = existing.rows[0].foundation_logo;
        if (req.file) {
            // Delete old logo if it exists
            if (foundation_logo) {
                // Remove leading slash for path.join if present
                const relativeLogoPath = foundation_logo.startsWith('/') ? foundation_logo.substring(1) : foundation_logo;
                const oldPath = path.join(__dirname, relativeLogoPath);
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.unlinkSync(oldPath);
                    } catch (unlinkErr) {
                        console.error("Failed to delete old logo:", unlinkErr.message);
                    }
                }
            }
            foundation_logo = `/uploads/foundations/${req.file.filename}`;
        }

        const result = await pool.query(
            `UPDATE foundations SET
                foundation_name = $1, foundation_logo = $2, foundation_desc = $3,
                foundation_address = $4, foundation_contact = $5, foundation_email = $6,
                accepts_donations = $7, bank_name = $8, bank_account_name = $9,
                bank_account_number = $10, updated_at = NOW()
            WHERE foundation_id = $11 RETURNING *`,
            [
                foundation_name, foundation_logo, foundation_desc,
                foundation_address, foundation_contact, foundation_email,
                accepts_donations === 'true', bank_name, bank_account_name,
                bank_account_number, id
            ]
        );
        res.json({ message: "Foundation updated successfully!", foundation: result.rows[0] });
    } catch (err) {
        console.error("UPDATE FOUNDATION ERROR DETAILS:", {
            message: err.message,
            code: err.code,
            detail: err.detail,
            stack: err.stack,
            id: id
        });
        res.status(500).json({ message: "Server error during update: " + err.message });
    }
});

// DELETE FOUNDATION
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const existing = await pool.query("SELECT foundation_logo FROM foundations WHERE foundation_id = $1", [id]);
        if (existing.rows.length === 0) return res.status(404).json({ message: "Foundation not found" });

        const logo = existing.rows[0].foundation_logo;
        if (logo) {
            const logoPath = path.join(__dirname, logo);
            if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
        }

        await pool.query("DELETE FROM foundations WHERE foundation_id = $1", [id]);
        res.json({ message: "Foundation deleted successfully!" });
    } catch (err) {
        console.error("DELETE FOUNDATION ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
