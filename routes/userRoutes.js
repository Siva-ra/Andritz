const express = require("express");

const router = express.Router();

const db = require("../config/db");


// =========================================================
// GET ALL ADMIN TYPES
// =========================================================
// Used by CREATE USER panel
//
// GET:
// /api/users/admin-types
//
// Returns all admin types created in Role Management
// =========================================================

router.get("/admin-types", async (req, res) => {

    try {

        const [rows] = await db.query(
            `
            SELECT
                id,
                admin_name
            FROM admin_types
            ORDER BY admin_name ASC
            `
        );


        res.json({
            success: true,
            adminTypes: rows
        });

    }
    catch (error) {

        console.error(
            "Get Admin Types Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load admin types",
            error: error.message
        });
    }
});


// =========================================================
// GET ROLES FOR SELECTED ADMIN TYPE
// =========================================================
// Used when the user selects an Admin Type
//
// GET:
// /api/users/roles/1
//
// Example response:
//
// {
//     "success": true,
//     "roles": [
//         {
//             "id": 1,
//             "role_name": "Animator"
//         },
//         {
//             "id": 2,
//             "role_name": "3D Artist"
//         }
//     ]
// }
// =========================================================

router.get(
    "/roles/:adminTypeId",
    async (req, res) => {

        try {

            const {
                adminTypeId
            } = req.params;


            if (!adminTypeId) {

                return res.status(400).json({
                    success: false,
                    message: "Admin type ID is required"
                });
            }


            const [rows] =
                await db.query(
                    `
                    SELECT
                        id,
                        role_name
                    FROM roles
                    WHERE admin_type_id = ?
                    ORDER BY role_name ASC
                    `,
                    [adminTypeId]
                );


            res.json({
                success: true,
                roles: rows
            });

        }
        catch (error) {

            console.error(
                "Get Roles Error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Failed to load roles",
                error: error.message
            });
        }
    }
);


// =========================================================
// CREATE USER
// =========================================================
// POST:
// /api/users
//
// Body:
//
// {
//     "email": "user@gmail.com",
//     "adminTypeId": 1,
//     "roleId": 2
// }
//
// The selected role MUST belong to the selected admin.
// =========================================================

router.post("/", async (req, res) => {

    try {

        const {
            email,
            adminTypeId,
            roleId
        } = req.body;


        // =====================================================
        // VALIDATE EMAIL
        // =====================================================

        if (
            !email ||
            !email.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }


        // =====================================================
        // VALIDATE ADMIN TYPE
        // =====================================================

        if (!adminTypeId) {

            return res.status(400).json({
                success: false,
                message: "Admin type is required"
            });
        }


        // =====================================================
        // VALIDATE ROLE
        // =====================================================

        if (!roleId) {

            return res.status(400).json({
                success: false,
                message: "Role is required"
            });
        }


        const cleanEmail =
            email.trim().toLowerCase();


        // =====================================================
        // CHECK ADMIN TYPE + ROLE
        // =====================================================
        // This guarantees that the selected role belongs
        // to the selected admin type.
        // =====================================================

        const [roleRows] =
            await db.query(
                `
                SELECT
                    r.id AS role_id,
                    r.role_name,

                    a.id AS admin_type_id,
                    a.admin_name

                FROM roles r

                INNER JOIN admin_types a
                    ON a.id = r.admin_type_id

                WHERE r.id = ?
                AND a.id = ?

                LIMIT 1
                `,
                [
                    roleId,
                    adminTypeId
                ]
            );


        if (roleRows.length === 0) {

            return res.status(400).json({
                success: false,
                message:
                    "Selected role does not belong to selected admin type"
            });
        }


        const selected =
            roleRows[0];


        // =====================================================
        // CHECK WHETHER EMAIL ALREADY EXISTS
        // =====================================================

        const [existing] =
            await db.query(
                `
                SELECT
                    id
                FROM accounts
                WHERE email = ?
                LIMIT 1
                `,
                [cleanEmail]
            );


        if (existing.length > 0) {

            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }


        // =====================================================
        // CREATE USER
        // =====================================================

        const [result] =
            await db.query(
                `
                INSERT INTO accounts
                (
                    email,
                    account_type,
                    admin_type_id,
                    role_id
                )
                VALUES
                (
                    ?,
                    'user',
                    ?,
                    ?
                )
                `,
                [
                    cleanEmail,
                    selected.admin_type_id,
                    selected.role_id
                ]
            );


        // =====================================================
        // RESPONSE
        // =====================================================

        res.status(201).json({

            success: true,

            message:
                "User created successfully",

            id:
                result.insertId,

            email:
                cleanEmail,

            accountType:
                "user",

            adminType:
                selected.admin_name,

            adminTypeId:
                selected.admin_type_id,

            role:
                selected.role_name,

            roleId:
                selected.role_id
        });

    }
    catch (error) {

        console.error(
            "Create User Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to create user",
            error: error.message
        });
    }
});


module.exports = router;