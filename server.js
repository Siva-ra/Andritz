const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

const roleManagementRoutes =
    require("./routes/roleManagementRoutes");

const adminRoutes =
    require("./routes/adminRoutes");

const userRoutes =
    require("./routes/userRoutes");

const loginRoutes =
    require("./routes/loginRoutes");


const app = express();


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());

app.use(express.json());


// =========================================================
// ROOT
// =========================================================

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "Andritz 2.0 Backend is running 🚀"
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
// API ROUTES
// =========================================================

app.use(
    "/api/role-management",
    roleManagementRoutes
);


app.use(
    "/api/admins",
    adminRoutes
);


app.use(
    "/api/users",
    userRoutes
);


app.use(
    "/api/login",
    loginRoutes
);


// =========================================================
// 404
// =========================================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message:
            "API route not found",

        path:
            req.originalUrl
    });
});


// =========================================================
// SERVER
// =========================================================

const PORT =
    process.env.PORT || 5000;


app.listen(PORT, () => {

    console.log(
        `Andritz 2.0 Backend running on port ${PORT}`
    );

});