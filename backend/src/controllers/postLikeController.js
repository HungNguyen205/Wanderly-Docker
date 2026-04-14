const postLikeService = require('../services/postLikeService');

const toggleLike = async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const userId = req.user.id;

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID format." });
        }

        const result = await postLikeService.toggleLike(postId, userId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getUsersWhoLiked = async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID format." });
        }

        const result = await postLikeService.getUsersWhoLiked(postId, page, limit);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const checkUserLiked = async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const userId = req.user.id;

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID format." });
        }

        const result = await postLikeService.checkUserLiked(postId, userId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getLikeCount = async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID format." });
        }

        const result = await postLikeService.getLikeCount(postId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    toggleLike,
    getUsersWhoLiked,
    checkUserLiked,
    getLikeCount
};

