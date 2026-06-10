// backend/routes/paymentRoutes.js

import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  createOrder,
  verifyPayment,
  flagPaymentForReview,
  createPenaltyOrder,
  verifyPenaltyPayment,
  getPenaltyDetails,
} from '../controllers/paymentController.js';

const router = express.Router();

// Existing routes
router.post('/create-order', verifyToken, createOrder);
router.post('/verify', verifyToken, verifyPayment);
router.post('/flag-for-review', verifyToken, flagPaymentForReview);

// ✅ NEW: Penalty payment routes
router.get('/penalty/:bookingId', verifyToken, getPenaltyDetails);
router.post('/penalty/:bookingId/create-order', verifyToken, createPenaltyOrder);
router.post('/penalty/:bookingId/verify', verifyToken, verifyPenaltyPayment);

export default router;
