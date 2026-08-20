const express = require("express");

const router = express.Router();

const db = require("../config/db");

const {
    createSession
} = require("../config/auth");


// =========================================================
// LOGIN
// =========================================================

router.post("/", async (req, res) => {

    try {

        const {
            email
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


        const cleanEmail =
            email.trim().toLowerCase();


        // =================================================
        // SUPER ADMIN
        // =================================================

        if (
            process.env.SUPER_ADMIN_EMAIL &&
            cleanEmail ===
            process.env.SUPER_ADMIN_EMAIL
                .trim()
                .toLowerCase()
        ) {

            const token =
                await createSession(
                    cleanEmail,
                    "super_admin"
                );


            return res.json({

                success: true,

                accountType:
                    "super_admin",

                email:
                    cleanEmail,

                message:
                    "Welcome Super Admin",

                token
            });
        }


        // =================================================
        // NORMAL ADMIN / USER
        // =================================================

        const [rows] =
            await db.query(
                `SELECT
                    acc.id,
                    acc.email,
                    acc.account_type,

                    at.id AS admin_type_id,
                    at.admin_name,

                    r.id AS role_id,
                    r.role_name

                 FROM accounts acc

                 INNER JOIN admin_types at
                    ON at.id = acc.admin_type_id

                 LEFT JOIN roles r
                    ON r.id = acc.role_id

                 WHERE acc.email = ?

                 LIMIT 1`,
                [cleanEmail]
            );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Email not registered"
            });
        }


        const account =
            rows[0];


        const token =
            await createSession(
                account.email,
                account.account_type
            );


        // =================================================
        // ADMIN
        // =================================================

        if (
            account.account_type ===
            "admin"
        ) {

            return res.json({

                success: true,

                accountType:
                    "admin",

                email:
                    account.email,

                adminType:
                    account.admin_name,

                role: null,

                message:
                    `Welcome Admin - ${account.admin_name}`,

                token
            });
        }


        // =================================================
        // USER
        // =================================================

        return res.json({

            success: true,

            accountType:
                "user",

            email:
                account.email,

            adminType:
                account.admin_name,

            role:
                account.role_name,

            message:
                `Welcome User - ${account.admin_name} / ${account.role_name}`,

            token
        });

    }
    catch (error) {

        console.error(
            "Login Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
});


module.exports = router;