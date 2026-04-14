const locationService = require('../services/locationService');

const getLocations = async (req, res) => {
    try {
        const pageNumber = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const keyword = req.query.keyword;
        const city = req.query.city;

        if (pageNumber < 1 || pageSize < 1) {
            return res.status(400).json({ success: false, message: "Page and limit must be positive integers." });
        }

        const result = await locationService.getLocations({ pageNumber, pageSize, keyword, city });

        return res.status(result.code || 500).json(result);

    } catch (error) {
        console.error("[GetLocations Controller] Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error during locations retrieval." });
    }
}

const getLocationById = async (req, res) => {
    try {
        const locationId = parseInt(req.params.id);

        if (isNaN(locationId)) {
            return res.status(400).json({ success: false, message: "Invalid Location ID format." });
        }

        const result = await locationService.getLocationById(locationId);

        return res.status(result.code || 500).json(result);

    } catch (error) {
        console.error("[GetLocationById Controller] Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}

const createLocation = async (req, res) => {
    try {
        const locationData = req.body;

        // Normalize / validate latitude & longitude to avoid SQL decimal overflow
        const latitude = Number(locationData.Latitude ?? locationData.latitude);
        const longitude = Number(locationData.Longitude ?? locationData.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return res.status(400).json({ success: false, message: "Latitude and Longitude must be numbers." });
        }

        const normalizedData = {
            ...locationData,
            Latitude: latitude,
            Longitude: longitude,
            Name: locationData.Name ?? locationData.name,
            Address: locationData.Address ?? locationData.address,
            City: locationData.City ?? locationData.city,
            Country: locationData.Country ?? locationData.country,
            Description: locationData.Description ?? locationData.description ?? "",
            ImageUrl: locationData.ImageUrl ?? locationData.imageUrl ?? "",
        };

        const result = await locationService.createLocation(normalizedData);

        return res.status(result.code || 500).json(result);

    } catch (error) {
        console.error("[CreateLocation Controller] Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}

const updateLocation = async (req, res) => {
    try {
        const locationId = parseInt(req.params.id);
        const locationData = req.body;

        if (isNaN(locationId)) {
            return res.status(400).json({ success: false, message: "Invalid Location ID format." });
        }


        // Normalize / validate latitude & longitude to avoid SQL decimal overflow
        const latitude = Number(locationData.Latitude ?? locationData.latitude);
        const longitude = Number(locationData.Longitude ?? locationData.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return res.status(400).json({ success: false, message: "Latitude and Longitude must be numbers." });
        }

        const normalizedData = {
            ...locationData,
            Latitude: latitude,
            Longitude: longitude,
            Name: locationData.Name ?? locationData.name,
            Address: locationData.Address ?? locationData.address,
            City: locationData.City ?? locationData.city,
            Country: locationData.Country ?? locationData.country,
            Description: locationData.Description ?? locationData.description ?? "",
            ImageUrl: locationData.ImageUrl ?? locationData.imageUrl ?? "",
        };

        const result = await locationService.updateLocation(locationId, normalizedData);

        return res.status(result.code || 500).json(result);

    } catch (error) {
        console.error("[UpdateLocation Controller] Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}

const deleteLocation = async (req, res) => {
    try {
        const locationId = parseInt(req.params.id);

        if (isNaN(locationId)) {
            return res.status(400).json({ success: false, message: "Invalid Location ID format." });
        }

        const result = await locationService.deleteLocation(locationId);

        return res.status(result.code || 500).json(result);

    } catch (error) {
        console.error("[DeleteLocation Controller] Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}

module.exports = {
    getLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation
};