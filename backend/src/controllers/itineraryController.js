const itineraryService = require("../services/itineraryService");

const getItineraries = async (req, res) => {
    try {
        const userId = req.user.id;

        // Lấy các tham số phân trang và lọc từ Query
        const status = req.query.status;
        const pageNumber = parseInt(req.query.pageNumber) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        if (pageNumber < 1 || pageSize < 1) {
            return res.status(400).json({ success: false, message: "Page number and page size must be positive integers." });
        }

        const result = await itineraryService.getItineraries({ userId, status, pageNumber, pageSize });

        if (!result.success) {
            return res.status(result.code || 500).json({
                success: false,
                message: result.message,
            });
        }

        // Trả về dữ liệu đã phân trang (gồm list itineraries, totalCount, totalPages)
        return res.status(result.code || 200).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error("[GetItineraries Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during itineraries retrieval.",
        });
    }
}

const createItinerary = async (req, res) => {
    try {
        const userId = req.user.id;
        const payload = req.body;

        const result = await itineraryService.createItinerary({
            ...payload,
            userId
        });

        return res.status(result.code || 200).json({
            success: result.success,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error("[createItinerary Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ===========================================
// 3. GET ALL BY USER (sp_Itineraries_GetAllByUser)
// ===========================================
const getAllByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await itineraryService.getAllByUser(Number(userId));

        return res.status(result.code || 500).json(result);
    } catch (error) {
        console.error("[GetAllByUser Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

// ===========================================
// 4. GET BY ID (sp_Itineraries_GetById)
// ===========================================
const getById = async (req, res) => {
    try {
        const itineraryId = parseInt(req.params.id);
        
        if (!itineraryId || isNaN(itineraryId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid itinerary ID."
            });
        }

        const result = await itineraryService.getById(itineraryId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        console.error("[GetById Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

// ===========================================
// 5. CREATE (sp_Itineraries_Create)
// ===========================================
const createItinerarySimple = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, startDate, endDate, coverImageUrl, isPublic } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name is required."
            });
        }

        const result = await itineraryService.createItinerarySimple(Number(userId), {
            name,
            description,
            startDate,
            endDate,
            coverImageUrl,
            isPublic
        });

        return res.status(result.code || 500).json(result);
    } catch (error) {
        console.error("[CreateItinerarySimple Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

// ===========================================
// 6. UPDATE (sp_Itineraries_Update)
// ===========================================
const updateItinerary = async (req, res) => {
    try {
        const itineraryId = parseInt(req.params.id);
        const { name, description, startDate, endDate, coverImageUrl, isPublic } = req.body;

        if (!itineraryId || isNaN(itineraryId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid itinerary ID."
            });
        }

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name is required."
            });
        }

        const result = await itineraryService.updateItinerary(itineraryId, {
            name,
            description,
            startDate,
            endDate,
            coverImageUrl,
            isPublic
        });

        return res.status(result.code || 500).json(result);
    } catch (error) {
        console.error("[UpdateItinerary Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

// ===========================================
// 7. UPDATE STATUS (sp_Itineraries_UpdateStatus)
// ===========================================
const updateStatus = async (req, res) => {
    try {
        const itineraryId = parseInt(req.params.id);
        const { status } = req.body;

        if (!itineraryId || isNaN(itineraryId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid itinerary ID."
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required."
            });
        }

        const result = await itineraryService.updateStatus(itineraryId, status);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        console.error("[UpdateStatus Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

// ===========================================
// 8. DELETE (sp_Itineraries_Delete)
// ===========================================
const deleteItinerary = async (req, res) => {
    try {
        const itineraryId = parseInt(req.params.id);

        if (!itineraryId || isNaN(itineraryId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid itinerary ID."
            });
        }

        const result = await itineraryService.deleteItinerary(itineraryId);
        return res.status(result.code || 500).json(result);
    } catch (error) {
        console.error("[DeleteItinerary Controller] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

module.exports = {
    createItinerary,
    getItineraries,
    getAllByUser,
    getById,
    createItinerarySimple,
    updateItinerary,
    updateStatus,
    deleteItinerary
};
