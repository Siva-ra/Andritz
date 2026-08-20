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
        message: "Andritz 2.0 Backend is running 🚀"
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

    }
    catch (error) {

        console.error(
            "MySQL Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "MySQL connection failed ❌",
            error: error.message
        });

    }

});


// =========================================================
// ROLE MANAGEMENT - GET
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

        console.log(
            "Role Management Data:",
            rows
        );

        res.json({
            success: true,
            data: rows
        });

    }
    catch (error) {

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
// ROLE MANAGEMENT - SAVE
// =========================================================

app.post("/api/role-management", async (req, res) => {

    console.log("=================================");
    console.log("POST /api/role-management");
    console.log("BODY:", req.body);
    console.log("=================================");


    let connection;


    try {

        const {
            adminName,
            roles
        } = req.body;


        // =================================================
        // VALIDATE ADMIN NAME
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
        // VALIDATE ROLES
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
        // CLEAN ADMIN
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


        if (cleanRoles.length === 0) {

            return res.status(400).json({
                success: false,
                message: "At least one valid role is required"
            });

        }


        // =================================================
        // DATABASE CONNECTION
        // =================================================

        connection =
            await db.getConnection();


        // =================================================
        // TRANSACTION
        // =================================================

        await connection.beginTransaction();


        // =================================================
        // INSERT EACH ROLE
        // =================================================

        let addedRoles = [];


        for (const role of cleanRoles) {

            const [existing] =
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


            if (existing.length === 0) {

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


        console.log(
            "Roles successfully saved:",
            addedRoles
        );


        // =================================================
        // RESPONSE
        // =================================================

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

    }
    catch (error) {

        console.error(
            "Save Role Management Error:",
            error
        );


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


        res.status(500).json({

            success: false,

            message:
                "Failed to save roles",

            error:
                error.message

        });

    }
    finally {

        if (connection) {
            connection.release();
        }

    }

});


// =========================================================
// 404
// =========================================================

app.use((req, res) => {

    console.log(
        "404 REQUEST:",
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
// SERVER
// =========================================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "================================="
        );

        console.log(
            "ANDRITZ 2.0 BACKEND"
        );

        console.log(
            "================================="
        );

        console.log(
            "PORT:",
            PORT
        );

        console.log(
            "ROLE MANAGEMENT GET:",
            "/api/role-management"
        );

        console.log(
            "ROLE MANAGEMENT POST:",
            "/api/role-management"
        );

        console.log(
            "================================="
        );

        console.log(
            "SERVER STARTED SUCCESSFULLY 🚀"
        );

    }
);