const { sql, poolPromise } = require('../config/dbConfig');

// =============================================
// REVIEWS SERVICE
// =============================================

// Create a new review
const createReview = async (userId, serviceId, rating, title = null, comment = null) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("UserId", sql.Int, userId)
            .input("ServiceId", sql.Int, serviceId)
            .input("Rating", sql.Int, rating)
            .input("Title", sql.NVarChar(200), title)
            .input("Comment", sql.NVarChar(sql.MAX), comment)
            .output("NewReviewId", sql.Int)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Reviews_Create");
        const code = result.output.Result;

        const errorMessages = {
            "-1": "User not found.",
            "-2": "Service not found.",
            "-3": "Invalid rating. Rating must be between 1 and 5.",
            "-4": "You have already reviewed this service.",
            "-5": "You must book and use this service before you can review it.",
            "-99": "System error."
        };

        if (code !== 1) {
            return {
                success: false,
                code: code === -1 || code === -2 ? 404 : code === -3 || code === -4 || code === -5 ? 400 : 500,
                message: errorMessages[code.toString()] || "Failed to create review."
            };
        }

        return {
            success: true,
            code: 201,
            message: "Review created successfully.",
            data: {
                reviewId: result.output.NewReviewId
            }
        };
    } catch (error) {
        console.error("Error creating review:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Get review by ID
const getReviewById = async (reviewId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ReviewId", sql.Int, reviewId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Reviews_GetById");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Review not found." };
        }

        return {
            success: true,
            code: 200,
            data: {
                review: result.recordset[0] || null
            }
        };
    } catch (error) {
        console.error("Error getting review:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Get reviews by ServiceId with pagination
const getReviewsByServiceId = async (serviceId, options = {}) => {
    try {
        const pool = await poolPromise;
        const { page = 1, limit = 10 } = options;

        const request = pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Reviews_GetByServiceId");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Service not found." };
        }

        const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
        const reviews = result.recordsets[1] || [];

        return {
            success: true,
            code: 200,
            data: {
                reviews,
                pagination: {
                    total: totalCount,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalCount / limit)
                }
            }
        };
    } catch (error) {
        console.error("Error getting reviews by service:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Get reviews by UserId with pagination
const getReviewsByUserId = async (userId, options = {}) => {
    try {
        const pool = await poolPromise;
        const { page = 1, limit = 10 } = options;

        const request = pool.request()
            .input("UserId", sql.Int, userId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Reviews_GetByUserId");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "User not found." };
        }

        const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
        const reviews = result.recordsets[1] || [];

        return {
            success: true,
            code: 200,
            data: {
                reviews,
                pagination: {
                    total: totalCount,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalCount / limit)
                }
            }
        };
    } catch (error) {
        console.error("Error getting reviews by user:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Update review
const updateReview = async (reviewId, userId, rating = null, title = null, comment = null) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ReviewId", sql.Int, reviewId)
            .input("UserId", sql.Int, userId)
            .input("Rating", sql.Int, rating)
            .input("Title", sql.NVarChar(200), title)
            .input("Comment", sql.NVarChar(sql.MAX), comment)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Reviews_Update");
        const code = result.output.Result;

        const errorMessages = {
            "-1": "Review not found or you don't have permission to update it.",
            "-2": "Invalid rating. Rating must be between 1 and 5.",
            "-99": "System error."
        };

        if (code !== 1) {
            return {
                success: false,
                code: code === -1 ? 404 : code === -2 ? 400 : 500,
                message: errorMessages[code.toString()] || "Failed to update review."
            };
        }

        return {
            success: true,
            code: 200,
            message: "Review updated successfully."
        };
    } catch (error) {
        console.error("Error updating review:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Delete review (soft delete)
const deleteReview = async (reviewId, userId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ReviewId", sql.Int, reviewId)
            .input("UserId", sql.Int, userId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Reviews_Delete");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Review not found or you don't have permission to delete it." };
        }
        if (code === -99) {
            return { success: false, code: 500, message: "System error." };
        }

        return {
            success: true,
            code: 200,
            message: "Review deleted successfully."
        };
    } catch (error) {
        console.error("Error deleting review:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Get service statistics (average rating, total reviews, etc.)
const getServiceStats = async (serviceId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Reviews_GetServiceStats");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Service not found." };
        }

        return {
            success: true,
            code: 200,
            data: {
                stats: result.recordset[0] || null
            }
        };
    } catch (error) {
        console.error("Error getting service stats:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Get provider average rating
const getProviderAverageRating = async (providerId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ProviderId", sql.Int, providerId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Reviews_GetProviderAverageRating");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Provider not found." };
        }

        return {
            success: true,
            code: 200,
            data: {
                stats: result.recordset[0] || null
            }
        };
    } catch (error) {
        console.error("Error getting provider average rating:", error);
        return { success: false, code: 500, message: error.message };
    }
};

module.exports = {
    createReview,
    getReviewById,
    getReviewsByServiceId,
    getReviewsByUserId,
    updateReview,
    deleteReview,
    getServiceStats,
    getProviderAverageRating
};

