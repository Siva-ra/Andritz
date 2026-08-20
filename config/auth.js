const crypto = require("crypto");
const db = require("./db");


// =========================================================
// CREATE LOGIN SESSION
// =========================================================

async function createSession(email, accountType) {

    const token = crypto.randomBytes(32).toString("hex");

    await db.query(
        `INSERT INTO sessions
        (token, email, account_type, expires_at)
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
        [
            token,
            email,
            accountType
        ]
    );

    return token;
}


// =========================================================
// GET CURRENT SESSION
// =========================================================

async function getSession(req) {

    const authorization =
        req.headers.authorization;

    if (!authorization) {
        return null;
    }

    if (!authorization.startsWith("Bearer ")) {
        return null;
    }

    const token =
        authorization.substring(7);

    if (!token) {
        return null;
    }

    const [rows] = await db.query(
        `SELECT
            token,
            email,
            account_type,
            expires_at
         FROM sessions
         WHERE token = ?
         AND expires_at > NOW()
         LIMIT 1`,
        [token]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
}


// =========================================================
// REQUIRE SUPER ADMIN
// =========================================================

async function requireSuperAdmin(req, res) {

    const session =
        await getSession(req);

    if (!session) {

        res.status(401).json({
            success: false,
            message: "Login required"
        });

        return null;
    }


    if (
        session.account_type !== "super_admin" ||
        session.email.toLowerCase() !==
        process.env.SUPER_ADMIN_EMAIL.toLowerCase()
    ) {

        res.status(403).json({
            success: false,
            message: "Super Admin access required"
        });

        return null;
    }


    return session;
}


module.exports = {
    createSession,
    getSession,
    requireSuperAdmin
};