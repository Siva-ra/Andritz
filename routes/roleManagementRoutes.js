const express = require("express");
const router = express.Router();

const db = require("../config/db");

// =========================================================
// GET ALL ADMIN TYPES WITH THEIR ROLES
// =========================================================

router.get("/", async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                a.id AS admin_type_id,
                a.admin_name,
                r.id AS role_id,
                r.role_name
            FROM admin_types a
            LEFT JOIN roles r
                ON r.admin_type_id = a.id
            ORDER BY
                a.admin_name ASC,
                r.role_name ASC
        `);

        const adminTypes = [];

        for (const row of rows) {

            let admin = adminTypes.find(
                item => item.id === row.admin_type_id
            );

            if (!admin) {

                admin = {
                    id: row.admin_type_id,
                    admin_name: row.admin_name,
                    roles: []
                };

                adminTypes.push(admin);
            }

            if (row.role_id !== null) {

                admin.roles.push({
                    id: row.role_id,
                    role_name: row.role_name
                });
            }
        }

        res.json({
            success: true,
            adminTypes: adminTypes
        });

    } catch (error) {

        console.error(
            "Load Role Management Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load role management data",
            error: error.message
        });
    }
});


// =========================================================
// SAVE ADMIN + ROLES
// =========================================================

router.post("/", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const {
            adminName,
            roles
        } = req.body;


        // -------------------------------------------------
        // VALIDATE ADMIN NAME
        // -------------------------------------------------

        if (
            !adminName ||
            !adminName.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "Admin name is required"
            });
        }


        // -------------------------------------------------
        // VALIDATE ROLES
        // -------------------------------------------------

        if (
            !Array.isArray(roles) ||
            roles.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message: "At least one role is required"
            });
        }


        const cleanAdminName =
            adminName.trim();


        const cleanRoles =
            roles
                .map(role => role.trim())
                .filter(role => role.length > 0);


        if (cleanRoles.length === 0) {

            return res.status(400).json({
                success: false,
                message: "At least one valid role is required"
            });
        }


        // -------------------------------------------------
        // START TRANSACTION
        // -------------------------------------------------

        await connection.beginTransaction();


        // -------------------------------------------------
        // CHECK ADMIN
        // -------------------------------------------------

        const [existingAdmin] =
            await connection.query(
                `
                SELECT id
                FROM admin_types
                WHERE admin_name = ?
                LIMIT 1
                `,
                [cleanAdminName]
            );


        let adminTypeId;


        if (existingAdmin.length > 0) {

            adminTypeId =
                existingAdmin[0].id;

        } else {

            const [adminResult] =
                await connection.query(
                    `
                    INSERT INTO admin_types
                    (admin_name)
                    VALUES (?)
                    `,
                    [cleanAdminName]
                );

            adminTypeId =
                adminResult.insertId;
        }


        // -------------------------------------------------
        // INSERT ROLES
        // -------------------------------------------------

        let addedRoles = [];


        for (const roleName of cleanRoles) {

            // Check duplicate role under this admin

            const [existingRole] =
                await connection.query(
                    `
                    SELECT id
                    FROM roles
                    WHERE admin_type_id = ?
                    AND role_name = ?
                    LIMIT 1
                    `,
                    [
                        adminTypeId,
                        roleName
                    ]
                );


            if (existingRole.length > 0) {

                continue;
            }


            const [roleResult] =
                await connection.query(
                    `
                    INSERT INTO roles
                    (
                        admin_type_id,
                        role_name
                    )
                    VALUES (?, ?)
                    `,
                    [
                        adminTypeId,
                        roleName
                    ]
                );


            addedRoles.push({
                id: roleResult.insertId,
                role_name: roleName
            });
        }


        // -------------------------------------------------
        // COMMIT
        // -------------------------------------------------

        await connection.commit();


        res.status(201).json({

            success: true,

            message:
                "Admin and roles saved successfully",

            admin: {
                id: adminTypeId,
                admin_name: cleanAdminName
            },

            roles: addedRoles

        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Save Role Management Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to save admin and roles",

            error:
                error.message

        });

    } finally {

        connection.release();
    }
});


module.exports = router;