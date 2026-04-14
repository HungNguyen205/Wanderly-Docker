const featureService = require('../services/featureService');

const getAllFeatures = async (req, res) => {
    try {
        const result = await featureService.getAllFeatures();
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getFeatureById = async (req, res) => {
    try {
        const featureId = parseInt(req.params.id);

        if (isNaN(featureId)) {
            return res.status(400).json({ success: false, message: "Invalid Feature ID format." });
        }

        const result = await featureService.getFeatureById(featureId);

        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const createFeature = async (req, res) => {
    try {
        if (!req.body.Name) {
            return res.status(400).json({ success: false, message: "Feature Name is required." });
        }

        const result = await featureService.createFeature(req.body);

        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const updateFeature = async (req, res) => {
    try {
        const featureId = parseInt(req.params.id);

        if (isNaN(featureId)) {
            return res.status(400).json({ success: false, message: "Invalid Feature ID format." });
        }

        if (!req.body.Name && !req.body.Description) {
            return res.status(400).json({ success: false, message: "No fields provided for update." });
        }

        const result = await featureService.updateFeature(featureId, req.body);

        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const deleteFeature = async (req, res) => {
    try {
        const featureId = parseInt(req.params.id);

        if (isNaN(featureId)) {
            return res.status(400).json({ success: false, message: "Invalid Feature ID format." });
        }

        const result = await featureService.deleteFeature(featureId);

        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    getAllFeatures,
    getFeatureById,
    createFeature,
    updateFeature,
    deleteFeature,
};