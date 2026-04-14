const express = require('express');
const router = express.Router();
const commentLikeController = require('../controllers/commentLikeController');
const { verifyToken } = require('../middlewares/authMiddleware');

// PRIVATE API (User phải đăng nhập)
// POST /api/comments/:commentId/likes (Toggle like/unlike)
router.post('/comments/:commentId/likes', verifyToken, commentLikeController.toggleLike);

// PUBLIC API
// GET /api/comments/:commentId/likes/users?page=1&limit=50
router.get('/comments/:commentId/likes/users', commentLikeController.getUsersWhoLiked);

// PRIVATE API
// GET /api/comments/:commentId/likes/check
router.get('/comments/:commentId/likes/check', verifyToken, commentLikeController.checkUserLiked);

// PUBLIC API
// GET /api/comments/:commentId/likes/count
router.get('/comments/:commentId/likes/count', commentLikeController.getLikeCount);

module.exports = router;

