const db = require("../config/db");

// ================= GET ROLES =================

exports.getRoles = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM roles ORDER BY id DESC"
        );

        res.json({
            success: true,
            roles: rows
        });

    } catch (error) {
        console.error("Get roles error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get roles",
            error: error.message
        });
    }
};


// ================= ADD ROLE =================

exports.addRole = async (req, res) => {
    try {

        const { adminType, roleName } = req.body;

        if (!adminType || !roleName) {
            return res.status(400).json({
                success: false,
                message: "Admin type and role name are required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO roles (admin_type, role_name)
             VALUES (?, ?)`,
            [adminType.trim(), roleName.trim()]
        );

        res.json({
            success: true,
            message: "Role added successfully",
            roleId: result.insertId
        });

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Role already exists"
            });
        }

        console.error("Add role error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add role",
            error: error.message
        });
    }
};


// ================= DELETE ROLE =================

exports.deleteRole = async (req, res) => {

    try {

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

        console.error("Delete role error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete role",
            error: error.message
        });
    }
};