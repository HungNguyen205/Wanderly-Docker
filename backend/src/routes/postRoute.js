const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { verifyToken, optionalToken } = require('../middlewares/authMiddleware');

// PUBLIC API (nhưng cần parse token để biết user đã like chưa)
// GET /api/posts?page=1&limit=10&keyword=...&tagId=...
router.get('/', optionalToken, postController.getPosts);
// GET /api/posts/:id
router.get('/:id', optionalToken, postController.getPostById);
// GET /api/posts/user/:userId?page=1&limit=10&includeDrafts=false
router.get('/user/:userId', optionalToken, postController.getPostsByUserId);

// PRIVATE API (User phải đăng nhập)
// POST /api/posts
router.post('/', verifyToken, postController.createPost);
// PUT /api/posts/:id
router.put('/:id', verifyToken, postController.updatePost);
// DELETE /api/posts/:id
router.delete('/:id', verifyToken, postController.deletePost);
// GET /api/posts/drafts?page=1&limit=10
router.get('/drafts', verifyToken, postController.getDraftsByUserId);

module.exports = router;