import express from 'express';
import {
  getManagerDashboard,
  getManagerProfile,
  updateManagerProfile,
  updateManagerProfileImage,
  getManagerDetails, // ✅ Added for /me route
  getManagerBookings,
  getManagerPayments,
  assignDriverToBooking,
} from '../controllers/managerController.js';

import {
  createVehicle,
  getManagerVehicles,
  updateVehicle,
  deleteVehicle,
  getVehiclesByLocation,
  updateVehicleStatus,
  getVehicleSummary,
  getVehicleById,
} from '../controllers/vehicleController.js';

import {
  createDriver,
  getDriversByManager,
  getAvailableDriversByManager
} from '../controllers/driverController.js';

import { getAllLocations } from '../controllers/locationController.js';

import { verifyToken, verifyManager, verifyAdmin } from '../middlewares/authMiddleware.js';
import { uploadManagerImage } from '../middlewares/uploadMiddleware.js';
import { uploadVehicleImage } from '../middlewares/uploadVehicleImage.js';
import { uploadDriverImage } from '../middlewares/uploadMiddlewareDriver.js';
const router = express.Router();

//
// 📊 Dashboard
//
router.get('/dashboard', verifyToken, verifyManager, getManagerDashboard);

//
// 👤 Profile Management
//
router.get('/profile', verifyToken, verifyManager, getManagerProfile);
router.put('/profile', verifyToken, verifyManager, updateManagerProfile);
router.put(
  '/profile/image',
  verifyToken,
  verifyManager,
  uploadManagerImage.single('profileImage'),
  updateManagerProfileImage
);

//
// ✅ Manager Identity & Location (used in AddDriver.jsx)
//
router.get('/me', verifyToken, verifyManager, getManagerDetails);

//
// 🚗 Vehicle Management
//
router.get('/vehicles', verifyToken, verifyManager, getManagerVehicles);
router.get('/vehicles/:id', verifyToken, verifyManager, getVehicleById);
router.post(
  '/vehicles',
  verifyToken,
  verifyManager,
  uploadVehicleImage.single('vehicleImage'),
  createVehicle
);
router.put(
  '/vehicles/:id',
  verifyToken,
  verifyManager,
  uploadVehicleImage.single('vehicleImage'),
  updateVehicle
);
router.delete('/vehicles/:id', verifyToken, verifyManager, deleteVehicle);
router.patch('/vehicles/:id/status', verifyToken, verifyManager, updateVehicleStatus);

//
// 📍 Location-Based & Summary Views
//
router.get('/vehicles/location', verifyToken, verifyManager, getVehiclesByLocation);
router.get('/vehicles/summary', verifyToken, verifyManager, getVehicleSummary);

//
// 📅 Booking Management
//
router.get('/bookings', verifyToken, verifyManager, getManagerBookings);
router.post('/bookings/assign-driver', verifyToken, verifyManager, assignDriverToBooking);

//
// 💳 Payment Management
//
router.get('/payments', verifyToken, verifyManager, getManagerPayments);

router.get('/drivers', verifyToken, verifyManager, getDriversByManager);
router.get('/drivers/available', verifyToken, verifyManager, getAvailableDriversByManager);

router.post(
  '/drivers',
  verifyToken,
  verifyManager,
  uploadDriverImage.fields([
  { name: 'image', maxCount: 1 },
  { name: 'licenseFile', maxCount: 1 }
]),
  createDriver
);

//
// 📍 Location Management (for sub-locations in driver forms)
//
router.get('/locations', verifyToken, verifyManager, getAllLocations);

// Add this route temporarily to fix old vehicle images
router.get('/fix-vehicle-images', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const Vehicle = (await import('../models/Vehicle.js')).default;

    // Find all vehicles with the wrong path
    const vehicles = await Vehicle.find({
      vehicleImage: { $regex: '^uploads/' }
    });

    console.log(`Found ${vehicles.length} vehicles to fix`);

    // Fix each vehicle
    for (const vehicle of vehicles) {
      const oldPath = vehicle.vehicleImage;
      // Extract just the filename
      vehicle.vehicleImage = vehicle.vehicleImage.split('/').pop();
      await vehicle.save();
      console.log(`Fixed: ${oldPath} → ${vehicle.vehicleImage}`);
    }

    res.json({
      success: true,
      message: `Fixed ${vehicles.length} vehicle images`,
      count: vehicles.length
    });
  } catch (error) {
    console.error('Error fixing vehicle images:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
