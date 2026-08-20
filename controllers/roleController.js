const db = require("../config/db");

// =========================================================
// GET ALL ROLES
// =========================================================

exports.getRoles = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT 
                id,
                admin_type,
                role_name,
                created_at
             FROM roles
             ORDER BY id ASC`
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
};


// =========================================================
// ADD ROLE
// =========================================================

exports.addRole = async (req, res) => {
    try {

        const { adminType, roleName } = req.body;

        // -----------------------------------------------------
        // VALIDATION
        // -----------------------------------------------------

        if (!adminType || !adminType.trim()) {
            return res.status(400).json({
                success: false,
                message: "Admin name is required"
            });
        }

        if (!roleName || !roleName.trim()) {
            return res.status(400).json({
                success: false,
                message: "Role name is required"
            });
        }


        const admin =
            adminType.trim();

        const role =
            roleName.trim();


        // -----------------------------------------------------
        // CHECK DUPLICATE
        // -----------------------------------------------------

        const [existing] = await db.query(
            `SELECT id
             FROM roles
             WHERE admin_type = ?
             AND role_name = ?`,
            [admin, role]
        );


        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Role already exists for this admin"
            });
        }


        // -----------------------------------------------------
        // INSERT
        // -----------------------------------------------------

        const [result] = await db.query(
            `INSERT INTO roles
                (admin_type, role_name)
             VALUES (?, ?)`,
            [admin, role]
        );


        res.status(201).json({
            success: true,
            message: "Role added successfully",
            roleId: result.insertId,
            adminType: admin,
            roleName: role
        });


    } catch (error) {

        console.error("Add Role Error:", error);


        res.status(500).json({
            success: false,
            message: "Failed to add role",
            error: error.message
        });
    }
};


// =========================================================
// DELETE ROLE
// =========================================================

exports.deleteRole = async (req, res) => {

    try {

        const { id } = req.params;


        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Role ID is required"
            });
        }


        const [result] = await db.query(
            `DELETE FROM roles
             WHERE id = ?`,
            [id]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Role not found"
            });
        }


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
};