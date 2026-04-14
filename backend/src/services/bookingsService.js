const { sql, poolPromise } = require('../config/dbConfig');
const emailUtils = require('../utils/emailUtils');

// =============================================
// BOOKINGS SERVICE
// =============================================

// Create a new booking
const createBooking = async (userId, promotionId = null) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("UserId", sql.Int, userId)
            .input("PromotionId", sql.Int, promotionId)
            .output("NewBookingId", sql.Int)
            .output("NewBookingCode", sql.NVarChar(20))
            .output("Result", sql.Int);

        const result = await request.execute("sp_Bookings_Create");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "User not found or inactive." };
        }
        if (code === -2) {
            return { success: false, code: 404, message: "Promotion not found." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to create booking." };
        }

        return {
            success: true,
            code: 201,
            message: "Booking created successfully.",
            data: {
                bookingId: result.output.NewBookingId,
                bookingCode: result.output.NewBookingCode,
                booking: result.recordset[0]
            }
        };
    } catch (error) {
        console.error("Error creating booking:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Helper function to get provider info from booking items
const getProviderInfoFromBooking = (items) => {
    if (!items || items.length === 0) {
        return null;
    }

    // Get provider info from first item (all items should have same provider)
    const firstItem = items[0];
    if (firstItem.ProviderName) {
        return {
            CompanyName: firstItem.ProviderName,
            Email: firstItem.ProviderEmail || null,
            PhoneNumber: firstItem.ProviderPhone || null,
            Address: firstItem.ProviderAddress || null
        };
    }
    return null;
};

// Add item to booking
const addBookingItem = async (bookingId, serviceAvailabilityId, quantity = 1) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("BookingId", sql.Int, bookingId)
            .input("ServiceAvailabilityId", sql.Int, serviceAvailabilityId)
            .input("Quantity", sql.Int, quantity)
            .output("NewItemId", sql.Int)
            .output("Result", sql.Int);

        const result = await request.execute("sp_BookingItems_Add");
        const code = result.output.Result;

        const errorMessages = {
            "-1": "Booking not found.",
            "-2": "Booking is not in pending status.",
            "-3": "Service availability not found.",
            "-4": "Service slot is not open for booking.",
            "-5": "Not enough units available.",
            "-99": "System error."
        };

        if (code !== 1) {
            return {
                success: false,
                code: code === -1 || code === -3 ? 404 : 400,
                message: errorMessages[code.toString()] || "Failed to add item."
            };
        }

        // After adding item successfully, send booking confirmation email
        try {
            const bookingData = await getBookingById(bookingId);
            if (bookingData.success && bookingData.data.booking) {
                const booking = bookingData.data.booking;
                const items = bookingData.data.items || [];
                const providerInfo = getProviderInfoFromBooking(items);
                
                // Get payment link (frontend URL)
                const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings/${bookingId}`;

                await emailUtils.sendBookingConfirmationEmail({
                    customerEmail: booking.CustomerEmail,
                    customerName: booking.CustomerName,
                    bookingCode: booking.BookingCode,
                    totalAmount: booking.TotalAmount,
                    bookingItems: items,
                    providerInfo: providerInfo,
                    paymentLink: paymentLink
                });
            }
        } catch (emailError) {
            // Don't fail the booking if email fails
            console.error("Error sending booking confirmation email:", emailError);
        }

        return {
            success: true,
            code: 201,
            message: "Item added successfully.",
            data: {
                itemId: result.output.NewItemId,
                item: result.recordset[0]
            }
        };
    } catch (error) {
        console.error("Error adding booking item:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Remove item from booking
const removeBookingItem = async (bookingItemId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("BookingItemId", sql.Int, bookingItemId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_BookingItems_Remove");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Item not found." };
        }
        if (code === -2) {
            return { success: false, code: 400, message: "Cannot modify non-pending booking." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to remove item." };
        }

        return {
            success: true,
            code: 200,
            message: "Item removed successfully."
        };
    } catch (error) {
        console.error("Error removing booking item:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Get booking by ID
const getBookingById = async (bookingId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("BookingId", sql.Int, bookingId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Bookings_GetById");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Booking not found." };
        }

        return {
            success: true,
            code: 200,
            data: {
                booking: result.recordsets[0]?.[0] || null,
                items: result.recordsets[1] || [],
                transactions: result.recordsets[2] || []
            }
        };
    } catch (error) {
        console.error("Error getting booking:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Get bookings by user
const getBookingsByUser = async (userId, options = {}) => {
    try {
        const pool = await poolPromise;
        const { status, page = 1, limit = 10 } = options;

        const request = pool.request()
            .input("UserId", sql.Int, userId)
            .input("Status", sql.NVarChar(30), status || null)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Bookings_GetByUser");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "User not found." };
        }

        const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
        const bookings = result.recordsets[1] || [];

        return {
            success: true,
            code: 200,
            data: {
                bookings,
                pagination: {
                    total: totalCount,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalCount / limit)
                }
            }
        };
    } catch (error) {
        console.error("Error getting user bookings:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Confirm booking
const confirmBooking = async (bookingId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("BookingId", sql.Int, bookingId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Bookings_Confirm");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Booking not found." };
        }
        if (code === -2) {
            return { success: false, code: 400, message: "Booking is not in pending status." };
        }
        if (code === -3) {
            return { success: false, code: 400, message: "Payment not completed." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to confirm booking." };
        }

        return {
            success: true,
            code: 200,
            message: "Booking confirmed successfully.",
            data: result.recordset[0]
        };
    } catch (error) {
        console.error("Error confirming booking:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Cancel booking
const cancelBooking = async (bookingId, userId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("BookingId", sql.Int, bookingId)
            .input("UserId", sql.Int, userId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Bookings_Cancel");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Booking not found." };
        }
        if (code === -2) {
            return { success: false, code: 403, message: "Not authorized to cancel this booking." };
        }
        if (code === -3) {
            return { success: false, code: 400, message: "Cannot cancel booking in current status." };
        }
        if (code === -4) {
            return { success: false, code: 400, message: "Cannot cancel booking within 24 hours of service date." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to cancel booking." };
        }

        return {
            success: true,
            code: 200,
            message: "Booking cancelled successfully.",
            data: result.recordset[0]
        };
    } catch (error) {
        console.error("Error cancelling booking:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Complete booking
const completeBooking = async (bookingId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("BookingId", sql.Int, bookingId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Bookings_Complete");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Booking not found." };
        }
        if (code === -2) {
            return { success: false, code: 400, message: "Booking must be confirmed first." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to complete booking." };
        }

        return {
            success: true,
            code: 200,
            message: "Booking completed successfully.",
            data: result.recordset[0]
        };
    } catch (error) {
        console.error("Error completing booking:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Get provider statistics
const getProviderStats = async (providerId, fromDate = null, toDate = null) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ProviderId", sql.Int, providerId)
            .input("FromDate", sql.Date, fromDate)
            .input("ToDate", sql.Date, toDate)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Bookings_GetStatsByProvider");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Provider not found." };
        }

        return {
            success: true,
            code: 200,
            data: {
                summary: result.recordsets[0]?.[0] || {},
                byService: result.recordsets[1] || []
            }
        };
    } catch (error) {
        console.error("Error getting provider stats:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Get bookings by provider
const getBookingsByProvider = async (providerId, options = {}) => {
    try {
        const pool = await poolPromise;
        const { page = 1, limit = 10 } = options;

        const request = pool.request()
            .input("ProviderId", sql.Int, providerId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Bookings_GetByProvider");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Provider not found." };
        }

        const bookings = result.recordset || [];
        const totalCount = bookings.length > 0 ? bookings[0].TotalCount || 0 : 0;
        
        // Remove TotalCount from each booking object
        const cleanBookings = bookings.map(b => {
            const { TotalCount, ...rest } = b;
            return rest;
        });

        return {
            success: true,
            code: 200,
            data: {
                bookings: cleanBookings,
                pagination: {
                    total: totalCount,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalCount / limit)
                }
            }
        };
    } catch (error) {
        console.error("Error getting provider bookings:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// =============================================
// TRANSACTIONS SERVICE
// =============================================

// Create transaction
const createTransaction = async (bookingId, amount, paymentMethod, gatewayId, currency = 'VND', status = 'pending') => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("BookingId", sql.Int, bookingId)
            .input("Amount", sql.Decimal(18, 2), amount)
            .input("PaymentMethod", sql.NVarChar(50), paymentMethod)
            .input("Currency", sql.Char(5), currency)
            .input("GatewayId", sql.Int, gatewayId)
            .input("Status", sql.NVarChar(30), status)
            .output("NewTransactionId", sql.Int)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Transactions_Create");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Booking not found." };
        }
        if (code === -2) {
            return { success: false, code: 404, message: "Payment gateway not found." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to create transaction." };
        }

        // If payment is successful, send payment confirmation email
        if (status === 'succeeded') {
            try {
                const bookingData = await getBookingById(bookingId);
                if (bookingData.success && bookingData.data.booking) {
                    const booking = bookingData.data.booking;
                    const items = bookingData.data.items || [];
                    const transactions = bookingData.data.transactions || [];
                    const providerInfo = getProviderInfoFromBooking(items);
                    const latestTransaction = transactions.find(t => t.TransactionId === result.output.NewTransactionId) || result.recordset[0];
                    
                    // Get booking link (frontend URL)
                    const bookingLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings/${bookingId}`;

                    await emailUtils.sendPaymentConfirmationEmail({
                        customerEmail: booking.CustomerEmail,
                        customerName: booking.CustomerName,
                        bookingCode: booking.BookingCode,
                        totalAmount: booking.TotalAmount,
                        bookingItems: items,
                        providerInfo: providerInfo,
                        transactionDetails: latestTransaction,
                        bookingLink: bookingLink
                    });
                }
            } catch (emailError) {
                // Don't fail the transaction if email fails
                console.error("Error sending payment confirmation email:", emailError);
            }
        }

        return {
            success: true,
            code: 201,
            message: "Transaction created successfully.",
            data: {
                transactionId: result.output.NewTransactionId,
                transaction: result.recordset[0]
            }
        };
    } catch (error) {
        console.error("Error creating transaction:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Update transaction status
const updateTransactionStatus = async (transactionId, newStatus) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("TransactionId", sql.Int, transactionId)
            .input("NewStatus", sql.NVarChar(30), newStatus)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Transactions_UpdateStatus");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 400, message: "Invalid status." };
        }
        if (code === -2) {
            return { success: false, code: 404, message: "Transaction not found." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to update transaction." };
        }

        return {
            success: true,
            code: 200,
            message: "Transaction updated successfully.",
            data: result.recordset[0]
        };
    } catch (error) {
        console.error("Error updating transaction:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Get transactions by booking
const getTransactionsByBooking = async (bookingId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("BookingId", sql.Int, bookingId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Transactions_GetByBooking");

        return {
            success: true,
            code: 200,
            data: result.recordset || []
        };
    } catch (error) {
        console.error("Error getting transactions:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// =============================================
// REFUNDS SERVICE
// =============================================

// Request refund
const requestRefund = async (bookingId, userId, amount, reason, refundMethod = null) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("BookingId", sql.Int, bookingId)
            .input("UserId", sql.Int, userId)
            .input("Amount", sql.Decimal(18, 2), amount)
            .input("Reason", sql.NVarChar(1000), reason)
            .input("RefundMethod", sql.NVarChar(50), refundMethod)
            .output("NewRefundId", sql.Int)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Refunds_Request");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Booking not found." };
        }
        if (code === -2) {
            return { success: false, code: 403, message: "Not authorized to request refund." };
        }
        if (code === -3) {
            return { success: false, code: 400, message: "Cannot refund booking in current status." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to create refund request." };
        }

        return {
            success: true,
            code: 201,
            message: "Refund requested successfully.",
            data: {
                refundId: result.output.NewRefundId,
                refund: result.recordset[0]
            }
        };
    } catch (error) {
        console.error("Error requesting refund:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Process refund (Admin)
const processRefund = async (refundId, adminUserId, newStatus) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("RefundId", sql.Int, refundId)
            .input("AdminUserId", sql.Int, adminUserId)
            .input("NewStatus", sql.NVarChar(30), newStatus)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Refunds_Process");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 400, message: "Invalid status." };
        }
        if (code === -2) {
            return { success: false, code: 403, message: "Admin access required." };
        }
        if (code === -3) {
            return { success: false, code: 404, message: "Refund request not found." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Failed to process refund." };
        }

        return {
            success: true,
            code: 200,
            message: "Refund processed successfully.",
            data: result.recordset[0]
        };
    } catch (error) {
        console.error("Error processing refund:", error);
        return { success: false, code: 500, message: error.message };
    }
};

// Get refunds by booking
const getRefundsByBooking = async (bookingId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("BookingId", sql.Int, bookingId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_Refunds_GetByBooking");

        return {
            success: true,
            code: 200,
            data: result.recordset || []
        };
    } catch (error) {
        console.error("Error getting refunds:", error);
        return { success: false, code: 500, message: error.message };
    }
};

module.exports = {
    // Bookings
    createBooking,
    addBookingItem,
    removeBookingItem,
    getBookingById,
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

