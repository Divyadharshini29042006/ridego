// backend/routes/authRoutes.js

import express from 'express';
import path from 'path';
import multer from 'multer';
import { 
  loginUser, 
  signupUser, 
  registerManager,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyPasswordResetOtp,
  resendPasswordResetOtp,
  resetPassword
} from '../controllers/authController.js';
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

/* ------------------ AUTH ------------------ */
router.post('/login', loginUser);
router.post('/signup', signupUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/register-manager', verifyToken, verifyAdmin, upload.single('profileImage'), registerManager);

/* ------------------ PASSWORD RESET ------------------ */
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyPasswordResetOtp);
router.post('/resend-reset-otp', resendPasswordResetOtp);
router.post('/reset-password', resetPassword);

export default router;