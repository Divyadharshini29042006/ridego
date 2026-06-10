// backend/routes/vehicleRoutes.js
import express from 'express';
import {
  createVehicle,
  getVehiclesByLocation,
  getManagerVehicles,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  getVehicleWithBookings,
  getPublicVehicles,
  getPublicVehicleById,
  updateVehicleLocation,
  getManagerVehicleLocations,
} from '../controllers/vehicleController.js';

import { verifyToken, verifyManager } from '../middlewares/authMiddleware.js';
import { uploadVehicleImage } from '../middlewares/uploadVehicleImage.js';

const router = express.Router();

// 🚗 Create a new vehicle
router.post(
  '/',
  verifyToken,
  verifyManager,
  uploadVehicleImage.single('vehicleImage'),
  createVehicle
);

// 📍 Get vehicles by manager's assigned location
router.get('/location', verifyToken, verifyManager, getVehiclesByLocation);

// 🗺️ NEW: Get vehicle locations for manager (for map display)
router.get('/locations/manager', verifyToken, verifyManager, getManagerVehicleLocations);

// 📋 Vehicle Details + Booking History
router.get('/vehicles/:id/details', verifyToken, verifyManager, getVehicleWithBookings);

// 📦 Get all vehicles added by manager
router.get('/', verifyToken, verifyManager, getManagerVehicles);

// Public route for vehicles without authentication
router.get('/public/vehicles', getPublicVehicles);

// Public route for single vehicle details
router.get('/:id', getPublicVehicleById);

// ✏️ Update vehicle
router.put(
  '/:id',
  verifyToken,
  verifyManager,
  uploadVehicleImage.single('vehicleImage'),
  updateVehicle
);

// 🗑️ Delete vehicle
router.delete('/:id', verifyToken, verifyManager, deleteVehicle);

// 🔄 Update vehicle status
router.patch('/:id/status', verifyToken, verifyManager, updateVehicleStatus);

// 📍 Update vehicle location
router.put('/:vehicleId/location', updateVehicleLocation);

export default router;