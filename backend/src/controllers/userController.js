const userService = require("../services/userService");

const getProfile = async (req, res) => {
    try {
        const id = req.user.id;
        const result = await userService.getUserById(Number(id));
        if (!result.success) {
            return res.status(result.code || 400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(result.code || 200).json({
            success: true,
            message: result.message,
            user: result.data
        });
    } catch (error) {
        console.error("[GetProfile Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

const getUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await userService.getUserById(Number(id));
        if (!result.success) {
            return res.status(result.code || 400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(result.code || 200).json({
            success: true,
            message: result.message,
            user: result.data
        });
    } catch (error) {
        console.error("[GetProfile Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { FullName, PhoneNumber, ProfilePictureUrl, Bio } = req.body;
        if (!FullName && !PhoneNumber && !ProfilePictureUrl && !Bio) {
            return res.status(400).json({ success: false, message: "No data to update" });
        }
        const result = await userService.updateUserById(userId, FullName, PhoneNumber, ProfilePictureUrl, Bio);
        if (!result.success) {
            return res.status(result.code || 400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(result.code || 200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error("[UpdateProfile Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Old password and new password are required."
            });
        }

        const result = await userService.changePassword({ userId, oldPassword, newPassword });

        if (!result.success) {
            return res.status(result.code || 400).json({
                success: false,
                message: result.message,
            });
        }

        return res.status(result.code || 200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error("[ChangePassword Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during password change.",
        });
    }
}

const followUser = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.id);

        if (isNaN(followingId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID." });
        }

        const result = await userService.followUser({ followerId, followingId });

        if (!result.success) {
            return res.status(result.code || 400).json({
                success: false,
                message: result.message,
            });
        }

        return res.status(result.code || 200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error("[FollowUser Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during follow operation.",
        });
    }
}

const unfollowUser = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.id);

        if (isNaN(followingId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID." });
        }

        const result = await userService.unfollowUser({ followerId, followingId });

        if (!result.success) {
            return res.status(result.code || 400).json({
                success: false,
                message: result.message,
            });
        }

        return res.status(result.code || 200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error("[UnfollowUser Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during unfollow operation.",
        });
    }
}

const getFollowers = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID." });
        }

        const result = await userService.getFollowers(userId, page, limit);

        if (!result.success) {
            return res.status(result.code || 400).json({
                success: false,
                message: result.message,
            });
        }

        return res.status(result.code || 200).json(result);
    } catch (error) {
        console.error("[GetFollowers Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const getFollowing = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID." });
        }

        const result = await userService.getFollowing(userId, page, limit);

        if (!result.success) {
            return res.status(result.code || 400).json({
                success: false,
                message: result.message,
            });
        }

        return res.status(result.code || 200).json(result);
    } catch (error) {
        console.error("[GetFollowing Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const checkFollowStatus = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.id);

        if (isNaN(followingId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID." });
        }

        const result = await userService.checkFollowStatus(followerId, followingId);

        if (!result.success) {
            return res.status(result.code || 400).json({
                success: false,
                message: result.message,
            });
        }

        return res.status(result.code || 200).json(result);
    } catch (error) {
        console.error("[CheckFollowStatus Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    getProfile,
    getUserById,
    updateProfile,
    changePassword,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkFollowStatus
}