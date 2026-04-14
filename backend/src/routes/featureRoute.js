const express = require('express');
const router = express.Router();
const featureController = require('../controllers/featureController');
const { verifyToken, authorize } = require('../middlewares/authMiddleware');
const ROLES = require('../config/roles');

// PUBLIC API (Ai cũng được xem danh sách tiện ích)
// GET /api/features
router.get('/', featureController.getAllFeatures);
// GET /api/features/:id
router.get('/:id', featureController.getFeatureById);

// ADMIN API (Cần đăng nhập & Là Admin)
// POST /api/features
router.post('/', verifyToken, authorize([ROLES.ADMIN]), featureController.createFeature);
// PUT /api/features/:id
router.put('/:id', verifyToken, authorize([ROLES.ADMIN]), featureController.updateFeature);
// DELETE /api/features/:id
router.delete('/:id', verifyToken, authorize([ROLES.ADMIN]), featureController.deleteFeature);

module.exports = router;