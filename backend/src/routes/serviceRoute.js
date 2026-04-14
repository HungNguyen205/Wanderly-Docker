const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { verifyToken, authorize } = require('../middlewares/authMiddleware');
const ROLES = require('../config/roles'); // Cần có file roles.js đã định nghĩa ROLES.PROVIDER

// Prefix chung: /api/services

// =============================
// PUBLIC API (Read)
// =============================
// GET /api/services (List & Search)
router.get('/', serviceController.getServices);
router.get('/provider', verifyToken, authorize([ROLES.PROVIDER]), serviceController.getServicesByOwnerUserId);
// GET /api/services/:id (Detail)
router.get('/:id', serviceController.getServiceById);



// =============================
// PROVIDER API (Write/Management)
// =============================
// POST /api/services (Create)
router.post('/', verifyToken, authorize([ROLES.PROVIDER]), serviceController.createService);
// PUT /api/services/:id (Update)
router.put('/:id', verifyToken, authorize([ROLES.PROVIDER]), serviceController.updateService);
// DELETE /api/services/:id (Delete)
router.delete('/:id', verifyToken, authorize([ROLES.PROVIDER]), serviceController.deleteService);

module.exports = router;