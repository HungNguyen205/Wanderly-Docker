const { sql, poolPromise } = require('../config/dbConfig');

const normalizeTime = (t) => {
    if (!t) return null;
    if (typeof t !== "string") return null;

    if (t.length === 5) return t + ":00";
    if (t.length === 8) return t;
    if (/^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(t)) return t;
    return null;
};

// ===========================================
// 1. CREATE (sp_ItineraryItems_Create)
// ===========================================
const createItineraryItem = async (data) => {
    try {
        const pool = await poolPromise;
        
        const startTime = normalizeTime(data.startTime);
        const endTime = normalizeTime(data.endTime);

        const result = await pool.request()
            .input("ItineraryId", sql.Int, data.itineraryId)
            .input("LocationId", sql.Int, data.locationId || null)
            .input("ServiceId", sql.Int, data.serviceId || null)
            .input("ItemDate", sql.Date, data.itemDate)
            .input("StartTime", sql.VarChar(50), startTime)
            .input("EndTime", sql.VarChar(50), endTime)
            .input("ActivityDescription", sql.NVarChar(1000), data.activityDescription)
            .input("ItemOrder", sql.Int, data.itemOrder)
            .output("Result", sql.Int)
            .execute("sp_ItineraryItems_Create");

        const code = result.output.Result;

        if (code === -1) {
            return {
                success: false,
                code: 404,
                message: "Itinerary not found."
            };
        }

        if (code === 1) {
            const itineraryItemId = result.recordset[0]?.ItineraryItemId;
            return {
                success: true,
                code: 201,
                data: { itineraryItemId },
                message: "Itinerary item created successfully."
            };
        }

        return {
            success: false,
            code: 500,
            message: "Database error during creation."
        };
    } catch (error) {
        console.error("[createItineraryItem] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error.",
            error: error.message
        };
    }
};

// ===========================================
// 2. UPDATE (sp_ItineraryItems_Update)
// ===========================================
const updateItineraryItem = async (itemId, data) => {
    try {
        const pool = await poolPromise;
        
        const startTime = normalizeTime(data.startTime);
        const endTime = normalizeTime(data.endTime);

        const result = await pool.request()
            .input("ItemId", sql.Int, itemId)
            .input("LocationId", sql.Int, data.locationId || null)
            .input("ServiceId", sql.Int, data.serviceId || null)
            .input("ItemDate", sql.Date, data.itemDate)
            .input("StartTime", sql.VarChar(50), startTime)
            .input("EndTime", sql.VarChar(50), endTime)
            .input("ActivityDescription", sql.NVarChar(1000), data.activityDescription)
            .input("ItemOrder", sql.Int, data.itemOrder)
            .output("Result", sql.Int)
            .execute("sp_ItineraryItems_Update");

        const code = result.output.Result;

        if (code === -1) {
            return {
                success: false,
                code: 404,
                message: "Itinerary item not found."
            };
        }

        if (code === 1) {
            const updatedItem = result.recordset[0] || null;
            return {
                success: true,
                code: 200,
                data: updatedItem,
                message: "Itinerary item updated successfully."
            };
        }

        return {
            success: false,
            code: 500,
            message: "Database error during update."
        };
    } catch (error) {
        console.error("[updateItineraryItem] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error.",
            error: error.message
        };
    }
};

// ===========================================
// 3. DELETE (sp_ItineraryItems_Delete)
// ===========================================
const deleteItineraryItem = async (itemId) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ItemId", sql.Int, itemId)
            .output("Result", sql.Int)
            .execute("sp_ItineraryItems_Delete");

        const code = result.output.Result;

        if (code === -1) {
            return {
                success: false,
                code: 404,
                message: "Itinerary item not found."
            };
        }

        if (code === 1) {
            return {
                success: true,
                code: 200,
                message: "Itinerary item deleted successfully."
            };
        }

        return {
            success: false,
            code: 500,
            message: "Database error during deletion."
        };
    } catch (error) {
        console.error("[deleteItineraryItem] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error.",
            error: error.message
        };
    }
};

module.exports = {
    createItineraryItem,
    updateItineraryItem,
    deleteItineraryItem
};

