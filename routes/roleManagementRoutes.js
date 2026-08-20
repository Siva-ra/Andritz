const express = require("express");
const router = express.Router();

const db = require("../config/db");


// =========================================================
// GET ALL ADMIN TYPES + ROLES
// =========================================================
// GET /api/role-management
// =========================================================

router.get("/", async (req, res) => {

    console.log("=================================");
    console.log("GET /api/role-management");
    console.log("=================================");

    try {

        const [rows] = await db.query(`
            SELECT
                a.id AS admin_type_id,
                a.admin_name,
                r.id AS role_id,
                r.role_name

            FROM admin_types a

            LEFT JOIN roles r
                ON r.admin_type_id = a.id

            ORDER BY
                a.id ASC,
                r.id ASC
        `);


        const adminTypes = {};


        rows.forEach(row => {

            if (!adminTypes[row.admin_type_id]) {

                adminTypes[row.admin_type_id] = {

                    id:
                        row.admin_type_id,

                    admin_name:
                        row.admin_name,

                    roles: []

                };

            }


            if (row.role_id) {

                adminTypes[row.admin_type_id].roles.push({

                    id:
                        row.role_id,

                    role_name:
                        row.role_name

                });

            }

        });


        const result =
            Object.values(adminTypes);


        console.log(
            "Admin Types:",
            result
        );


        res.status(200).json({

            success: true,

            adminTypes:
                result

        });

    }
    catch (error) {

        console.error(
            "GET ROLE MANAGEMENT ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to load role management data",

            error:
                error.message

        });

    }

});


// =========================================================
// SAVE ADMIN TYPE + ROLES
// =========================================================
// POST /api/role-management
// =========================================================

router.post("/", async (req, res) => {

    let connection;


    try {

        const {
            adminName,
            roles
        } = req.body;


        console.log("=================================");
        console.log("POST /api/role-management");
        console.log("Admin Name:", adminName);
        console.log("Roles:", roles);
        console.log("=================================");


        // =====================================================
        // VALIDATE ADMIN NAME
        // =====================================================

        if (
            typeof adminName !== "string" ||
            !adminName.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Admin name is required"

            });

        }


        // =====================================================
        // VALIDATE ROLES
        // =====================================================

        if (
            !Array.isArray(roles) ||
            roles.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "At least one role is required"

            });

        }


        // =====================================================
        // CLEAN DATA
        // =====================================================

        const cleanAdminName =
            adminName.trim();


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

                message:
                    "At least one valid role is required"

            });

        }


        // =====================================================
        // DATABASE CONNECTION
        // =====================================================

        connection =
            await db.getConnection();


        await connection.beginTransaction();


        // =====================================================
        // CHECK ADMIN TYPE
        // =====================================================

        const [existingAdmin] =
            await connection.query(
                `
                SELECT
                    id,
                    admin_name

                FROM admin_types

                WHERE admin_name = ?

                LIMIT 1
                `,
                [
                    cleanAdminName
                ]
            );


        let adminTypeId;


        // =====================================================
        // CREATE ADMIN TYPE
        // =====================================================

        if (existingAdmin.length === 0) {

            const [adminResult] =
                await connection.query(
                    `
                    INSERT INTO admin_types
                    (
                        admin_name
                    )

                    VALUES (?)
                    `,
                    [
                        cleanAdminName
                    ]
                );


            adminTypeId =
                adminResult.insertId;


            console.log(
                "Created Admin Type:",
                adminTypeId
            );

        }

        // =====================================================
        // USE EXISTING ADMIN TYPE
        // =====================================================

        else {

            adminTypeId =
                existingAdmin[0].id;


            console.log(
                "Existing Admin Type:",
                adminTypeId
            );

        }


        // =====================================================
        // INSERT ROLES
        // =====================================================

        const addedRoles = [];


        for (
            const roleName
            of cleanRoles
        ) {

            const [existingRole] =
                await connection.query(
                    `
                    SELECT
                        id

                    FROM roles

                    WHERE admin_type_id = ?

                    AND role_name = ?

                    LIMIT 1
                    `,
                    [
                        adminTypeId,
                        roleName
                    ]
                );


            if (
                existingRole.length === 0
            ) {

                await connection.query(
                    `
                    INSERT INTO roles
                    (
                        admin_type_id,
                        role_name
                    )

                    VALUES (?, ?)
                    `,
                    [
                        adminTypeId,
                        roleName
                    ]
                );


                addedRoles.push(
                    roleName
                );

            }

        }


        // =====================================================
        // COMMIT
        // =====================================================

        await connection.commit();


        console.log(
            "Admin Type Saved:",
            cleanAdminName
        );

        console.log(
            "Roles Added:",
            addedRoles
        );


        // =====================================================
        // SUCCESS RESPONSE
        // =====================================================

        res.status(200).json({

            success: true,

            message:
                "Admin and roles saved successfully",

            admin: {

                id:
                    adminTypeId,

                admin_name:
                    cleanAdminName,

                roles:
                    cleanRoles

            },

            addedRoles:
                addedRoles

        });

    }
    catch (error) {

        console.error(
            "POST ROLE MANAGEMENT ERROR:",
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
                "Failed to save admin and roles",

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


module.exports = router;