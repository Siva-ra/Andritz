const express = require("express");

const router = express.Router();

const db = require("../config/db");

const {
    createSession
} = require("../config/auth");


// =========================================================
// LOGIN
// =========================================================
// POST:
// /api/login
//
// Body:
//
// {
//     "email": "someone@gmail.com"
// }
// =========================================================

router.post("/", async (req, res) => {

    try {

        const {
            email
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


        const cleanEmail =
            email.trim().toLowerCase();


        // =====================================================
        // FIND ACCOUNT
        // =====================================================

        const [rows] =
            await db.query(
                `
                SELECT

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

                LIMIT 1
                `,
                [cleanEmail]
            );


        // =====================================================
        // EMAIL NOT FOUND
        // =====================================================

        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Email not registered"
            });
        }


        const account =
            rows[0];


        // =====================================================
        // CREATE SESSION
        // =====================================================

        const token =
            await createSession(
                account.email,
                account.account_type
            );


        // =====================================================
        // ADMIN LOGIN
        // =====================================================

        if (
            account.account_type === "admin"
        ) {

            return res.json({

                success: true,

                accountType:
                    "admin",

                email:
                    account.email,

                adminTypeId:
                    account.admin_type_id,

                adminType:
                    account.admin_name,

                roleId:
                    null,

                role:
                    null,

                message:
                    `Welcome Admin - ${account.admin_name}`,

                token
            });
        }


        // =====================================================
        // USER LOGIN
        // =====================================================

        if (
            account.account_type === "user"
        ) {

            return res.json({

                success: true,

                accountType:
                    "user",

                email:
                    account.email,

                adminTypeId:
                    account.admin_type_id,

                adminType:
                    account.admin_name,

                roleId:
                    account.role_id,

                role:
                    account.role_name,

                message:
                    `Welcome User - ${account.admin_name} / ${account.role_name}`,

                token
            });
        }


        // =====================================================
        // UNKNOWN ACCOUNT TYPE
        // =====================================================

        return res.status(400).json({

            success: false,

            message:
                "Invalid account type"
        });

    }
    catch (error) {

        console.error(
            "Login Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Login failed",

            error:
                error.message
        });
    }
});


module.exports = router;