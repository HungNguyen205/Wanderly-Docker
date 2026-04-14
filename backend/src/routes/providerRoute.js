const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Prefix chung: /api/providers

// 1. Đăng ký/Chuyển đổi thành Nhà cung cấp
// POST /api/providers/register
router.post('/register', verifyToken, providerController.registerProvider);

// 2. Quản lý hồ sơ Nhà cung cấp (Chỉ yêu cầu Token)
// GET /api/providers/me
router.get('/me', verifyToken, providerController.getProviderProfile);
// PUT /api/providers/me
router.put('/me', verifyToken, providerController.updateProviderProfile);
// DELETE /api/providers/me
router.delete('/me', verifyToken, providerController.deleteProvider);

module.exports = router;