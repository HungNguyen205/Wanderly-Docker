const reviewsService = require('../services/reviewsService');

// =============================================
// REVIEWS CONTROLLER
// =============================================

// Create a new review
const createReview = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const { serviceId, rating, title, comment } = req.body;

        if (!serviceId || !rating) {
            return res.status(400).json({ success: false, message: "serviceId and rating are required." });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
        }

        const result = await reviewsService.createReview(userId, serviceId, rating, title, comment);
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - createReview:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get review by ID
const getReviewById = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const result = await reviewsService.getReviewById(parseInt(reviewId));
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getReviewById:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get reviews by ServiceId
const getReviewsByServiceId = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const result = await reviewsService.getReviewsByServiceId(parseInt(serviceId), {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getReviewsByServiceId:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get reviews by UserId
const getReviewsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const result = await reviewsService.getReviewsByUserId(parseInt(userId), {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getReviewsByUserId:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get my reviews (current user)
const getMyReviews = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const { page = 1, limit = 10 } = req.query;

        const result = await reviewsService.getReviewsByUserId(userId, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getMyReviews:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update review
const updateReview = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const { reviewId } = req.params;
        const { rating, title, comment } = req.body;

        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
        }

        const result = await reviewsService.updateReview(
            parseInt(reviewId),
            userId,
            rating,
            title,
            comment
        );

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - updateReview:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Delete review
const deleteReview = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const { reviewId } = req.params;
        const result = await reviewsService.deleteReview(parseInt(reviewId), userId);

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - deleteReview:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get service statistics
const getServiceStats = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const result = await reviewsService.getServiceStats(parseInt(serviceId));
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getServiceStats:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get provider average rating
const getProviderAverageRating = async (req, res) => {
    try {
        const { providerId } = req.params;
        const result = await reviewsService.getProviderAverageRating(parseInt(providerId));
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getProviderAverageRating:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createReview,
    getReviewById,
    getReviewsByServiceId,
    getReviewsByUserId,
    getMyReviews,
    updateReview,
    deleteReview,
    getServiceStats,
    getProviderAverageRating
};

