const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const { verifyToken } = require('../middlewares/authMiddleware');

// =============================================
// REVIEWS ROUTES
// =============================================

// POST /api/reviews - Create a new review
router.post('/', verifyToken, reviewsController.createReview);

// GET /api/reviews/my - Get current user's reviews
router.get('/my', verifyToken, reviewsController.getMyReviews);

// GET /api/reviews/service/:serviceId - Get reviews by service ID
router.get('/service/:serviceId', reviewsController.getReviewsByServiceId);

// GET /api/reviews/service/:serviceId/stats - Get service statistics (average rating, etc.)
router.get('/service/:serviceId/stats', reviewsController.getServiceStats);

// GET /api/reviews/provider/:providerId/average - Get provider average rating
router.get('/provider/:providerId/average', reviewsController.getProviderAverageRating);

// GET /api/reviews/user/:userId - Get reviews by user ID
router.get('/user/:userId', reviewsController.getReviewsByUserId);

// GET /api/reviews/:reviewId - Get review by ID
router.get('/:reviewId', reviewsController.getReviewById);

// PUT /api/reviews/:reviewId - Update review (only owner)
router.put('/:reviewId', verifyToken, reviewsController.updateReview);

// DELETE /api/reviews/:reviewId - Delete review (only owner)
router.delete('/:reviewId', verifyToken, reviewsController.deleteReview);

module.exports = router;

