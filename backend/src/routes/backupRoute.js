const express = require("express");
const { backupDatabase, restoreDatabase, getBackupFiles } = require("../controllers/backupController");
const { verifyToken, authorize } = require("../middlewares/authMiddleware");
const ROLES = require("../config/roles");

const router = express.Router();

// Routes for backup and restore (admin only)
router.post("/backup", verifyToken, authorize([ROLES.ADMIN]), backupDatabase);
router.post("/restore", verifyToken, authorize([ROLES.ADMIN]), restoreDatabase);
router.get("/backups", verifyToken, authorize([ROLES.ADMIN]), getBackupFiles);

module.exports = router;