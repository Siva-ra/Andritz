const express = require("express");

const router = express.Router();

const db = require("../config/db");


// =========================================================
// GET ADMIN TYPES
// =========================================================

router.get("/types", async (req, res) => {

    try {

        const [rows] = await db.query(
            `SELECT
                id,
                admin_name
             FROM admin_types
             ORDER BY admin_name ASC`
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
// CREATE ADMIN
// =========================================================

router.post("/", async (req, res) => {

    try {

        const {
            email,
            adminTypeId
        } = req.body;


        if (
            !email ||
            !email.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }


        if (!adminTypeId) {

            return res.status(400).json({
                success: false,
                message: "Admin type is required"
            });
        }


        const cleanEmail =
            email.trim().toLowerCase();


        const [adminTypeRows] =
            await db.query(
                `SELECT
                    id,
                    admin_name
                 FROM admin_types
                 WHERE id = ?
                 LIMIT 1`,
                [adminTypeId]
            );


        if (adminTypeRows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Admin type not found"
            });
        }


        const adminType =
            adminTypeRows[0];


        const [existing] =
            await db.query(
                `SELECT id
                 FROM accounts
                 WHERE email = ?
                 LIMIT 1`,
                [cleanEmail]
            );


        if (existing.length > 0) {

            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }


        const [result] =
            await db.query(
                `INSERT INTO accounts
                (
                    email,
                    account_type,
                    admin_type_id,
                    role_id
                )
                VALUES
                (?, 'admin', ?, NULL)`,
                [
                    cleanEmail,
                    adminType.id
                ]
            );


        res.status(201).json({

            success: true,

            message:
                "Admin created successfully",

            id:
                result.insertId,

            email:
                cleanEmail,

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
            message: "Failed to create admin",
            error: error.message
        });
    }
});


module.exports = router;