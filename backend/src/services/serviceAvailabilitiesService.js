const { sql, poolPromise } = require('../config/dbConfig');

// Helper function to convert time string to Date object for sql.Time
// Use UTC to avoid timezone conversion issues
const parseTimeString = (timeStr) => {
    if (!timeStr) return null;
    // Handle "HH:mm" or "HH:mm:ss" format
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;

    // Create a Date object with UTC time to avoid timezone conversion
    // This ensures the time is stored exactly as entered
    const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
    return date;
};

// Get availability by service ID
const getByServiceId = async (serviceId, options = {}) => {
    try {
        const pool = await poolPromise;
        const { fromDate, toDate, status, page = 1, limit = 50 } = options;

        const request = pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .input("PageNumber", sql.Int, page)
            .input("PageSize", sql.Int, limit)
            .output("Result", sql.Int);

        if (fromDate) request.input("FromDate", sql.Date, fromDate);
        else request.input("FromDate", sql.Date, null);

        if (toDate) request.input("ToDate", sql.Date, toDate);
        else request.input("ToDate", sql.Date, null);

        if (status) request.input("Status", sql.NVarChar(20), status);
        else request.input("Status", sql.NVarChar(20), null);

        const result = await request.execute("sp_ServiceAvailabilities_GetByServiceId");
        const code = result.output.Result;

        if (code !== 1) {
            return { success: false, code: 500, message: "Database error." };
        }

        const totalCount = result.recordsets[0]?.[0]?.TotalCount || 0;
        const availability = result.recordsets[1] || [];

        return {
            success: true,
            code: 200,
            data: {
                availability,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit) || 0
                }
            },
            message: "Availability retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Get availability by ID
const getById = async (availabilityId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("AvailabilityId", sql.Int, availabilityId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAvailabilities_GetById");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Availability not found." };
        }

        const availability = result.recordset?.[0];

        return {
            success: true,
            code: 200,
            data: availability,
            message: "Availability retrieved successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Create availability
const create = async (data) => {
    try {
        console.log('Creating availability with data:', data);
        const pool = await poolPromise;

        // Convert time strings to Date objects
        const startTime = parseTimeString(data.StartTime);
        const endTime = data.EndTime ? parseTimeString(data.EndTime) : null;

        const request = pool.request()
            .input("ServiceId", sql.Int, data.ServiceId)
            .input("AvailabilityDate", sql.Date, data.AvailabilityDate)
            .input("StartTime", sql.Time, startTime)
            .input("EndTime", sql.Time, endTime)
            .input("Price", sql.Decimal(18, 2), data.Price)
            .input("TotalUnits", sql.Int, data.TotalUnits)
            .input("Status", sql.NVarChar(20), data.Status || 'open')
            .output("NewAvailabilityId", sql.Int)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAvailabilities_Create");
        console.log('Procedure result:', result);
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Service not found." };
        }
        if (code === -2) {
            return { success: false, code: 409, message: "Availability already exists for this date and time." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Database error during creation." };
        }

        const availability = result.recordset?.[0];

        return {
            success: true,
            code: 201,
            data: availability,
            message: "Availability created successfully."
        };
    } catch (error) {
        console.error('Error creating availability:', error);
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Update availability
const update = async (availabilityId, data) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("AvailabilityId", sql.Int, availabilityId)
            .output("Result", sql.Int);

        if (data.AvailabilityDate !== undefined) request.input("AvailabilityDate", sql.Date, data.AvailabilityDate);
        else request.input("AvailabilityDate", sql.Date, null);

        if (data.StartTime !== undefined) request.input("StartTime", sql.Time, parseTimeString(data.StartTime));
        else request.input("StartTime", sql.Time, null);

        if (data.EndTime !== undefined) request.input("EndTime", sql.Time, parseTimeString(data.EndTime));
        else request.input("EndTime", sql.Time, null);

        if (data.Price !== undefined) request.input("Price", sql.Decimal(18, 2), data.Price);
        else request.input("Price", sql.Decimal(18, 2), null);

        if (data.TotalUnits !== undefined) request.input("TotalUnits", sql.Int, data.TotalUnits);
        else request.input("TotalUnits", sql.Int, null);

        if (data.Status !== undefined) request.input("Status", sql.NVarChar(20), data.Status);
        else request.input("Status", sql.NVarChar(20), null);

        const result = await request.execute("sp_ServiceAvailabilities_Update");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Availability not found." };
        }
        if (code === -2) {
            return { success: false, code: 400, message: "Total units cannot be less than booked units." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Database error during update." };
        }

        const availability = result.recordset?.[0];

        return {
            success: true,
            code: 200,
            data: availability,
            message: "Availability updated successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Delete availability
const deleteAvailability = async (availabilityId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("AvailabilityId", sql.Int, availabilityId)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAvailabilities_Delete");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Availability not found." };
        }
        if (code === -2) {
            return { success: false, code: 400, message: "Cannot delete: this slot has bookings." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Database error during deletion." };
        }

        return {
            success: true,
            code: 200,
            message: "Availability deleted successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Book units
const book = async (availabilityId, unitsToBook) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("AvailabilityId", sql.Int, availabilityId)
            .input("UnitsToBook", sql.Int, unitsToBook)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAvailabilities_Book");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Availability not found." };
        }
        if (code === -2) {
            return { success: false, code: 400, message: "This slot is not open for booking." };
        }
        if (code === -3) {
            return { success: false, code: 400, message: "Not enough units available." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Database error during booking." };
        }

        const availability = result.recordset?.[0];

        return {
            success: true,
            code: 200,
            data: availability,
            message: "Booking successful."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Cancel booking
const cancelBooking = async (availabilityId, unitsToCancel) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("AvailabilityId", sql.Int, availabilityId)
            .input("UnitsToCancel", sql.Int, unitsToCancel)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAvailabilities_CancelBooking");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Availability not found." };
        }
        if (code === -2) {
            return { success: false, code: 400, message: "Cannot cancel more units than booked." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Database error during cancellation." };
        }

        const availability = result.recordset?.[0];

        return {
            success: true,
            code: 200,
            data: availability,
            message: "Booking cancelled successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Check availability
const checkAvailability = async (serviceId, checkDate, unitsNeeded = 1) => {
    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input("ServiceId", sql.Int, serviceId)
            .input("CheckDate", sql.Date, checkDate)
            .input("UnitsNeeded", sql.Int, unitsNeeded)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAvailabilities_Check");
        const code = result.output.Result;

        if (code !== 1) {
            return { success: false, code: 500, message: "Database error." };
        }

        const slots = result.recordset || [];

        return {
            success: true,
            code: 200,
            data: {
                slots,
                hasAvailable: slots.some(s => s.CanBook === 1)
            },
            message: "Availability checked successfully."
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// Bulk create availability
const bulkCreate = async (data) => {
    try {
        const pool = await poolPromise;

        // Convert time strings to Date objects
        const startTime = parseTimeString(data.StartTime);
        const endTime = data.EndTime ? parseTimeString(data.EndTime) : null;

        const request = pool.request()
            .input("ServiceId", sql.Int, data.ServiceId)
            .input("StartDate", sql.Date, data.StartDate)
            .input("EndDate", sql.Date, data.EndDate)
            .input("StartTime", sql.Time, startTime)
            .input("EndTime", sql.Time, endTime)
            .input("Price", sql.Decimal(18, 2), data.Price)
            .input("TotalUnits", sql.Int, data.TotalUnits)
            .input("ExcludeWeekends", sql.Bit, data.ExcludeWeekends || false)
            .output("Result", sql.Int);

        const result = await request.execute("sp_ServiceAvailabilities_BulkCreate");
        const code = result.output.Result;

        if (code === -1) {
            return { success: false, code: 404, message: "Service not found." };
        }
        if (code !== 1) {
            return { success: false, code: 500, message: "Database error during bulk creation." };
        }

        const createdCount = result.recordset?.[0]?.CreatedCount || 0;

        return {
            success: true,
            code: 201,
            data: { createdCount },
            message: `${createdCount} availability slots created successfully.`
        };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

module.exports = {
    getByServiceId,
    getById,
    create,
    update,
    deleteAvailability,
    book,
    cancelBooking,
    checkAvailability,
    bulkCreate
};

