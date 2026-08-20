const express = require("express");

const router = express.Router();

const roleController = require("../controllers/roleController");


// GET all roles
router.get("/", roleController.getRoles);


// ADD role
router.post("/", roleController.addRole);


// DELETE role
router.delete("/:id", roleController.deleteRole);


module.exports = router;