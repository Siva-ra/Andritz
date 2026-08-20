const express = require("express");

const router = express.Router();

// ================= GET ALL ROLES =================

router.get("/", async (req, res) => {
    try {
        const db = req.app.locals.db;

        const [rows] = await db.query(
            "SELECT id, role_name FROM roles ORDER BY id ASC"
        );

        res.json({
            success: true,
            roles: rows
        });

    } catch (error) {
        console.error("Get Roles Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load roles",
            error: error.message
        });
    }
});


// ================= ADD ROLE =================

router.post("/", async (req, res) => {
    try {
        const db = req.app.locals.db;

        const { role_name } = req.body;

        if (!role_name || !role_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Role name is required"
            });
        }

        const role = role_name.trim();

        // Check duplicate
        const [existing] = await db.query(
            "SELECT id FROM roles WHERE role_name = ?",
            [role]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Role already exists"
            });
        }

        const [result] = await db.query(
            "INSERT INTO roles (role_name) VALUES (?)",
            [role]
        );

        res.status(201).json({
            success: true,
            message: "Role added successfully",
            id: result.insertId,
            role_name: role
        });

    } catch (error) {
        console.error("Add Role Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add role",
            error: error.message
        });
    }
});


// ================= DELETE ROLE =================

router.delete("/:id", async (req, res) => {
    try {
        const db = req.app.locals.db;

        const { id } = req.params;

        await db.query(
            "DELETE FROM roles WHERE id = ?",
            [id]
        );

        res.json({
            success: true,
            message: "Role deleted successfully"
        });

    } catch (error) {
        console.error("Delete Role Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete role",
            error: error.message
        });
    }
});


module.exports = router;