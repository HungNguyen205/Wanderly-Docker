const express = require('express');
const router = express.Router();
const serviceFeatureController = require('../controllers/serviceFeatureController');

// ======================================================
// PUBLIC API
// Lấy danh sách Features của một Service
// GET /api/service-features/:serviceId
// ======================================================
router.get('/:serviceId', serviceFeatureController.getFeaturesByServiceId);

module.exports = router;
