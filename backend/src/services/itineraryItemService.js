const { sql, poolPromise } = require('../config/dbConfig');

const normalizeTime = (t) => {
    if (!t) return null;
    if (typeof t !== "string") return null;
    if (t.length === 5) return t + ":00";
    if (t.length === 8) return t;
    return null;
};

// 1. CREATE
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
        if (code === 1) {
            return {
                success: true,
                code: 201,
                data: { itineraryItemId: result.recordset[0]?.ItineraryItemId },
                message: "Activity added successfully."
            };
        }
        return { success: false, code: 400, message: "Failed to add activity." };
    } catch (error) {
        return { success: false, code: 500, message: "System error.", error: error.message };
    }
};

// 2. UPDATE
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

        return result.output.Result === 1 
            ? { success: true, code: 200, message: "Updated successfully." }
            : { success: false, code: 404, message: "Item not found." };
    } catch (error) {
        return { success: false, code: 500, message: "System error." };
    }
};

// 3. DELETE
const deleteItineraryItem = async (itemId) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ItemId", sql.Int, itemId)
            .output("Result", sql.Int)
            .execute("sp_ItineraryItems_Delete");

        return result.output.Result === 1 
            ? { success: true, code: 200, message: "Deleted successfully." }
            : { success: false, code: 404, message: "Item not found." };
    } catch (error) {
        return { success: false, code: 500, message: "System error." };
    }
};

module.exports = { createItineraryItem, updateItineraryItem, deleteItineraryItem };