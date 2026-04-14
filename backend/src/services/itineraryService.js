const { sql, poolPromise } = require("../config/dbConfig");

const normalizeTime = (t) => {
    if (!t) return null;
    if (typeof t !== "string") return null;

    if (t.length === 5) return t + ":00";
    if (t.length === 8) return t;
    if (/^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(t)) return t;
    return null;
};

const getItineraries = async ({ userId, status, pageNumber, pageSize }) => {
    try {
        const pool = await poolPromise;

        const request = pool.request()
            .input("UserId", sql.Int, userId)
            .input("PageNumber", sql.Int, pageNumber)
            .input("PageSize", sql.Int, pageSize)
            .output("Result", sql.Int);

        if (status) {
            request.input("Status", sql.NVarChar(20), status);
        }

        const result = await request.execute("sp_Itineraries_GetList");

        const code = result.output.Result;

        if (code === 1) {
            const totalCount = result.recordsets[0][0] ? result.recordsets[0][0].TotalCount : 0;
            const itineraries = result.recordsets[1] || [];

            return {
                success: true,
                code: 200,
                data: {
                    itineraries,
                    totalCount,
                    pageNumber: pageNumber,
                    pageSize: pageSize,
                    totalPages: Math.ceil(totalCount / pageSize)
                },
                message: "Successfully retrieved itineraries list."
            };
        }

        return {
            success: false,
            code: 500,
            message: "Database error while retrieving itineraries.",
        };

    } catch (error) {
        console.error("[getItineraries] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error during itineraries retrieval.",
            error: error.message
        };
    }
};

const createItinerary = async (payload) => {
    try {
        const {
            userId,
            name,
            description,
            startDate,
            endDate,
            coverImageUrl,
            isPublic,
            status,
            items
        } = payload;

        const pool = await poolPromise;

        // 1) Tạo itinerary
        const result = await pool.request()
            .input("UserId", sql.Int, userId)
            .input("Name", sql.NVarChar(200), name)
            .input("Description", sql.NVarChar(2000), description)
            .input("StartDate", sql.Date, startDate)
            .input("EndDate", sql.Date, endDate)
            .input("CoverImageUrl", sql.NVarChar(500), coverImageUrl)
            .input("IsPublic", sql.Bit, isPublic)
            .input("Status", sql.NVarChar(20), status)
            .output("NewId", sql.Int)
            .output("Result", sql.Int)
            .execute("sp_Itinerary_Create");

        const code = result.output.Result;

        switch (code) {
            case 1:
                break;
            case -1:
                return { success: false, code: 404, message: "User does not exist." };
            case -99:
                return { success: false, code: 500, message: "System error while creating itinerary." };
            default:
                return { success: false, code: 500, message: "Unexpected response." };
        }

        const itineraryId = result.output.NewId;

        // 2) Tạo từng item
        for (const item of items) {
            const startTime = normalizeTime(item.startTime);
            const endTime = normalizeTime(item.endTime);

            const r = await pool.request()
                .input("ItineraryId", sql.Int, itineraryId)
                .input("LocationId", sql.Int, item.locationId)
                .input("ServiceId", sql.Int, item.serviceId)
                .input("ItemDate", sql.Date, item.itemDate)
                .input("StartTime", sql.VarChar(50), startTime)
                .input("EndTime", sql.VarChar(50), endTime)
                .input("ActivityDescription", sql.NVarChar(1000), item.activityDescription)
                .input("ItemOrder", sql.Int, item.itemOrder)
                .output("NewId", sql.Int)
                .output("Result", sql.Int)
                .execute("sp_ItineraryItem_Create");

            const itemCode = r.output.Result;

            if (itemCode !== 1) {
                return {
                    success: false,
                    code: 400,
                    message: `Failed to create item (code ${itemCode}).`
                };
            }
        }

        // 3) Trả về kết quả thành công
        return {
            success: true,
            code: 201,
            message: "Itinerary created successfully.",
            data: {
                itineraryId,
                itemCount: items.length
            }
        };

    } catch (error) {
        return {
            success: false,
            code: 500,
            message: "System error.",
            error: error.message
        };
    }
};

// ===========================================
// 3. GET ALL BY USER (sp_Itineraries_GetAllByUser)
// ===========================================
const getAllByUser = async (userId) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("UserId", sql.Int, userId)
            .output("Result", sql.Int)
            .execute("sp_Itineraries_GetAllByUser");

        const code = result.output.Result;

        if (code === 1) {
            const itineraries = result.recordset || [];
            return {
                success: true,
                code: 200,
                data: { itineraries },
                message: "Itineraries retrieved successfully."
            };
        }

        return {
            success: false,
            code: 500,
            message: "Database error while retrieving itineraries."
        };
    } catch (error) {
        console.error("[getAllByUser] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error during itineraries retrieval.",
            error: error.message
        };
    }
};

