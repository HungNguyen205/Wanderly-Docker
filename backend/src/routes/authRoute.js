const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/admin/login", authController.adminLogin);
router.post("/forgot-password", verifyToken, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
module.exports = router;