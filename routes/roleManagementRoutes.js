const express = require("express");
const router = express.Router();

const db = require("../config/db");

// =========================================================
// GET ALL ADMIN TYPES WITH THEIR ROLES
// =========================================================
// GET:
// /api/role-management
//
// Response:
//
// {
//     "success": true,
//     "adminTypes": [
//         {
//             "id": 1,
//             "admin_name": "Engineering",
//             "roles": [
//                 {
//                     "id": 1,
//                     "role_name": "Animator"
//                 },
//                 {
//                     "id": 2,
//                     "role_name": "3D Artist"
//                 }
//             ]
//         }
//     ]
// }
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
                item =>
                    item.id === row.admin_type_id
            );


            // =================================================
            // CREATE ADMIN OBJECT
            // =================================================

            if (!admin) {

                admin = {

                    id:
                        row.admin_type_id,

                    admin_name:
                        row.admin_name,

                    roles: []

                };

                adminTypes.push(admin);
            }


            // =================================================
            // ADD ROLE
            // =================================================

            if (row.role_id !== null) {

                admin.roles.push({

                    id:
                        row.role_id,

                    role_name:
                        row.role_name

                });

            }

        }


        // =====================================================
        // SUCCESS
        // =====================================================

        res.json({

            success: true,

            adminTypes:
                adminTypes

        });

    }

    catch (error) {

        console.error(
            "Load Role Management Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to load role management data",

            error:
                error.message

        });

    }

});


// =========================================================
// SAVE ADMIN + ROLES
// =========================================================
// POST:
// /api/role-management
//
// Body:
//
// {
//     "adminName": "Engineering",
//     "roles": [
//         "Animator",
//         "3D Artist",
//         "Developer"
//     ]
// }
//
// Behaviour:
//
// - If Admin Type does not exist:
//      Create Admin Type + Roles
//
// - If Admin Type already exists:
//      Add only new roles
//
// - Duplicate roles are ignored
//
// =========================================================

router.post("/", async (req, res) => {

    let connection;


    try {

        // =====================================================
        // GET DATABASE CONNECTION
        // =====================================================

        connection =
            await db.getConnection();


        // =====================================================
        // READ REQUEST
        // =====================================================

        const {
            adminName,
            roles
        } = req.body;


        // =====================================================
        // VALIDATE ADMIN NAME
        // =====================================================

        if (
            typeof adminName !== "string" ||
            !adminName.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Admin name is required"

            });

        }


        // =====================================================
        // VALIDATE ROLES
        // =====================================================

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


        // =====================================================
        // CLEAN ADMIN NAME
        // =====================================================

        const cleanAdminName =
            adminName.trim();


        // =====================================================
        // CLEAN ROLES
        // =====================================================

        const cleanRoles =
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
                );


        // =====================================================
        // REMOVE DUPLICATE ROLES
        // CASE-INSENSITIVE
        // =====================================================

        const uniqueRoles = [];

        const roleKeys = new Set();


        for (const role of cleanRoles) {

            const roleKey =
                role.toLowerCase();


            if (roleKeys.has(roleKey)) {

                continue;

            }


            roleKeys.add(roleKey);

            uniqueRoles.push(role);

        }


        // =====================================================
        // CHECK VALID ROLES
        // =====================================================

        if (uniqueRoles.length === 0) {

            return res.status(400).json({

                success: false,

                message:
                    "At least one valid role is required"

            });

        }


        // =====================================================
        // START TRANSACTION
        // =====================================================

        await connection.beginTransaction();


        // =====================================================
        // FIND EXISTING ADMIN TYPE
        // =====================================================

        const [
            existingAdmin
        ] = await connection.query(

            `
            SELECT
                id,
                admin_name

            FROM admin_types

            WHERE LOWER(admin_name) = LOWER(?)

            LIMIT 1
            `,

            [
                cleanAdminName
            ]

        );


        let adminTypeId;

        let finalAdminName;


        // =====================================================
        // CREATE ADMIN TYPE IF NOT EXISTS
        // =====================================================

        if (existingAdmin.length === 0) {

            const [
                adminResult
            ] = await connection.query(

                `
                INSERT INTO admin_types
                (
                    admin_name
                )

                VALUES (?)
                `,

                [
                    cleanAdminName
                ]

            );


            adminTypeId =
                adminResult.insertId;

            finalAdminName =
                cleanAdminName;

        }

        else {

            adminTypeId =
                existingAdmin[0].id;

            finalAdminName =
                existingAdmin[0].admin_name;

        }


        // =====================================================
        // GET EXISTING ROLES
        // =====================================================

        const [
            existingRoles
        ] = await connection.query(

            `
            SELECT
                id,
                role_name

            FROM roles

            WHERE admin_type_id = ?
            `,

            [
                adminTypeId
            ]

        );


        // =====================================================
        // CREATE SET OF EXISTING ROLES
        // =====================================================

        const existingRoleKeys =
            new Set();


        for (
            const existingRole
            of existingRoles
        ) {

            existingRoleKeys.add(

                existingRole.role_name
                    .trim()
                    .toLowerCase()

            );

        }


        // =====================================================
        // INSERT NEW ROLES
        // =====================================================

        const addedRoles = [];


        for (
            const roleName
            of uniqueRoles
        ) {

            const roleKey =
                roleName.toLowerCase();


            // -------------------------------------------------
            // SKIP DUPLICATE
            // -------------------------------------------------

            if (
                existingRoleKeys.has(
                    roleKey
                )
            ) {

                continue;

            }


            // -------------------------------------------------
            // INSERT ROLE
            // -------------------------------------------------

            const [
                roleResult
            ] = await connection.query(

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

                id:
                    roleResult.insertId,

                role_name:
                    roleName

            });


            // -------------------------------------------------
            // ADD TO EXISTING SET
            // -------------------------------------------------

            existingRoleKeys.add(
                roleKey
            );

        }


        // =====================================================
        // COMMIT
        // =====================================================

        await connection.commit();


        // =====================================================
        // GET COMPLETE ADMIN DATA
        // =====================================================

        const [
            savedRoles
        ] = await db.query(

            `
            SELECT
                id,
                role_name

            FROM roles

            WHERE admin_type_id = ?

            ORDER BY role_name ASC
            `,

            [
                adminTypeId
            ]

        );


        // =====================================================
        // SUCCESS RESPONSE
        // =====================================================

        res.status(201).json({

            success: true,

            message:
                addedRoles.length > 0

                    ? "Admin and roles saved successfully"

                    : "Admin already exists and no new roles were added",


            admin: {

                id:
                    adminTypeId,

                admin_name:
                    finalAdminName,

                roles:
                    savedRoles

            },


            addedRoles:
                addedRoles

        });

    }


    catch (error) {

        // =====================================================
        // ROLLBACK
        // =====================================================

        if (connection) {

            try {

                await connection.rollback();

            }

            catch (rollbackError) {

                console.error(
                    "Rollback Error:",
                    rollbackError
                );

            }

        }


        // =====================================================
        // LOG ERROR
        // =====================================================

        console.error(
            "Save Role Management Error:",
            error
        );


        // =====================================================
        // RESPONSE
        // =====================================================

        res.status(500).json({

            success: false,

            message:
                "Failed to save admin and roles",

            error:
                error.message

        });

    }


    finally {

        // =====================================================
        // RELEASE CONNECTION
        // =====================================================

        if (connection) {

            connection.release();

        }

    }

});


module.exports = router;