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
            ORDER BY a.id ASC, r.id ASC
        `);

        const adminTypes = {};

        rows.forEach(row => {

            if (!adminTypes[row.admin_type_id]) {

                adminTypes[row.admin_type_id] = {
                    id: row.admin_type_id,
                    admin_name: row.admin_name,
                    roles: []
                };

            }

            if (row.role_id) {

                adminTypes[row.admin_type_id].roles.push({
                    id: row.role_id,
                    role_name: row.role_name
                });

            }

        });


        res.json({

            success: true,

            adminTypes:
                Object.values(adminTypes)

        });

    }
    catch (error) {

        console.error(
            "Get Admin Types Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to load admin types",

            error:
                error.message

        });

    }

});


// =========================================================
// SAVE ADMIN + ROLES
// =========================================================

router.post("/", async (req, res) => {

    try {

        const {
            adminName,
            roles
        } = req.body;


        // -----------------------------
        // VALIDATE ADMIN NAME
        // -----------------------------

        if (
            !adminName ||
            !adminName.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Admin name is required"

            });

        }


        // -----------------------------
        // VALIDATE ROLES
        // -----------------------------

        if (
            !Array.isArray(roles) ||
            roles.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "At least one role is required"

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

                message:
                    "At least one valid role is required"

            });

        }


        // =================================================
        // CHECK ADMIN DUPLICATE
        // =================================================

        const [existingAdmin] =
            await db.query(
                `
                SELECT id
                FROM admin_types
                WHERE admin_name = ?
                LIMIT 1
                `,
                [cleanAdminName]
            );


        if (existingAdmin.length > 0) {

            return res.status(409).json({

                success: false,

                message:
                    "Admin already exists"

            });

        }


        // =================================================
        // CREATE ADMIN
        // =================================================

        const [adminResult] =
            await db.query(
                `
                INSERT INTO admin_types
                (admin_name)
                VALUES (?)
                `,
                [cleanAdminName]
            );


        const adminTypeId =
            adminResult.insertId;


        // =================================================
        // INSERT ROLES
        // =================================================

        for (
            const roleName of cleanRoles
        ) {

            await db.query(
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

        }


        // =================================================
        // SUCCESS
        // =================================================

        res.status(201).json({

            success: true,

            message:
                "Admin and roles saved successfully",

            admin: {

                id:
                    adminTypeId,

                admin_name:
                    cleanAdminName,

                roles:
                    cleanRoles

            }

        });

    }
    catch (error) {

        console.error(
            "Save Admin Roles Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to save admin and roles",

            error:
                error.message

        });

    }

});


module.exports = router;