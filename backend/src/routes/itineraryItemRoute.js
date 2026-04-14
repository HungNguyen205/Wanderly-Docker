const express = require('express');
const router = express.Router();
const itineraryItemController = require('../controllers/itineraryItemController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Prefix chung: /api/itinerary-items

// =============================
// AUTHENTICATED API
// =============================
// POST /api/itinerary-items - Tạo item mới
router.post('/', verifyToken, itineraryItemController.createItineraryItem);

// PUT /api/itinerary-items/:id - Cập nhật item
router.put('/:id', verifyToken, itineraryItemController.updateItineraryItem);

// DELETE /api/itinerary-items/:id - Xóa item (soft delete)
router.delete('/:id', verifyToken, itineraryItemController.deleteItineraryItem);

module.exports = router;

