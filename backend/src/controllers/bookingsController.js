const bookingsService = require('../services/bookingsService');

// =============================================
// BOOKINGS CONTROLLER
// =============================================

// Create a new booking
const createBooking = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const { promotionId } = req.body;
        const result = await bookingsService.createBooking(userId, promotionId);

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - createBooking:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Add item to booking
const addBookingItem = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { serviceAvailabilityId, quantity } = req.body;

        if (!serviceAvailabilityId) {
            return res.status(400).json({ success: false, message: "serviceAvailabilityId is required." });
        }

        const result = await bookingsService.addBookingItem(
            parseInt(bookingId),
            parseInt(serviceAvailabilityId),
            parseInt(quantity) || 1
        );

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - addBookingItem:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Remove item from booking
const removeBookingItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        const result = await bookingsService.removeBookingItem(parseInt(itemId));

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - removeBookingItem:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get booking by ID
const getBookingById = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const result = await bookingsService.getBookingById(parseInt(bookingId));

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getBookingById:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get my bookings (current user)
const getMyBookings = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const { status, page, limit } = req.query;

        const result = await bookingsService.getBookingsByUser(userId, {
            status,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10
        });

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getMyBookings:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get bookings by user ID (admin)
const getBookingsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, page, limit } = req.query;

        const result = await bookingsService.getBookingsByUser(parseInt(userId), {
            status,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10
        });

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getBookingsByUser:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Confirm booking
const confirmBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const result = await bookingsService.confirmBooking(parseInt(bookingId));

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - confirmBooking:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Cancel booking
const cancelBooking = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const { bookingId } = req.params;

        const result = await bookingsService.cancelBooking(parseInt(bookingId), userId);

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - cancelBooking:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Complete booking
const completeBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const result = await bookingsService.completeBooking(parseInt(bookingId));

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - completeBooking:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get provider statistics
const getProviderStats = async (req, res) => {
    try {
        const { providerId } = req.params;
        const { fromDate, toDate } = req.query;

        const result = await bookingsService.getProviderStats(
            parseInt(providerId),
            fromDate || null,
            toDate || null
        );

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getProviderStats:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get bookings by provider
const getBookingsByProvider = async (req, res) => {
    try {
        const { providerId } = req.params;
        const { page, limit } = req.query;

        const result = await bookingsService.getBookingsByProvider(parseInt(providerId), {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10
        });

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getBookingsByProvider:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// =============================================
// TRANSACTIONS CONTROLLER
// =============================================

// Create transaction
const createTransaction = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { amount, paymentMethod, gatewayId, currency, status } = req.body;

        if (!amount || !paymentMethod || !gatewayId) {
            return res.status(400).json({
                success: false,
                message: "amount, paymentMethod, and gatewayId are required."
            });
        }

        const result = await bookingsService.createTransaction(
            parseInt(bookingId),
            parseFloat(amount),
            paymentMethod,
            parseInt(gatewayId),
            currency || 'VND',
            status || 'pending'
        );

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - createTransaction:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update transaction status
const updateTransactionStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: "status is required." });
        }

        const result = await bookingsService.updateTransactionStatus(
            parseInt(transactionId),
            status
        );

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - updateTransactionStatus:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get transactions by booking
const getTransactionsByBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const result = await bookingsService.getTransactionsByBooking(parseInt(bookingId));

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getTransactionsByBooking:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// =============================================
// REFUNDS CONTROLLER
// =============================================

// Request refund
const requestRefund = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const { bookingId } = req.params;
        const { amount, reason, refundMethod } = req.body;

        if (!amount || !reason) {
            return res.status(400).json({ success: false, message: "amount and reason are required." });
        }

        const result = await bookingsService.requestRefund(
            parseInt(bookingId),
            userId,
            parseFloat(amount),
            reason,
            refundMethod
        );

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - requestRefund:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Process refund (Admin)
const processRefund = async (req, res) => {
    try {
        const adminUserId = req.user?.id;
        if (!adminUserId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const { refundId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: "status is required." });
        }

        const result = await bookingsService.processRefund(
            parseInt(refundId),
            adminUserId,
            status
        );

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - processRefund:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get refunds by booking
const getRefundsByBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const result = await bookingsService.getRefundsByBooking(parseInt(bookingId));

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getRefundsByBooking:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    // Bookings
    createBooking,
    addBookingItem,
    removeBookingItem,
    getBookingById,
    getMyBookings,
    getBookingsByUser,
    confirmBooking,
    cancelBooking,
    completeBooking,
    getProviderStats,
    getBookingsByProvider,
    // Transactions
    createTransaction,
    updateTransactionStatus,
    getTransactionsByBooking,
    // Refunds
    requestRefund,
    processRefund,
    getRefundsByBooking
};

