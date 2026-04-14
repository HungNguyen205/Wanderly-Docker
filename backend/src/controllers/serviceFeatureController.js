const serviceFeatureService = require('../services/serviceFeatureService');

// ======================================================
// 1. GET FEATURES BY SERVICE ID (Public)
// ======================================================
const getFeaturesByServiceId = async (req, res) => {
    try {
        const serviceId = parseInt(req.params.serviceId);

        if (isNaN(serviceId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Service ID format."
            });
        }

        const result = await serviceFeatureService.getFeaturesByServiceId(serviceId);

        return res.status(result.code || 500).json(result);

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

module.exports = {
    getFeaturesByServiceId
};
