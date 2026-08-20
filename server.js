const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

// ================= ROUTES =================

const roleRoutes = require("./routes/roleRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const loginRoutes = require("./routes/loginRoutes");
const roleManagementRoutes = require("./routes/roleManagementRoutes");

// =========================================================
// APP
// =========================================================

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
// API ROUTES
// =========================================================

// Role Management
app.use("/api/roles", roleRoutes);

// Create Admin
app.use("/api/admins", adminRoutes);

// Create User
app.use("/api/users", userRoutes);

// Login
app.use("/api/login", loginRoutes);

// Role Management
app.use("/api/role-management", roleManagementRoutes);

// =========================================================
// HOME / SERVER TEST
// =========================================================

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "Andritz 2.0 Backend is running 🚀",

        server:
            "Hostinger",

        api:
            "/api"
    });

});


// =========================================================
// DATABASE TEST
// =========================================================

app.get("/test-db", async (req, res) => {

    try {

        const [result] =
            await db.query(
                "SELECT 1 AS test"
            );


        res.json({

            success: true,

            message:
                "MySQL connected successfully ✅",

            result

        });

    }
    catch (error) {

        console.error(
            "MySQL Error:",
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
// 404 API HANDLER
// =========================================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message:
            "API endpoint not found",

        path:
            req.originalUrl

    });

});


// =========================================================
// SERVER
// =========================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {

    console.log("=================================");
    console.log("ANDRITZ 2.0 BACKEND");
    console.log("=================================");
    console.log("PORT:", PORT);
    console.log("ENV:", process.env.NODE_ENV || "not set");
    console.log("ROLE API: /api/roles");
    console.log("ADMIN API: /api/admins");
    console.log("USER API: /api/users");
    console.log("LOGIN API: /api/login");
    console.log("ROLE MANAGEMENT API: /api/role-management");
    console.log("=================================");
    console.log("SERVER STARTED SUCCESSFULLY 🚀");

    }
);