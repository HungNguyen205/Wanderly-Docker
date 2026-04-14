const serviceImagesService = require("../services/serviceImagesService");

// Get images by service ID
const getByServiceId = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const result = await serviceImagesService.getByServiceId(parseInt(serviceId));
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getByServiceId:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get image by ID
const getById = async (req, res) => {
    try {
        const { imageId } = req.params;
        const result = await serviceImagesService.getById(parseInt(imageId));
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - getById:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Create single image
const create = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { imageUrl, caption, displayOrder } = req.body;

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: "imageUrl is required."
            });
        }

        const result = await serviceImagesService.create(
            parseInt(serviceId),
            imageUrl,
            caption || null,
            displayOrder !== undefined ? parseInt(displayOrder) : null
        );

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - create:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Bulk create images
const bulkCreate = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { images } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                success: false,
                message: "images array is required and must not be empty."
            });
        }

        // Validate each image has url
        for (const img of images) {
            if (!img.url) {
                return res.status(400).json({
                    success: false,
                    message: "Each image must have a 'url' property."
                });
            }
        }

        const result = await serviceImagesService.bulkCreate(parseInt(serviceId), images);
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - bulkCreate:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update image
const update = async (req, res) => {
    try {
        const { imageId } = req.params;
        const { caption, displayOrder } = req.body;

        const result = await serviceImagesService.update(
            parseInt(imageId),
            caption !== undefined ? caption : null,
            displayOrder !== undefined ? parseInt(displayOrder) : null
        );

        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - update:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Delete image
const deleteImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const result = await serviceImagesService.deleteImage(parseInt(imageId));
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - deleteImage:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Delete all images by service
const deleteByServiceId = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const result = await serviceImagesService.deleteByServiceId(parseInt(serviceId));
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - deleteByServiceId:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Reorder images
const reorder = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { imageOrders } = req.body;

        if (!imageOrders || !Array.isArray(imageOrders)) {
            return res.status(400).json({
                success: false,
                message: "imageOrders array is required."
            });
        }

        const result = await serviceImagesService.reorder(parseInt(serviceId), imageOrders);
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - reorder:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Set primary image
const setPrimary = async (req, res) => {
    try {
        const { imageId } = req.params;
        const result = await serviceImagesService.setPrimary(parseInt(imageId));
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Controller error - setPrimary:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getByServiceId,
    getById,
    create,
    bulkCreate,
    update,
    deleteImage,
    deleteByServiceId,
    reorder,
    setPrimary
};

