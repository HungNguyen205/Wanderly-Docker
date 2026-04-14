const itineraryItemService = require('../services/itineraryItemService');

// ===========================================
// 1. CREATE (sp_ItineraryItems_Create)
// ===========================================
const createItineraryItem = async (req, res) => {
    try {
        const {
            itineraryId,
            locationId,
            serviceId,
            itemDate,
            startTime,
            endTime,
            activityDescription,
            itemOrder
        } = req.body;

        if (!itineraryId || !itemDate || itemOrder === undefined) {
            return res.status(400).json({
                success: false,
                message: "ItineraryId, itemDate, and itemOrder are required."
            });
        }

        const result = await itineraryItemService.createItineraryItem({
            itineraryId,
            locationId,
            serviceId,
            itemDate,
            startTime,
            endTime,
            activityDescription,
            itemOrder
        });

        return res.status(result.code || 500).json(result);
    } catch (error) {
        console.error("[CreateItineraryItem Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

// ===========================================
// 2. UPDATE (sp_ItineraryItems_Update)
// ===========================================
const updateItineraryItem = async (req, res) => {
    try {
        const itemId = parseInt(req.params.id);
        const {
            locationId,
            serviceId,
            itemDate,
            startTime,
            endTime,
            activityDescription,
            itemOrder
        } = req.body;

        if (!itemId || isNaN(itemId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID."
            });
        }

        if (!itemDate || itemOrder === undefined) {
            return res.status(400).json({
                success: false,
                message: "ItemDate and itemOrder are required."
            });
        }

        const result = await itineraryItemService.updateItineraryItem(itemId, {
            locationId,
            serviceId,
            itemDate,
            startTime,
            endTime,
            activityDescription,
            itemOrder
        });

        return res.status(result.code || 500).json(result);
    } catch (error) {
        console.error("[UpdateItineraryItem Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

// ===========================================
// 3. DELETE (sp_ItineraryItems_Delete)
// ===========================================
const deleteItineraryItem = async (req, res) => {
    try {
        const itemId = parseInt(req.params.id);

        if (!itemId || isNaN(itemId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID."
            });
        }

        const result = await itineraryItemService.deleteItineraryItem(itemId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        console.error("[DeleteItineraryItem Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

module.exports = {
    createItineraryItem,
    updateItineraryItem,
    deleteItineraryItem
};

