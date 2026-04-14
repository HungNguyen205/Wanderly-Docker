const serviceAccommodationsService = require('../services/serviceAccommodationsService');

// Get accommodation by Service ID
const getByServiceId = async (req, res) => {
    try {
        const { serviceId } = req.params;

        const result = await serviceAccommodationsService.getByServiceId(parseInt(serviceId));

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Get all accommodations with filters
const getAll = async (req, res) => {
    try {
        const { 
            type, 
            minRating, 
            maxRating, 
            city, 
            search, 
            page, 
            limit 
        } = req.query;

        const result = await serviceAccommodationsService.getAll({
            accommodationType: type || null,
            minStarRating: minRating ? parseInt(minRating) : null,
            maxStarRating: maxRating ? parseInt(maxRating) : null,
            city: city || null,
            searchKeyword: search || null,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20
        });

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Create accommodation
const create = async (req, res) => {
    try {
        const data = req.body;

        // Validation
        if (!data.ServiceId || !data.AccommodationType) {
            return res.status(400).json({
                success: false,
                message: "ServiceId and AccommodationType are required."
            });
        }

        // Validate star rating if provided
        if (data.StarRating && (data.StarRating < 1 || data.StarRating > 5)) {
            return res.status(400).json({
                success: false,
                message: "Star rating must be between 1 and 5."
            });
        }

        const result = await serviceAccommodationsService.create(data);

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Update accommodation
const update = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const data = req.body;

        // Validate star rating if provided
        if (data.StarRating && (data.StarRating < 1 || data.StarRating > 5)) {
            return res.status(400).json({
                success: false,
                message: "Star rating must be between 1 and 5."
            });
        }

        const result = await serviceAccommodationsService.update(parseInt(serviceId), data);

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Delete accommodation
const deleteAccommodation = async (req, res) => {
    try {
        const { serviceId } = req.params;

        const result = await serviceAccommodationsService.deleteAccommodation(parseInt(serviceId));

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Search by amenities
const searchByAmenities = async (req, res) => {
    try {
        const { keywords, page, limit } = req.query;

        if (!keywords) {
            return res.status(400).json({
                success: false,
                message: "Keywords parameter is required."
            });
        }

        const result = await serviceAccommodationsService.searchByAmenities(
            keywords,
            parseInt(page) || 1,
            parseInt(limit) || 20
        );

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Get accommodation types
const getTypes = async (req, res) => {
    try {
        const result = await serviceAccommodationsService.getTypes();

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Get accommodations by provider
const getByProvider = async (req, res) => {
    try {
        const { providerId } = req.params;
        const { page, limit } = req.query;

        const result = await serviceAccommodationsService.getByProvider(
            parseInt(providerId),
            parseInt(page) || 1,
            parseInt(limit) || 20
        );

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

module.exports = {
    getByServiceId,
    getAll,
    create,
    update,
    deleteAccommodation,
    searchByAmenities,
    getTypes,
    getByProvider
};

