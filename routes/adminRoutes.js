const express = require("express");
const router = express.Router();

const db = require("../config/db");


// =========================================================
// GET ADMIN TYPES
// =========================================================
// Loads Admin Types created from Role Management.
//
// GET:
// /api/admins/types
//
// Example:
//
// {
//     "success": true,
//     "adminTypes": [
//         {
//             "id": 1,
//             "admin_name": "Backend Developer"
//         }
//     ]
// }
// =========================================================

router.get("/types", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                id,
                admin_name
            FROM admin_types
            ORDER BY admin_name ASC
        `);


        res.status(200).json({

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

            message:
                "Failed to load admin types",

            error:
                error.message

        });

    }

});


// =========================================================
// CREATE ADMIN
// =========================================================
// POST:
// /api/admins
//
// Body:
//
// {
//     "email": "admin@gmail.com",
//     "adminTypeId": 1
// }
//
// =========================================================

router.post("/", async (req, res) => {

    try {

        const {
            email,
            adminTypeId
        } = req.body;


        // =================================================
        // VALIDATE EMAIL
        // =================================================

        if (
            typeof email !== "string" ||
            !email.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required"

            });

        }


        // =================================================
        // VALIDATE ADMIN TYPE
        // =================================================

        if (!adminTypeId) {

            return res.status(400).json({

                success: false,

                message:
                    "Admin type is required"

            });

        }


        // =================================================
        // CLEAN EMAIL
        // =================================================

        const cleanEmail =
            email.trim().toLowerCase();


        // =================================================
        // CHECK ADMIN TYPE
        // =================================================

        const [adminTypeRows] =
            await db.query(
                `
                SELECT
                    id,
                    admin_name
                FROM admin_types
                WHERE id = ?
                LIMIT 1
                `,
                [
                    adminTypeId
                ]
            );


        if (
            adminTypeRows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Admin type not found"

            });

        }


        const adminType =
            adminTypeRows[0];


        // =================================================
        // CHECK EXISTING EMAIL
        // =================================================

        const [existing] =
            await db.query(
                `
                SELECT
                    id
                FROM accounts
                WHERE email = ?
                LIMIT 1
                `,
                [
                    cleanEmail
                ]
            );


        if (
            existing.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Email already exists"

            });

        }


        // =================================================
        // CREATE ADMIN ACCOUNT
        // =================================================

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
                    'admin',
                    ?,
                    NULL
                )
                `,
                [
                    cleanEmail,
                    adminType.id
                ]
            );


        // =================================================
        // SUCCESS
        // =================================================

        res.status(201).json({

            success: true,

            message:
                "Admin created successfully",

            id:
                result.insertId,

            email:
                cleanEmail,

            accountType:
                "admin",

            adminTypeId:
                adminType.id,

            adminType:
                adminType.admin_name

        });

    }
    catch (error) {

        console.error(
            "Create Admin Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to create admin",

            error:
                error.message

        });

    }

});


module.exports = router;