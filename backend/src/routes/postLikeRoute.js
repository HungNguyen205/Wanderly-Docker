const express = require('express');
const router = express.Router();
const postLikeController = require('../controllers/postLikeController');
const { verifyToken } = require('../middlewares/authMiddleware');

// PRIVATE API (User phải đăng nhập)
// POST /api/posts/:postId/likes (Toggle like/unlike)
router.post('/posts/:postId/likes', verifyToken, postLikeController.toggleLike);

// PUBLIC API
// GET /api/posts/:postId/likes/users?page=1&limit=50
router.get('/posts/:postId/likes/users', postLikeController.getUsersWhoLiked);

// PRIVATE API
// GET /api/posts/:postId/likes/check
router.get('/posts/:postId/likes/check', verifyToken, postLikeController.checkUserLiked);

// PUBLIC API
// GET /api/posts/:postId/likes/count
router.get('/posts/:postId/likes/count', postLikeController.getLikeCount);

module.exports = router;

