const { sql, poolPromise } = require('../config/dbConfig');

// Get accommodation by Service ID
const getByServiceId = async (serviceId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAccommodations_GetByServiceId");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Accommodation not found." };
        }

        const accommodation = result.recordset?.[0];

        return {
            success: true,
            code: 200,
            data: accommodation,
            message: "Accommodation retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Get all accommodations with filters
const getAll = async (options = {}) => {
    try {
        const pool = await poolPromise;
        const { 
            accommodationType, 
            minStarRating, 
            maxStarRating, 
            city, 
            searchKeyword, 
            page = 1, 
            limit = 20 
        } = options;

        const request = pool.request()
            .input("AccommodationType", sql.NVarChar(50), accommodationType || null)
            .input("MinStarRating", sql.Int, minStarRating || null)
            .input("MaxStarRating", sql.Int, maxStarRating || null)
            .input("City", sql.NVarChar(100), city || null)
            .input("SearchKeyword", sql.NVarChar(200), searchKeyword || null)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAccommodations_GetAll");
        const code = result.output.Result;

        if (code !== 1) {
            return { success: false, code: 500, message: "Database error." };
        }

        const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
        const accommodations = result.recordsets[1] || [];

        return {
            success: true,
            code: 200,
            data: {
                accommodations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit) || 0
                }
            },
            message: "Accommodations retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Create accommodation
const create = async (data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ServiceId", sql.Int, data.ServiceId)
            .input("AccommodationType", sql.NVarChar(50), data.AccommodationType)
            .input("StarRating", sql.Int, data.StarRating || null)
            .input("Amenities", sql.NVarChar(sql.MAX), data.Amenities || null)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAccommodations_Create");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Service not found." };
        }
        if (code === -2) {
            return { success: false, code: 409, message: "Accommodation already exists for this service." };
        }
        if (code === -3) {
            return { success: false, code: 400, message: "Star rating must be between 1 and 5." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Database error during creation." };
        }

        const accommodation = result.recordset?.[0];

        return {
            success: true,
            code: 201,
            data: accommodation,
            message: "Accommodation created successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Update accommodation
const update = async (serviceId, data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .input("AccommodationType", sql.NVarChar(50), data.AccommodationType || null)
            .input("StarRating", sql.Int, data.StarRating !== undefined ? data.StarRating : null)
            .input("Amenities", sql.NVarChar(sql.MAX), data.Amenities || null)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAccommodations_Update");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Accommodation not found." };
        }
        if (code === -2) {
            return { success: false, code: 400, message: "Star rating must be between 1 and 5." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Database error during update." };
        }

        const accommodation = result.recordset?.[0];

        return {
            success: true,
            code: 200,
            data: accommodation,
            message: "Accommodation updated successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Delete accommodation
const deleteAccommodation = async (serviceId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAccommodations_Delete");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Accommodation not found." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Database error during deletion." };
        }

        return {
            success: true,
            code: 200,
            message: "Accommodation deleted successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Search by amenities
const searchByAmenities = async (amenityKeywords, page = 1, limit = 20) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("AmenityKeywords", sql.NVarChar(500), amenityKeywords)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAccommodations_SearchByAmenities");
        const code = result.output.Result;

        if (code !== 1) {
            return { success: false, code: 500, message: "Database error." };
        }

        const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
        const accommodations = result.recordsets[1] || [];

        return {
            success: true,
            code: 200,
            data: {
                accommodations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit) || 0
                }
            },
            message: "Search completed successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Get accommodation types
const getTypes = async () => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAccommodations_GetTypes");
        const code = result.output.Result;

        if (code !== 1) {
            return { success: false, code: 500, message: "Database error." };
        }

        const types = result.recordset || [];

        return {
            success: true,
            code: 200,
            data: types,
            message: "Accommodation types retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Get accommodations by provider
const getByProvider = async (providerId, page = 1, limit = 20) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ProviderId", sql.Int, providerId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAccommodations_GetByProvider");
        const code = result.output.Result;

        if (code !== 1) {
            return { success: false, code: 500, message: "Database error." };
        }

        const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
        const accommodations = result.recordsets[1] || [];

        return {
            success: true,
            code: 200,
            data: {
                accommodations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit) || 0
                }
            },
            message: "Accommodations retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
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

