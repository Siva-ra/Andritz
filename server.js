const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

const app = express();


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// =========================================================
// HOME
// =========================================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "Andritz 2.0 Backend is running 🚀",
        server: "Hostinger"
    });

});


// =========================================================
// DATABASE TEST
// =========================================================

app.get("/test-db", async (req, res) => {

    try {

        const [result] = await db.query(
            "SELECT 1 AS test"
        );

        res.json({
            success: true,
            message: "MySQL connected successfully ✅",
            result: result
        });

    } catch (error) {

        console.error("MySQL Error:", error);

        res.status(500).json({
            success: false,
            message: "MySQL connection failed ❌",
            error: error.message
        });

    }

});


// =========================================================
// ROLE MANAGEMENT
// GET ALL SAVED ROLES
// =========================================================

app.get("/api/role-management", async (req, res) => {

    console.log("GET /api/role-management");

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

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {

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
// ROLE MANAGEMENT
// SAVE ADMIN + MULTIPLE ROLES
// =========================================================

app.post("/api/role-management", async (req, res) => {

    console.log("=================================");
    console.log("POST /api/role-management");
    console.log("Request Body:", req.body);
    console.log("=================================");


    try {

        const {
            adminName,
            roles
        } = req.body;


        // =====================================================
        // CHECK ADMIN NAME
        // =====================================================

        if (
            !adminName ||
            typeof adminName !== "string" ||
            !adminName.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "Admin name is required"
            });

        }


        // =====================================================
        // CHECK ROLES
        // =====================================================

        if (
            !Array.isArray(roles) ||
            roles.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message: "At least one role is required"
            });

        }


        // =====================================================
        // CLEAN ADMIN NAME
        // =====================================================

        const cleanAdminName =
            adminName.trim();


        // =====================================================
        // CLEAN ROLES
        // Remove empty roles
        // Remove duplicate roles
        // =====================================================

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


        // =====================================================
        // CHECK CLEANED ROLES
        // =====================================================

        if (cleanRoles.length === 0) {

            return res.status(400).json({
                success: false,
                message: "No valid roles provided"
            });

        }


        // =====================================================
        // SAVE EACH ROLE
        // =====================================================

        const addedRoles = [];


        for (const role of cleanRoles) {

            // -------------------------------------------------
            // Check if this admin + role already exists
            // -------------------------------------------------

            const [existing] = await db.query(
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


            // -------------------------------------------------
            // Insert only if it does not exist
            // -------------------------------------------------

            if (existing.length === 0) {

                await db.query(
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


        // =====================================================
        // SUCCESS
        // =====================================================

        console.log(
            "Saved Admin:",
            cleanAdminName
        );

        console.log(
            "Saved Roles:",
            addedRoles
        );


        res.status(200).json({

            success: true,

            message:
                "Admin and roles saved successfully",

            adminName:
                cleanAdminName,

            roles:
                cleanRoles,

            addedRoles:
                addedRoles

        });

    } catch (error) {

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

});


// =========================================================
// 404 HANDLER
// =========================================================

app.use((req, res) => {

    console.log(
        "404:",
        req.method,
        req.originalUrl
    );

    res.status(404).json({

        success: false,

        message:
            "API endpoint not found",

        method:
            req.method,

        path:
            req.originalUrl

    });

});


// =========================================================
// START SERVER
// =========================================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "========================================"
        );

        console.log(
            "ANDRITZ 2.0 BACKEND"
        );

        console.log(
            "========================================"
        );

        console.log(
            "Environment:",
            process.env.NODE_ENV || "production"
        );

        console.log(
            "Port:",
            PORT
        );

        console.log(
            "Server: Hostinger"
        );

        console.log(
            "GET  /api/role-management"
        );

        console.log(
            "POST /api/role-management"
        );

        console.log(
            "========================================"
        );

        console.log(
            "SERVER STARTED SUCCESSFULLY 🚀"
        );

    }
);