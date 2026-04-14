const commentService = require('../services/commentService');

const getCommentsByPostId = async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const currentUserId = req.user?.id || null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID format." });
        }

        const result = await commentService.getCommentsByPostId(postId, currentUserId, page, limit);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const createComment = async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const userId = req.user.id;

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID format." });
        }

        if (!req.body.Content) {
            return res.status(400).json({ success: false, message: "Content is required." });
        }

        const result = await commentService.createComment(postId, userId, req.body);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const updateComment = async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);
        const userId = req.user.id;

        if (isNaN(commentId)) {
            return res.status(400).json({ success: false, message: "Invalid Comment ID format." });
        }

        if (!req.body.Content) {
            return res.status(400).json({ success: false, message: "Content is required." });
        }

        const result = await commentService.updateComment(commentId, userId, req.body);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const deleteComment = async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);
        const userId = req.user.id;

        if (isNaN(commentId)) {
            return res.status(400).json({ success: false, message: "Invalid Comment ID format." });
        }

        const result = await commentService.deleteComment(commentId, userId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getReplies = async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);
        const currentUserId = req.user?.id || null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        if (isNaN(commentId)) {
            return res.status(400).json({ success: false, message: "Invalid Comment ID format." });
        }

        const result = await commentService.getReplies(commentId, currentUserId, page, limit);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    getCommentsByPostId,
    createComment,
    updateComment,
    deleteComment,
    getReplies
};

