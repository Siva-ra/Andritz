const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const roleRoutes = require("./routes/roleRoutes");

const app = express();


// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// ==================================================
// DATABASE
// ==================================================

app.locals.db = db;


// ==================================================
// HOME ROUTE
// ==================================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Andritz 2.0 Backend is running 🚀"
    });
});


// ==================================================
// ROLE ROUTES
// ==================================================

app.use("/api/roles", roleRoutes);


// ==================================================
// TEST MYSQL CONNECTION
// ==================================================

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


// ==================================================
// 404 ROUTE
// ==================================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "API route not found",
        path: req.originalUrl
    });

});


// ==================================================
// ERROR HANDLER
// ==================================================

app.use((error, req, res, next) => {

    console.error("Server Error:", error);

    res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
    });

});


// ==================================================
// START SERVER
// ==================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log("========================================");
    console.log("🚀 ANDRITZ 2.0 BACKEND");
    console.log("========================================");
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`Role API: /api/roles`);
    console.log(`Database test: /test-db`);
    console.log("========================================");

});