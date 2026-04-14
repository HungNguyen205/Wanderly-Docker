const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/profile", verifyToken, userController.getProfile);
router.get("/:id", userController.getUserById);
router.put("/profile", verifyToken, userController.updateProfile);
router.put("/me/password", verifyToken, userController.changePassword)
router.post("/:id/follow", verifyToken, userController.followUser)
router.delete("/:id/follow", verifyToken, userController.unfollowUser)
router.get("/:id/followers", userController.getFollowers)
router.get("/:id/following", userController.getFollowing)
router.get("/:id/follow-status", verifyToken, userController.checkFollowStatus)
module.exports = router;