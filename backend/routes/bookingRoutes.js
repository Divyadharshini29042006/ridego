// backend/routes/bookingRoutes.js - UPDATED WITH PENALTY ROUTES
import express from 'express';
import { 
  createBooking, 
  getUserBookings, 
  completeJourney, 
  checkDriverAssignment, 
  getManagerBookings, 
  updateBookingStatus, 
  cancelBooking,
  managerCompleteBooking,  // ✅ NEW
  payPenalty,              // ✅ NEW
  createPenaltyPaymentOrder // ✅ NEW
} from '../controllers/bookingController.js';
import { verifyToken, verifyManager } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ===== USER ROUTES =====
// Create a new booking
router.post('/create', verifyToken, createBooking);

// Get user's bookings
router.get('/user', verifyToken, getUserBookings);

// Mark journey as completed (user side)
router.patch('/:bookingId/complete', verifyToken, completeJourney);

// Cancel booking
router.patch('/:bookingId/cancel', verifyToken, cancelBooking);

// Check driver assignment status
router.get('/:bookingId/driver-status', verifyToken, checkDriverAssignment);

// ===== PENALTY ROUTES (USER) =====
// Create Razorpay order for penalty payment
router.post('/:bookingId/penalty/create-order', verifyToken, createPenaltyPaymentOrder);

// Process penalty payment
router.post('/:bookingId/penalty/pay', verifyToken, payPenalty);

// ===== MANAGER ROUTES =====
// Get manager's location bookings
router.get('/manager/bookings', verifyToken, verifyManager, getManagerBookings);

// Update booking status (general)
router.put('/manager/:bookingId/status', verifyToken, verifyManager, updateBookingStatus);

// ✅ Complete booking with optional penalty
router.post('/manager/:bookingId/complete', verifyToken, verifyManager, managerCompleteBooking);

export default router;