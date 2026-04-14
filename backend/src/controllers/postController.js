const postService = require('../services/postService');

const getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const keyword = req.query.keyword || null;
        const tagId = req.query.tagId ? parseInt(req.query.tagId) : null;
        const currentUserId = req.user?.id || null; // Lấy userId từ token nếu có

        const result = await postService.getPosts(page, limit, keyword, tagId, currentUserId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getPostById = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID format." });
        }

        const result = await postService.getPostById(postId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const createPost = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.body.Title || !req.body.Content) {
            return res.status(400).json({ success: false, message: "Title and Content are required." });
        }

        const result = await postService.createPost(userId, req.body);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const updatePost = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID format." });
        }

        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, message: "No fields provided for update." });
        }

        const result = await postService.updatePost(postId, userId, req.body);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const deletePost = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: "Invalid Post ID format." });
        }

        const result = await postService.deletePost(postId, userId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getPostsByUserId = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const currentUserId = req.user?.id || null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const includeDrafts = req.query.includeDrafts === 'true';

        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID format." });
        }

        const result = await postService.getPostsByUserId(userId, currentUserId, page, limit, includeDrafts);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getDraftsByUserId = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await postService.getDraftsByUserId(userId, page, limit);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    getPostsByUserId,
    getDraftsByUserId
};