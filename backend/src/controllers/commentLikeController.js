const commentLikeService = require('../services/commentLikeService');

const toggleLike = async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId);
        const userId = req.user.id;

        if (isNaN(commentId)) {
            return res.status(400).json({ success: false, message: "Invalid Comment ID format." });
        }

        const result = await commentLikeService.toggleLike(commentId, userId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getUsersWhoLiked = async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        if (isNaN(commentId)) {
            return res.status(400).json({ success: false, message: "Invalid Comment ID format." });
        }

        const result = await commentLikeService.getUsersWhoLiked(commentId, page, limit);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const checkUserLiked = async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId);
        const userId = req.user.id;

        if (isNaN(commentId)) {
            return res.status(400).json({ success: false, message: "Invalid Comment ID format." });
        }

        const result = await commentLikeService.checkUserLiked(commentId, userId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getLikeCount = async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId);

        if (isNaN(commentId)) {
            return res.status(400).json({ success: false, message: "Invalid Comment ID format." });
        }

        const result = await commentLikeService.getLikeCount(commentId);
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

