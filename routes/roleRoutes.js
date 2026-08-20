const express = require("express");

const router = express.Router();

const roleController =
    require("../controllers/roleController");


// =========================================================
// GET ALL ROLES
// GET /roles
// =========================================================

router.get(
    "/",
    roleController.getRoles
);


// =========================================================
// ADD ROLE
// POST /roles
// =========================================================

router.post(
    "/",
    roleController.addRole
);


// =========================================================
// DELETE ROLE
// DELETE /roles/:id
// =========================================================

router.delete(
    "/:id",
    roleController.deleteRole
);


module.exports = router;