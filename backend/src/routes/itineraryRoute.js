const express = require("express");
const router = express.Router();
const itineraryController = require("../controllers/itineraryController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Prefix chung: /api/itineraries

// =============================
// EXISTING ROUTES
// =============================
router.get("/", verifyToken, itineraryController.getItineraries);
router.post("/", verifyToken, itineraryController.createItinerary);

// =============================
// NEW ROUTES (from procedure.sql)
// =============================
// GET /api/itineraries/user/all - Lấy tất cả hành trình của user
router.get("/user/all", verifyToken, itineraryController.getAllByUser);

// GET /api/itineraries/:id - Lấy chi tiết hành trình theo ID
router.get("/:id", verifyToken, itineraryController.getById);

// POST /api/itineraries/simple - Tạo hành trình đơn giản (không có items)
router.post("/simple", verifyToken, itineraryController.createItinerarySimple);

// PUT /api/itineraries/:id - Cập nhật hành trình
router.put("/:id", verifyToken, itineraryController.updateItinerary);

// PATCH /api/itineraries/:id/status - Cập nhật trạng thái hành trình
router.patch("/:id/status", verifyToken, itineraryController.updateStatus);

// DELETE /api/itineraries/:id - Xóa hành trình (soft delete)
router.delete("/:id", verifyToken, itineraryController.deleteItinerary);

module.exports = router;
