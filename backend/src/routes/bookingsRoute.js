const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');
const { verifyToken } = require('../middlewares/authMiddleware');

// =============================================
// BOOKINGS ROUTES
// =============================================

// POST /api/bookings - Create a new booking
router.post('/', verifyToken, bookingsController.createBooking);

// GET /api/bookings/my - Get current user's bookings
router.get('/my', verifyToken, bookingsController.getMyBookings);

// GET /api/bookings/user/:userId - Get bookings by user ID (admin)
router.get('/user/:userId', verifyToken, bookingsController.getBookingsByUser);

// GET /api/bookings/provider/:providerId/stats - Get provider statistics
router.get('/provider/:providerId/stats', verifyToken, bookingsController.getProviderStats);

// GET /api/bookings/provider/:providerId - Get bookings by provider (recent orders)
router.get('/provider/:providerId', verifyToken, bookingsController.getBookingsByProvider);

// GET /api/bookings/:bookingId - Get booking by ID
router.get('/:bookingId', verifyToken, bookingsController.getBookingById);

// POST /api/bookings/:bookingId/items - Add item to booking
router.post('/:bookingId/items', verifyToken, bookingsController.addBookingItem);

// DELETE /api/bookings/items/:itemId - Remove item from booking
router.delete('/items/:itemId', verifyToken, bookingsController.removeBookingItem);

// PUT /api/bookings/:bookingId/confirm - Confirm booking
router.put('/:bookingId/confirm', verifyToken, bookingsController.confirmBooking);

// PUT /api/bookings/:bookingId/cancel - Cancel booking
router.put('/:bookingId/cancel', verifyToken, bookingsController.cancelBooking);

// PUT /api/bookings/:bookingId/complete - Complete booking
router.put('/:bookingId/complete', verifyToken, bookingsController.completeBooking);

// =============================================
// TRANSACTIONS ROUTES
// =============================================

// POST /api/bookings/:bookingId/transactions - Create transaction
router.post('/:bookingId/transactions', verifyToken, bookingsController.createTransaction);

// GET /api/bookings/:bookingId/transactions - Get transactions by booking
router.get('/:bookingId/transactions', verifyToken, bookingsController.getTransactionsByBooking);

// PUT /api/bookings/transactions/:transactionId - Update transaction status
router.put('/transactions/:transactionId', verifyToken, bookingsController.updateTransactionStatus);

// =============================================
// REFUNDS ROUTES
// =============================================

// POST /api/bookings/:bookingId/refunds - Request refund
router.post('/:bookingId/refunds', verifyToken, bookingsController.requestRefund);

// GET /api/bookings/:bookingId/refunds - Get refunds by booking
router.get('/:bookingId/refunds', verifyToken, bookingsController.getRefundsByBooking);

// PUT /api/bookings/refunds/:refundId - Process refund (Admin)
router.put('/refunds/:refundId', verifyToken, bookingsController.processRefund);

module.exports = router;

