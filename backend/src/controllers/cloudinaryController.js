const cloudinaryUtils = require('../utils/cloudinaryUtils');
const cloudinary = require('cloudinary').v2;

/**
 * POST /api/cloudinary/upload
 * Upload image to Cloudinary using signed preset "Travel_Planner"
 * Query param: ?folder=services|itineraries|posts|avatars (default: itineraries)
 */
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        // Get folder from query param (default to itineraries for backward compatibility)
        const folderType = req.query.folder || 'itineraries';
        const allowedFolders = ['itineraries', 'services', 'posts', 'avatars', 'providers', 'locations'];
        const folder = allowedFolders.includes(folderType)
            ? `Travel_Planner/${folderType}`
            : 'Travel_Planner/itineraries';

        // Upload to Cloudinary with signed preset "Travel_Planner"
        // Using upload_stream for better memory handling
        const uploadOptions = {
            folder: folder,
            upload_preset: 'Travel_Planner', // Signed preset
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
            overwrite: false
        };

        // Handle both buffer and file path
        let uploadResult;
        if (req.file.buffer) {
            // Upload from buffer (memory)
            uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(req.file.buffer);
            });
        } else if (req.file.path) {
            // Upload from file path (disk)
            uploadResult = await cloudinary.uploader.upload(req.file.path, uploadOptions);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid file format'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id
            },
            message: 'Image uploaded successfully'
        });
    } catch (error) {
        console.error('[uploadImage Controller] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message
        });
    }
};

/**
 * DELETE /api/cloudinary/delete
 * Delete image from Cloudinary
 */
const deleteImage = async (req, res) => {
    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Image URL is required'
            });
        }

        const result = await cloudinaryUtils.deleteImage(imageUrl);

        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('[deleteImage Controller] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    uploadImage,
    deleteImage
};
