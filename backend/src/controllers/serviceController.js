const serviceService = require('../services/serviceService');


// 1. GET LIST (Public)
const getServices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const keyword = req.query.keyword || null;
        const locationId = req.query.locationId || null;
        const categoryId = req.query.categoryId || null;

        const result = await serviceService.getServices(page, limit, keyword, locationId, categoryId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// 2. GET BY ID (Public)
const getServiceById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID format." });
        }

        const result = await serviceService.getServiceById(id);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const getServicesByOwnerUserId = async (req, res) => {
    try {
        const ownerUserId = parseInt(req.user.id)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const keyword = req.query.keyword || null;
        const locationId = req.query.locationId || null;
        const categoryId = req.query.categoryId || null;

        const result = await serviceService.getServicesByOwnerUserId(ownerUserId, page, limit, keyword, locationId, categoryId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};


// 3. CREATE (Provider Only)
const createService = async (req, res) => {
    try {
        const ownerUserId = parseInt(req.user.id);

        // Validation cơ bản
        if (!req.body.Name || !req.body.CategoryID || !req.body.LocationId) {
            return res.status(400).json({ success: false, message: "Name, CategoryID, and LocationId are required." });
        }

        const result = await serviceService.createService(ownerUserId, req.body);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const updateService = async (req, res) => {
    try {
        const serviceId = parseInt(req.params.id);
        const ownerUserId = parseInt(req.user.id);

        if (isNaN(serviceId)) {
            return res.status(400).json({ success: false, message: "Invalid ID format." });
        }

        // Validation: Phải có ít nhất 1 field để update
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, message: "No fields provided for update." });
        }

        const result = await serviceService.updateService(serviceId, ownerUserId, req.body);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error.", error });
    }
};

// 5. DELETE (Provider Only)
const deleteService = async (req, res) => {
    try {
        const serviceId = parseInt(req.params.id);
        const ownerUserId = parseInt(req.user.id);

        if (isNaN(serviceId)) {
            return res.status(400).json({ success: false, message: "Invalid ID format." });
        }

        const result = await serviceService.deleteService(serviceId, ownerUserId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error.", error });
    }
};

module.exports = {
    getServices,
    getServiceById,
    getServicesByOwnerUserId,
    createService,
    updateService,
    deleteService
};