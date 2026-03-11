// UserManagementBackend.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Middleware to verify admin token
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user has an admin-level role
        const adminRoles = ["admin", "super_admin", "finance", "encoder", "auditor"];
        if (!adminRoles.includes(decoded.role)) {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// GET /api/admin/users - Fetch all users with their roles
router.get("/users", verifyAdmin, async (req, res) => {
    try {
        // Fetch all users with their roles
        const usersQuery = await pool.query(`
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.contact_number,
        u.address,
        u.is_active,
        u.created_at,
        a.email,
        r.role_name as role,
        r.role_id
      FROM users u
      LEFT JOIN auth_users a ON u.user_id = a.user_id
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      ORDER BY u.created_at DESC
    `);

        // Calculate stats
        const totalUsers = usersQuery.rows.length;
        const activeUsers = usersQuery.rows.filter(u => u.is_active).length;
        const adminUsers = usersQuery.rows.filter(u => u.role === 'admin').length;
        const recentLogins = 0; // Placeholder - would need login tracking

        res.json({
            users: usersQuery.rows,
            stats: {
                totalUsers,
                activeUsers,
                adminUsers,
                recentLogins
            }
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// POST /api/admin/users - Create new user
router.post("/users", verifyAdmin, async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        password,
        phone,
        role,
        address, // Renamed from department
        employeeId
    } = req.body;

    try {
        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                message: "First name, last name, email, and password are required"
            });
        }

        // Check if email already exists
        const emailCheck = await pool.query(
            "SELECT * FROM auth_users WHERE email = $1",
            [email]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Get role_id from role name
        const roleQuery = await pool.query(
            "SELECT role_id FROM roles WHERE role_name = $1",
            [role || 'viewer']
        );

        if (roleQuery.rows.length === 0) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        const roleId = roleQuery.rows[0].role_id;

        // Create user entry
        const userResult = await pool.query(
            `INSERT INTO users (first_name, last_name, contact_number, address)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id`,
            [firstName, lastName, phone || null, address || null]
        );

        const userId = userResult.rows[0].user_id;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create auth_users record
        await pool.query(
            `INSERT INTO auth_users(user_id, email, hash_password)
       VALUES($1, $2, $3)`,
            [userId, email, hashedPassword]
        );

        // Assign role
        await pool.query(
            `INSERT INTO user_roles(user_id, role_id)
       VALUES($1, $2)`,
            [userId, roleId]
        );

        // Log user creation
        await req.app.locals.logAudit({
            userId: req.user.user_id,
            action: "System: Created User",
            details: `Created new user: ${firstName} ${lastName} (${email}) with role ${role || 'viewer'}`
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                user_id: userId,
                first_name: firstName,
                last_name: lastName,
                email,
                role: role || 'viewer'
            }
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// PUT /api/admin/users/:id - Update user
router.put("/users/:id", verifyAdmin, async (req, res) => {
    const userId = req.params.id;
    const {
        firstName,
        lastName,
        email,
        phone,
        role,
        address, // Renamed from department
        status
    } = req.body;

    try {
        // Update user profile
        await pool.query(
            `UPDATE users 
       SET first_name = $1, last_name = $2, contact_number = $3, address = $4, updated_at = NOW()
       WHERE user_id = $5`,
            [firstName, lastName, phone, address, userId]
        );

        // Update email if changed
        if (email) {
            await pool.query(
                `UPDATE auth_users 
         SET email = $1, updated_at = NOW()
         WHERE user_id = $2`,
                [email, userId]
            );
        }

        // Update role if changed
        if (role) {
            const roleQuery = await pool.query(
                "SELECT role_id FROM roles WHERE role_name = $1",
                [role]
            );

            if (roleQuery.rows.length > 0) {
                const roleId = roleQuery.rows[0].role_id;

                // Delete existing role assignment
                await pool.query(
                    "DELETE FROM user_roles WHERE user_id = $1",
                    [userId]
                );

                // Insert new role assignment
                await pool.query(
                    "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
                    [userId, roleId]
                );
            }
        }

        // Log user update
        await req.app.locals.logAudit({
            userId: req.user.user_id,
            action: "System: Updated User",
            details: `Updated details for user ${firstName} ${lastName} (ID: ${userId})`
        });

        res.json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// DELETE /api/admin/users/:id - Delete user
router.delete("/users/:id", verifyAdmin, async (req, res) => {
    const userId = req.params.id;

    try {
        // Check if user exists
        const userCheck = await pool.query(
            "SELECT * FROM users WHERE user_id = $1",
            [userId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete user (cascade will handle auth_users and user_roles)
        await pool.query("DELETE FROM users WHERE user_id = $1", [userId]);

        // Log user deletion
        await req.app.locals.logAudit({
            userId: req.user.user_id,
            action: "System: Deleted User",
            details: `Deleted user: ${userCheck.rows[0].first_name} ${userCheck.rows[0].last_name} (ID: ${userId})`
        });

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// PATCH /api/admin/users/:id/status - Toggle user status
router.patch("/users/:id/status", verifyAdmin, async (req, res) => {
    const userId = req.params.id;
    const { status } = req.body;

    try {
        // Update is_active field based on status
        const isActive = status === 'Active';

        await pool.query(
            `UPDATE users 
       SET is_active = $1, updated_at = NOW()
       WHERE user_id = $2`,
            [isActive, userId]
        );

        // Log status change
        await req.app.locals.logAudit({
            userId: req.user.user_id,
            action: `System: User Status ${status}`,
            details: `User ID ${userId} status set to ${status}`
        });

        res.json({ message: `User status updated to ${status}` });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// POST /api/admin/users/:id/reset-password - Reset password
router.post("/users/:id/reset-password", verifyAdmin, async (req, res) => {
    const userId = req.params.id;

    try {
        // Generate a random reset token
        const resetToken = require('crypto').randomBytes(32).toString('hex');

        // Update auth_users with reset token
        await pool.query(
            `UPDATE auth_users 
       SET reset_password_token = $1, updated_at = NOW()
       WHERE user_id = $2`,
            [resetToken, userId]
        );

        // In a real application, you would send an email here
        res.json({
            message: "Password reset email sent successfully",
            // For development, return the token
            resetToken: resetToken
        });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = { router, verifyAdmin };
