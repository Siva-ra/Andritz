const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

// =========================================================
// ROUTES
// =========================================================

const roleRoutes = require("./routes/roleRoutes");
const roleManagementRoutes = require("./routes/roleManagementRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const loginRoutes = require("./routes/loginRoutes");


// =========================================================
// CREATE EXPRESS APP
// =========================================================

const app = express();


// =========================================================
// MIDDLEWARE
// =========================================================

// Allow Unity / WebGL / other clients
app.use(cors());

// JSON request body
app.use(express.json());

// Form request body
app.use(
    express.urlencoded({
        extended: true
    })
);


// =========================================================
// API ROUTES
// =========================================================

// ---------------------------------------------------------
// OLD / BASIC ROLE API
// ---------------------------------------------------------

app.use(
    "/api/roles",
    roleRoutes
);


// ---------------------------------------------------------
// ROLE MANAGEMENT
// ---------------------------------------------------------
// Unity Role Management Panel uses:
//
// POST /api/role-management
// GET  /api/role-management
//
// ---------------------------------------------------------

app.use(
    "/api/role-management",
    roleManagementRoutes
);


// ---------------------------------------------------------
// CREATE ADMIN
// ---------------------------------------------------------

app.use(
    "/api/admins",
    adminRoutes
);


// ---------------------------------------------------------
// CREATE USER
// ---------------------------------------------------------

app.use(
    "/api/users",
    userRoutes
);


// ---------------------------------------------------------
// LOGIN
// ---------------------------------------------------------

app.use(
    "/api/login",
    loginRoutes
);


// =========================================================
// HOME / SERVER TEST
// =========================================================

app.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        message:
            "Andritz 2.0 Backend is running 🚀",

        server:
            "Hostinger",

        database:
            "MySQL",

        api: {

            roles:
                "/api/roles",

            roleManagement:
                "/api/role-management",

            admins:
                "/api/admins",

            users:
                "/api/users",

            login:
                "/api/login"
        }

    });

});


// =========================================================
// MYSQL TEST
// =========================================================

app.get("/test-db", async (req, res) => {

    try {

        const [result] =
            await db.query(
                "SELECT 1 AS test"
            );


        res.status(200).json({

            success: true,

            message:
                "MySQL connected successfully ✅",

            result

        });

    }
    catch (error) {

        console.error(
            "❌ MySQL Connection Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "MySQL connection failed ❌",

            error:
                error.message

        });

    }

});


// =========================================================
// API 404 HANDLER
// =========================================================

app.use((req, res) => {

    console.log(
        "❌ 404:",
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
// GLOBAL ERROR HANDLER
// =========================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "❌ SERVER ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Internal server error",

            error:
                error.message

        });

    }
);


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
            "       ANDRITZ 2.0 BACKEND"
        );

        console.log(
            "========================================"
        );

        console.log(
            "Server: Hostinger"
        );

        console.log(
            "Port:",
            PORT
        );

        console.log(
            "Environment:",
            process.env.NODE_ENV || "production"
        );

        console.log(
            "----------------------------------------"
        );

        console.log(
            "ROLE API:"
        );

        console.log(
            "GET/POST/DELETE /api/roles"
        );

        console.log(
            "----------------------------------------"
        );

        console.log(
            "ROLE MANAGEMENT:"
        );

        console.log(
            "GET/POST /api/role-management"
        );

        console.log(
            "----------------------------------------"
        );

        console.log(
            "ADMIN API:"
        );

        console.log(
            "GET/POST /api/admins"
        );

        console.log(
            "----------------------------------------"
        );

        console.log(
            "USER API:"
        );

        console.log(
            "GET/POST /api/users"
        );

        console.log(
            "----------------------------------------"
        );

        console.log(
            "LOGIN API:"
        );

        console.log(
            "POST /api/login"
        );

        console.log(
            "----------------------------------------"
        );

        console.log(
            "SERVER STARTED SUCCESSFULLY 🚀"
        );

        console.log(
            "========================================"
        );

    }
);

app.get("/api/role-management-test", (req, res) => {

    res.json({
        success: true,
        message: "Role Management route is LIVE on Hostinger 🚀"
    });

});