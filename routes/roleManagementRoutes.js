const express = require("express");
const router = express.Router();

const db = require("../config/db");


// =========================================================
// GET ALL ROLE MANAGEMENT DATA
// =========================================================

router.get("/", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                id,
                admin_name,
                role_name,
                created_at
            FROM admin_roles
            ORDER BY admin_name ASC, id ASC
        `);

        res.status(200).json({
            success: true,
            data: rows
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
// SAVE ADMIN + MULTIPLE ROLES
// =========================================================
//
// POST /api/role-management
//
// Body:
//
// {
//     "adminName": "Backend Developer",
//     "roles": [
//         "node.js",
//         "express.js",
//         "mysql"
//     ]
// }
//
// =========================================================

router.post("/", async (req, res) => {

    let connection;

    try {

        const {
            adminName,
            roles
        } = req.body;


        console.log("=================================");
        console.log("ROLE MANAGEMENT SAVE");
        console.log("Admin Name:", adminName);
        console.log("Roles:", roles);
        console.log("=================================");


        // =================================================
        // CHECK ADMIN NAME
        // =================================================

        if (
            typeof adminName !== "string" ||
            !adminName.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "Admin name is required"
            });
        }


        // =================================================
        // CHECK ROLES ARRAY
        // =================================================

        if (
            !Array.isArray(roles) ||
            roles.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message: "At least one role is required"
            });
        }


        // =================================================
        // CLEAN ADMIN NAME
        // =================================================

        const cleanAdminName =
            adminName.trim();


        // =================================================
        // CLEAN ROLES
        // =================================================

        const cleanRoles = [
            ...new Set(
                roles
                    .filter(
                        role =>
                            typeof role === "string"
                    )
                    .map(
                        role =>
                            role.trim()
                    )
                    .filter(
                        role =>
                            role.length > 0
                    )
            )
        ];


        // =================================================
        // CHECK CLEAN ROLES
        // =================================================

        if (cleanRoles.length === 0) {

            return res.status(400).json({
                success: false,
                message: "At least one valid role is required"
            });
        }


        // =================================================
        // GET DATABASE CONNECTION
        // =================================================

        connection =
            await db.getConnection();


        // =================================================
        // START TRANSACTION
        // =================================================

        await connection.beginTransaction();


        // =================================================
        // CHECK IF ADMIN ALREADY EXISTS
        // =================================================

        const [existingAdmin] =
            await connection.query(
                `
                SELECT id
                FROM admin_roles
                WHERE admin_name = ?
                LIMIT 1
                `,
                [
                    cleanAdminName
                ]
            );


        // =================================================
        // INSERT ROLES
        // =================================================

        let addedRoles = [];


        for (const role of cleanRoles) {

            // ---------------------------------------------
            // Check duplicate role
            // ---------------------------------------------

            const [existingRole] =
                await connection.query(
                    `
                    SELECT id
                    FROM admin_roles
                    WHERE admin_name = ?
                    AND role_name = ?
                    LIMIT 1
                    `,
                    [
                        cleanAdminName,
                        role
                    ]
                );


            // ---------------------------------------------
            // Add only if it doesn't already exist
            // ---------------------------------------------

            if (existingRole.length === 0) {

                await connection.query(
                    `
                    INSERT INTO admin_roles
                    (
                        admin_name,
                        role_name
                    )
                    VALUES (?, ?)
                    `,
                    [
                        cleanAdminName,
                        role
                    ]
                );

                addedRoles.push(role);
            }
        }


        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();


        // =================================================
        // RESPONSE
        // =================================================

        res.status(
            existingAdmin.length === 0
                ? 201
                : 200
        ).json({

            success: true,

            message:
                existingAdmin.length === 0
                    ? "Admin and roles saved successfully"
                    : "Roles saved successfully",

            adminName:
                cleanAdminName,

            roles:
                cleanRoles,

            addedRoles:
                addedRoles
        });

    }
    catch (error) {

        // =================================================
        // ROLLBACK
        // =================================================

        if (connection) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    "Rollback Error:",
                    rollbackError
                );
            }
        }


        console.error(
            "Save Role Management Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to save roles",

            error:
                error.message
        });

    }
    finally {

        // =================================================
        // RELEASE CONNECTION
        // =================================================

        if (connection) {

            connection.release();

        }
    }
});


module.exports = router;