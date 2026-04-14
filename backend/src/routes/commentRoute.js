const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// PUBLIC API (có thể xem comments mà không cần đăng nhập)
// GET /api/posts/:postId/comments?page=1&limit=50
router.get('/posts/:postId/comments', commentController.getCommentsByPostId);

// PRIVATE API (User phải đăng nhập)
// POST /api/posts/:postId/comments
router.post('/posts/:postId/comments', verifyToken, commentController.createComment);

// PUT /api/comments/:id
router.put('/:id', verifyToken, commentController.updateComment);

// DELETE /api/comments/:id
router.delete('/:id', verifyToken, commentController.deleteComment);

// GET /api/comments/:id/replies?page=1&limit=20
router.get('/:id/replies', commentController.getReplies);

module.exports = router;

