const express = require('express');
const multer = require('multer');
const router = express.Router();
const cloudinaryController = require('../controllers/cloudinaryController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Configure multer for memory storage (no disk writes)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// POST /api/cloudinary/upload - Upload image to Cloudinary (signed upload)
router.post('/upload', verifyToken, upload.single('file'), cloudinaryController.uploadImage);

// DELETE /api/cloudinary/delete - Delete image from Cloudinary
router.delete('/delete', verifyToken, cloudinaryController.deleteImage);

module.exports = router;

