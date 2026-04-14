const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, authorize } = require('../middlewares/authMiddleware');
const ROLES = require('../config/roles');

// PUBLIC API
// GET /api/categories
router.get('/', categoryController.getAllCategories);
// GET /api/categories/:id
router.get('/:id', categoryController.getCategoryById);

// ADMIN API
// POST /api/categories
router.post('/', verifyToken, authorize([ROLES.ADMIN]), categoryController.createCategory);
// PUT /api/categories/:id
router.put('/:id', verifyToken, authorize([ROLES.ADMIN]), categoryController.updateCategory);
// DELETE /api/categories/:id
router.delete('/:id', verifyToken, authorize([ROLES.ADMIN]), categoryController.deleteCategory);

module.exports = router;