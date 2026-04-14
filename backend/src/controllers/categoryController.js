const categoryService = require('../services/categoryService');

const getAllCategories = async (req, res) => {
    try {
        const result = await categoryService.getAllCategories();
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);

        if (isNaN(categoryId)) {
            return res.status(400).json({ success: false, message: "Invalid Category ID format." });
        }

        const result = await categoryService.getCategoryById(categoryId);

        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const createCategory = async (req, res) => {
    try {
        if (!req.body.ServiceTypeName) {
            return res.status(400).json({ success: false, message: "Service type name is required." });
        }

        const result = await categoryService.createCategory(req.body);

        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const updateCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);

        if (isNaN(categoryId)) {
            return res.status(400).json({ success: false, message: "Invalid Category ID format." });
        }

        if (!req.body.ServiceTypeName && !req.body.Description) {
            return res.status(400).json({ success: false, message: "No fields provided for update." });
        }

        const result = await categoryService.updateCategory(categoryId, req.body);

        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);

        if (isNaN(categoryId)) {
            return res.status(400).json({ success: false, message: "Invalid Category ID format." });
        }

        const result = await categoryService.deleteCategory(categoryId);

        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};