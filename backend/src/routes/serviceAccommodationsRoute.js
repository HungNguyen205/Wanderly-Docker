const express = require('express');
const router = express.Router();
const serviceAccommodationsController = require('../controllers/serviceAccommodationsController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Public routes
// GET /api/service-accommodations - Get all accommodations with filters
router.get('/', serviceAccommodationsController.getAll);

// GET /api/service-accommodations/types - Get accommodation types
router.get('/types', serviceAccommodationsController.getTypes);

// GET /api/service-accommodations/search - Search by amenities
router.get('/search', serviceAccommodationsController.searchByAmenities);

// GET /api/service-accommodations/provider/:providerId - Get accommodations by provider
router.get('/provider/:providerId', serviceAccommodationsController.getByProvider);

// GET /api/service-accommodations/service/:serviceId - Get accommodation by service ID
router.get('/service/:serviceId', serviceAccommodationsController.getByServiceId);

// Protected routes (require authentication)
// POST /api/service-accommodations - Create accommodation
router.post('/', verifyToken, serviceAccommodationsController.create);

// PUT /api/service-accommodations/service/:serviceId - Update accommodation
router.put('/service/:serviceId', verifyToken, serviceAccommodationsController.update);

// DELETE /api/service-accommodations/service/:serviceId - Delete accommodation
router.delete('/service/:serviceId', verifyToken, serviceAccommodationsController.deleteAccommodation);

module.exports = router;

