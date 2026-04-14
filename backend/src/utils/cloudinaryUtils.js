const cloudinary = require('cloudinary').v2;

// Configure Cloudinary (you should add these to .env)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dyvkrlz5i',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary image URL
 * @returns {string|null} - Public ID or null
 */
const extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    
    try {
        // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        return match ? match[1] : null;
    } catch (error) {
        console.error('[extractPublicId] Error:', error);
        return null;
    }
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - Cloudinary image URL
 * @returns {Promise<{success: boolean, message: string}>}
 */
const deleteImage = async (imageUrl) => {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
        return { success: false, message: 'Invalid Cloudinary URL' };
    }

    const publicId = extractPublicId(imageUrl);
    if (!publicId) {
        return { success: false, message: 'Could not extract public_id from URL' };
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        
        if (result.result === 'ok') {
            return { success: true, message: 'Image deleted successfully' };
        } else if (result.result === 'not found') {
            return { success: false, message: 'Image not found on Cloudinary' };
        } else {
            return { success: false, message: `Failed to delete image: ${result.result}` };
        }
    } catch (error) {
        console.error('[deleteImage] Error:', error);
        return { success: false, message: 'Error deleting image from Cloudinary', error: error.message };
    }
};

module.exports = {
    extractPublicId,
    deleteImage
};

