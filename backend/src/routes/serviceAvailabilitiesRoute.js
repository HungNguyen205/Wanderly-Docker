const express = require('express');
const router = express.Router();
const serviceAvailabilitiesController = require('../controllers/serviceAvailabilitiesController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Public routes
// GET /api/service-availabilities/service/:serviceId - Get availability by service ID
router.get('/service/:serviceId', serviceAvailabilitiesController.getByServiceId);

// GET /api/service-availabilities/service/:serviceId/check - Check availability for a date
router.get('/service/:serviceId/check', serviceAvailabilitiesController.checkAvailability);

// GET /api/service-availabilities/:id - Get availability by ID
router.get('/:id', serviceAvailabilitiesController.getById);

// Protected routes (require authentication)
// POST /api/service-availabilities - Create availability
router.post('/', verifyToken, serviceAvailabilitiesController.create);

// POST /api/service-availabilities/bulk - Bulk create availability
router.post('/bulk', verifyToken, serviceAvailabilitiesController.bulkCreate);

// PUT /api/service-availabilities/:id - Update availability
router.put('/:id', verifyToken, serviceAvailabilitiesController.update);

// DELETE /api/service-availabilities/:id - Delete availability
router.delete('/:id', verifyToken, serviceAvailabilitiesController.deleteAvailability);

// POST /api/service-availabilities/:id/book - Book units
router.post('/:id/book', verifyToken, serviceAvailabilitiesController.book);

// POST /api/service-availabilities/:id/cancel - Cancel booking
router.post('/:id/cancel', verifyToken, serviceAvailabilitiesController.cancelBooking);

module.exports = router;

