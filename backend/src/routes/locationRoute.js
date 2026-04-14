const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");
const { authorize, verifyToken } = require("../middlewares/authMiddleware");
const ROLES = require("../config/roles");

// 1. GET List (Public)
router.get('/', locationController.getLocations);

// 2. GET By Id (Public)
router.get('/:id', locationController.getLocationById);

// 3. POST Create (Admin)
// router.post('/', checkRole('Admin'), locationController.createLocation);
router.post('/', verifyToken, authorize([ROLES.ADMIN]), locationController.createLocation);

// 4. PUT Update (Admin)
// router.put('/:id', checkRole('Admin'), locationController.updateLocation);
router.put('/:id', verifyToken, authorize([ROLES.ADMIN]), locationController.updateLocation);

// 5. DELETE Soft Delete (Admin)
// router.delete('/:id', checkRole('Admin'), locationController.deleteLocation);
router.delete('/:id', verifyToken, authorize([ROLES.ADMIN]), locationController.deleteLocation);

module.exports = router;
