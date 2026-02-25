const express = require("express");
const router = express.Router();
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// GET /api/audit - Get all audit logs with filtering and pagination
router.get("/", async (req, res) => {
    const pool = req.app.locals.pool;
    const { module, search, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = `
            SELECT 
                al.audit_id, 
                al.user_id, 
                al.action, 
                al.details, 
                al.timestamp,
                u.first_name, 
                u.last_name,
                r.role_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.user_id
            LEFT JOIN user_roles ur ON u.user_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.role_id
            WHERE 1=1
        `;
        const params = [];

        // Note: 'module' is no longer a separate field in the new schema, 
        // but we can still search for it in 'action' or 'details' if it's there.
        // For now, let's keep search but module will be partial search in action/details.
        if (module && module !== 'All') {
            params.push(`%${module}%`);
            query += ` AND (al.action ILIKE $${params.length} OR al.details ILIKE $${params.length})`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR al.action ILIKE $${params.length} OR al.details ILIKE $${params.length})`;
        }

        if (startDate) {
            params.push(startDate);
            query += ` AND al.timestamp >= $${params.length}`;
        }

        if (endDate) {
            params.push(endDate);
            query += ` AND al.timestamp <= $${params.length}`;
        }

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) FROM audit_logs al LEFT JOIN users u ON al.user_id = u.user_id WHERE 1=1` +
            query.split('WHERE 1=1')[1].split('ORDER BY')[0];
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Add sorting and pagination
        query += " ORDER BY al.timestamp DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json({
            success: true,
            logs: result.rows,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        });

    } catch (err) {
        console.error("Audit log fetch error:", err.message);
        res.status(500).json({ message: "Failed to fetch audit logs" });
    }
});

module.exports = router;
