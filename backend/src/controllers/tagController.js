const tagService = require('../services/tagService');

const getAllTags = async (req, res) => {
    try {
        const result = await tagService.getAllTags();
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getTagById = async (req, res) => {
    try {
        const tagId = parseInt(req.params.id);

        if (isNaN(tagId)) {
            return res.status(400).json({ success: false, message: "Invalid Tag ID format." });
        }

        const result = await tagService.getTagById(tagId);

        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const createTag = async (req, res) => {
    try {
        if (!req.body.TagName) {
            return res.status(400).json({ success: false, message: "TagName is required." });
        }

        const result = await tagService.createTag(req.body);

        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." + error });
    }
};

const updateTag = async (req, res) => {
    try {
        const tagId = parseInt(req.params.id);

        if (isNaN(tagId)) {
            return res.status(400).json({ success: false, message: "Invalid Tag ID format." });
        }

        if (!req.body.TagName) {
            return res.status(400).json({ success: false, message: "TagName is required for update." });
        }

        const result = await tagService.updateTag(tagId, req.body);

        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const deleteTag = async (req, res) => {
    try {
        const tagId = parseInt(req.params.id);

        if (isNaN(tagId)) {
            return res.status(400).json({ success: false, message: "Invalid Tag ID format." });
        }

        const result = await tagService.deleteTag(tagId);

        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    getAllTags,
    getTagById,
    createTag,
    updateTag,
    deleteTag,
};