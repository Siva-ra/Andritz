const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const roleRoutes = require("./routes/roleRoutes");

const app = express();


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());

app.use(express.json());


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

        const [result] =
            await db.query(
                "SELECT 1 AS test"
            );


        res.json({
            success: true,
            message: "MySQL connected successfully ✅",
            result
        });


    } catch (error) {

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
// ROLE ROUTES
// =========================================================

app.use(
    "/roles",
    roleRoutes
);


// =========================================================
// 404 HANDLER
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

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `✅Server running on port ${PORT}`
        );

    }
);