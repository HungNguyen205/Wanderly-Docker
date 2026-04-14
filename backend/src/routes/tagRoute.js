const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { verifyToken, authorize } = require('../middlewares/authMiddleware');
const ROLES = require('../config/roles');

// PUBLIC API
router.get('/', tagController.getAllTags);
router.get('/:id', tagController.getTagById);

// ADMIN API
router.post('/', verifyToken, authorize([ROLES.ADMIN]), tagController.createTag);
router.put('/:id', verifyToken, authorize([ROLES.ADMIN]), tagController.updateTag);
router.delete('/:id', verifyToken, authorize([ROLES.ADMIN]), tagController.deleteTag);

module.exports = router;