// ===========================================
// 4. GET BY ID (sp_Itineraries_GetById)
// ===========================================
const getById = async (itineraryId) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ItineraryId", sql.Int, itineraryId)
            .output("Result", sql.Int)
            .execute("sp_Itineraries_GetById");

        const code = result.output.Result;

        if (code === -1) {
            return {
                success: false,
                code: 404,
                message: "Itinerary not found."
            };
        }

        if (code === 1) {
            // Result Set 0: Itinerary details
            const itinerary = result.recordsets[0][0] || null;
            // Result Set 1: Itinerary items
            const items = result.recordsets[1] || [];

            return {
                success: true,
                code: 200,
                data: {
                    itinerary,
                    items
                },
                message: "Itinerary retrieved successfully."
            };
        }

        return {
            success: false,
            code: 500,
            message: "Database error while retrieving itinerary."
        };
    } catch (error) {
        console.error("[getById] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error during itinerary retrieval.",
            error: error.message
        };
    }
};

// ===========================================
// 5. CREATE (sp_Itineraries_Create)
// ===========================================
const createItinerarySimple = async (userId, data) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("UserId", sql.Int, userId)
            .input("Name", sql.NVarChar(200), data.name)
            .input("Description", sql.NVarChar(2000), data.description || null)
            .input("StartDate", sql.DateTime, data.startDate || null)
            .input("EndDate", sql.DateTime, data.endDate || null)
            .input("CoverImageUrl", sql.NVarChar(500), data.coverImageUrl || null)
            .input("IsPublic", sql.Bit, data.isPublic || 0)
            .output("Result", sql.Int)
            .execute("sp_Itineraries_Create");

        const code = result.output.Result;

        if (code === 1) {
            const itineraryId = result.recordset[0]?.ItineraryId;
            return {
                success: true,
                code: 201,
                data: { itineraryId },
                message: "Itinerary created successfully."
            };
        }

        return {
            success: false,
            code: 500,
            message: "Database error during creation."
        };
    } catch (error) {
        console.error("[createItinerarySimple] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error.",
            error: error.message
        };
    }
};

// ===========================================
// 6. UPDATE (sp_Itineraries_Update)
// ===========================================
const updateItinerary = async (itineraryId, data) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ItineraryId", sql.Int, itineraryId)
            .input("Name", sql.NVarChar(200), data.name)
            .input("Description", sql.NVarChar(2000), data.description)
            .input("StartDate", sql.DateTime, data.startDate)
            .input("EndDate", sql.DateTime, data.endDate)
            .input("CoverImageUrl", sql.NVarChar(500), data.coverImageUrl)
            .input("IsPublic", sql.Bit, data.isPublic)
            .output("Result", sql.Int)
            .execute("sp_Itineraries_Update");

        const code = result.output.Result;

        if (code === -1) {
            return {
                success: false,
                code: 404,
                message: "Itinerary not found."
            };
        }

        if (code === 1) {
            const updatedItinerary = result.recordset[0] || null;
            return {
                success: true,
                code: 200,
                data: updatedItinerary,
                message: "Itinerary updated successfully."
            };
        }

        return {
            success: false,
            code: 500,
            message: "Database error during update."
        };
    } catch (error) {
        console.error("[updateItinerary] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error.",
            error: error.message
        };
    }
};

// ===========================================
// 7. UPDATE STATUS (sp_Itineraries_UpdateStatus)
// ===========================================
const updateStatus = async (itineraryId, status) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ItineraryId", sql.Int, itineraryId)
            .input("Status", sql.NVarChar(20), status)
            .output("Result", sql.Int)
            .execute("sp_Itineraries_UpdateStatus");

        const code = result.output.Result;

        if (code === -1) {
            return {
                success: false,
                code: 404,
                message: "Itinerary not found."
            };
        }

        if (code === 1) {
            const updatedStatus = result.recordset[0]?.Status;
            return {
                success: true,
                code: 200,
                data: { status: updatedStatus },
                message: "Itinerary status updated successfully."
            };
        }

        return {
            success: false,
            code: 500,
            message: "Database error during status update."
        };
    } catch (error) {
        console.error("[updateStatus] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error.",
            error: error.message
        };
    }
};

// ===========================================
// 8. DELETE (sp_Itineraries_Delete)
// ===========================================
const deleteItinerary = async (itineraryId) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("ItineraryId", sql.Int, itineraryId)
            .output("Result", sql.Int)
            .execute("sp_Itineraries_Delete");

        const code = result.output.Result;

        if (code === -1) {
            return {
                success: false,
                code: 404,
                message: "Itinerary not found."
            };
        }

        if (code === 1) {
            return {
                success: true,
                code: 200,
                message: "Itinerary deleted successfully."
            };
        }

        return {
            success: false,
            code: 500,
            message: "Database error during deletion."
        };
    } catch (error) {
        console.error("[deleteItinerary] Error", error);
        return {
            success: false,
            code: 500,
            message: "System error.",
            error: error.message
        };
    }
};

module.exports = {
    getItineraries,
    createItinerary,
    getAllByUser,
    getById,
    createItinerarySimple,
    updateItinerary,
    updateStatus,
    deleteItinerary
};