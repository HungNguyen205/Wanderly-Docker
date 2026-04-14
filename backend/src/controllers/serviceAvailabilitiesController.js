const serviceAvailabilitiesService = require('../services/serviceAvailabilitiesService');

// Get availability by service ID
const getByServiceId = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { fromDate, toDate, status, page, limit } = req.query;

        const result = await serviceAvailabilitiesService.getByServiceId(
            parseInt(serviceId),
            {
                fromDate: fromDate || null,
                toDate: toDate || null,
                status: status || null,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 50
            }
        );

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Get availability by ID
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await serviceAvailabilitiesService.getById(parseInt(id));

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Create availability
const create = async (req, res) => {
    try {
        const data = req.body;

        // Validation
        if (!data.ServiceId || !data.AvailabilityDate || !data.StartTime || !data.Price || !data.TotalUnits) {
            return res.status(400).json({
                success: false,
                message: "ServiceId, AvailabilityDate, StartTime, Price, and TotalUnits are required."
            });
        }

        const result = await serviceAvailabilitiesService.create(data);

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Update availability
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const result = await serviceAvailabilitiesService.update(parseInt(id), data);

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Delete availability
const deleteAvailability = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await serviceAvailabilitiesService.deleteAvailability(parseInt(id));

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Book units
const book = async (req, res) => {
    try {
        const { id } = req.params;
        const { units } = req.body;

        if (!units || units < 1) {
            return res.status(400).json({
                success: false,
                message: "Units must be at least 1."
            });
        }

        const result = await serviceAvailabilitiesService.book(parseInt(id), parseInt(units));

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Cancel booking
const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { units } = req.body;

        if (!units || units < 1) {
            return res.status(400).json({
                success: false,
                message: "Units must be at least 1."
            });
        }

        const result = await serviceAvailabilitiesService.cancelBooking(parseInt(id), parseInt(units));

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Check availability
const checkAvailability = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { date, units } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date is required."
            });
        }

        const result = await serviceAvailabilitiesService.checkAvailability(
            parseInt(serviceId),
            date,
            parseInt(units) || 1
        );

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

// Bulk create availability
const bulkCreate = async (req, res) => {
    try {
        const data = req.body;

        // Validation
        if (!data.ServiceId || !data.StartDate || !data.EndDate || !data.StartTime || !data.Price || !data.TotalUnits) {
            return res.status(400).json({
                success: false,
                message: "ServiceId, StartDate, EndDate, StartTime, Price, and TotalUnits are required."
            });
        }

        // Validate date range
        if (new Date(data.StartDate) > new Date(data.EndDate)) {
            return res.status(400).json({
                success: false,
                message: "StartDate must be before or equal to EndDate."
            });
        }

        const result = await serviceAvailabilitiesService.bulkCreate(data);

        return res.status(result.code).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
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

