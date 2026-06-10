// routes/adminRoutes.js
import express from 'express';
import path from 'path';
import multer from 'multer';

import {
  getFilteredBookings,
  getResponseTimeMetrics,
  assignQueryToManager,
  getAllContactQueries,
  replyToQuery,
  getTotalBookings,
  updateBookingStatus,
  getAllBookingsWithPayment,
  getAllPayments,
  updateLocation,
  deleteLocation,
  updateManager,
  deleteManager,
  getUsersByRole,
  getAllVehiclesForAdmin,
  getAllDriversForAdmin,
  getAllBookings,
  getDashboardMetrics,
  getAnalyticsData
} from '../controllers/adminController.js';

import { getAllLocations } from '../controllers/locationController.js';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Multer config for manager profile image
const managerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join('uploads', 'managers'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: managerStorage });
router.get('/metrics', verifyToken, verifyAdmin, getDashboardMetrics);
router.get('/analytics', verifyToken, verifyAdmin, getAnalyticsData);

/* ------------------ BOOKINGS ------------------ */
router.get('/bookings', verifyToken, verifyAdmin, getAllBookings);
router.get('/bookings/count', verifyToken, verifyAdmin, getTotalBookings);
router.put('/bookings/:id/status', verifyToken, verifyAdmin, updateBookingStatus);
router.get('/bookings/all', verifyToken, verifyAdmin, getAllBookingsWithPayment);

/* ------------------ QUERIES ------------------ */
router.get('/query-metrics', verifyToken, verifyAdmin, getResponseTimeMetrics);
router.post('/assign-query', verifyToken, verifyAdmin, assignQueryToManager);
router.get('/contact-queries', verifyToken, verifyAdmin, getAllContactQueries);
router.post('/reply-query', verifyToken, verifyAdmin, replyToQuery);

/* ------------------ PAYMENTS ------------------ */
router.get('/payments', verifyToken, verifyAdmin, getAllPayments);

/* ------------------ LOCATIONS ------------------ */
router.get('/locations', verifyToken, verifyAdmin, getAllLocations);
router.put('/locations/:id', verifyToken, verifyAdmin, updateLocation);
router.delete('/locations/:id', verifyToken, verifyAdmin, deleteLocation);

/* ------------------ MANAGERS ------------------ */
router.put('/managers/:id', verifyToken, verifyAdmin, upload.single('profileImage'), updateManager);
router.delete('/managers/:id', verifyToken, verifyAdmin, deleteManager);

/* ------------------ USERS ------------------ */
router.get('/users', verifyToken, verifyAdmin, getUsersByRole);

/* ------------------ VEHICLES (ADMIN VIEW ONLY) ------------------ */
router.get('/vehicles', verifyToken, verifyAdmin, getAllVehiclesForAdmin);

router.get('/drivers', verifyToken, verifyAdmin, getAllDriversForAdmin);

export default router;
