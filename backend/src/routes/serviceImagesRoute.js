const express = require("express");
const router = express.Router();
const serviceImagesController = require("../controllers/serviceImagesController");
const { verifyToken } = require("../middlewares/authMiddleware");

// =============================================
// PUBLIC ROUTES
// =============================================

// GET /api/service-images/service/:serviceId - Get all images of a service
router.get("/service/:serviceId", serviceImagesController.getByServiceId);

// GET /api/service-images/:imageId - Get single image by ID
router.get("/:imageId", serviceImagesController.getById);

// =============================================
// PROTECTED ROUTES (require authentication)
// =============================================

// POST /api/service-images/service/:serviceId - Add single image to service
router.post("/service/:serviceId", verifyToken, serviceImagesController.create);

// POST /api/service-images/service/:serviceId/bulk - Add multiple images
router.post("/service/:serviceId/bulk", verifyToken, serviceImagesController.bulkCreate);

// PUT /api/service-images/:imageId - Update image (caption, order)
router.put("/:imageId", verifyToken, serviceImagesController.update);

// PUT /api/service-images/:imageId/primary - Set as primary image
router.put("/:imageId/primary", verifyToken, serviceImagesController.setPrimary);

// PUT /api/service-images/service/:serviceId/reorder - Reorder images
router.put("/service/:serviceId/reorder", verifyToken, serviceImagesController.reorder);

// DELETE /api/service-images/:imageId - Delete single image
router.delete("/:imageId", verifyToken, serviceImagesController.deleteImage);

// DELETE /api/service-images/service/:serviceId - Delete all images of service
router.delete("/service/:serviceId", verifyToken, serviceImagesController.deleteByServiceId);

module.exports = router;

