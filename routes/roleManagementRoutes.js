const express = require("express");

const router = express.Router();

const db = require("../config/db");


// =========================================================
// GET ALL ADMIN TYPES + ROLES
// =========================================================

router.get("/", async (req, res) => {

    try {

        const [adminTypes] = await db.query(
            `SELECT
                id,
                admin_name,
                created_at
             FROM admin_types
             ORDER BY id ASC`
        );


        for (const admin of adminTypes) {

            const [roles] = await db.query(
                `SELECT
                    id,
                    role_name,
                    created_at
                 FROM roles
                 WHERE admin_type_id = ?
                 ORDER BY id ASC`,
                [admin.id]
            );

            admin.roles = roles;
        }


        res.json({
            success: true,
            adminTypes: adminTypes
        });

    }
    catch (error) {

        console.error(
            "Get Role Management Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load roles",
            error: error.message
        });
    }
});


// =========================================================
// SAVE ADMIN + ROLES
// =========================================================

router.post("/", async (req, res) => {

    const connection =
        await db.getConnection();

    try {

        const {
            adminName,
            roles
        } = req.body;


        // =====================================================
        // VALIDATION
        // =====================================================

        if (
            !adminName ||
            !adminName.trim()
        ) {

            connection.release();

            return res.status(400).json({
                success: false,
                message: "Admin name is required"
            });
        }


        if (
            !Array.isArray(roles) ||
            roles.length === 0
        ) {

            connection.release();

            return res.status(400).json({
                success: false,
                message: "At least one role is required"
            });
        }


        const cleanAdminName =
            adminName.trim();


        const cleanRoles =
            roles
                .map(role =>
                    String(role).trim()
                )
                .filter(role =>
                    role.length > 0
                );


        if (cleanRoles.length === 0) {

            connection.release();

            return res.status(400).json({
                success: false,
                message: "At least one valid role is required"
            });
        }


        // Remove duplicate roles
        const uniqueRoles =
            [...new Set(cleanRoles)];


        // =====================================================
        // START TRANSACTION
        // =====================================================

        await connection.beginTransaction();


        // =====================================================
        // FIND ADMIN TYPE
        // =====================================================

        const [existingAdmin] =
            await connection.query(
                `SELECT id
                 FROM admin_types
                 WHERE admin_name = ?
                 LIMIT 1`,
                [cleanAdminName]
            );


        let adminTypeId;


        // =====================================================
        // CREATE ADMIN TYPE IF IT DOESN'T EXIST
        // =====================================================

        if (existingAdmin.length > 0) {

            adminTypeId =
                existingAdmin[0].id;

        }
        else {

            const [result] =
                await connection.query(
                    `INSERT INTO admin_types
                    (admin_name)
                    VALUES (?)`,
                    [cleanAdminName]
                );

            adminTypeId =
                result.insertId;
        }


        // =====================================================
        // SAVE EVERY ROLE
        // =====================================================

        for (const role of uniqueRoles) {

            await connection.query(
                `INSERT IGNORE INTO roles
                (admin_type_id, role_name)
                VALUES (?, ?)`,
                [
                    adminTypeId,
                    role
                ]
            );
        }


        // =====================================================
        // COMMIT
        // =====================================================

        await connection.commit();


        res.json({

            success: true,

            message:
                "Admin and roles saved successfully",

            adminTypeId:
                adminTypeId,

            adminName:
                cleanAdminName,

            roles:
                uniqueRoles
        });

    }
    catch (error) {

        await connection.rollback();

        console.error(
            "Save Role Management Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to save roles",
            error: error.message
        });
    }
    finally {

        connection.release();
    }
});


module.exports = router;