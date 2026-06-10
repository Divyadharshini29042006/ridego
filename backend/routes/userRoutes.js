import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  createManager,
  getUsersByRole,
  getUserProfile,
  updateUserProfile,
  changePassword,
  submitContactQuery
} from '../controllers/userController.js';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware.js';
import { uploadManagerImage } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

/* ---------------- MANAGER ROUTES ---------------- */
router.post(
  '/create-manager',
  verifyToken,
  verifyAdmin,
  uploadManagerImage.single('profileImage'),
  createManager
);

router.get('/', verifyToken, verifyAdmin, getUsersByRole);

/* ---------------- USER PROFILE ROUTES ---------------- */
// Multer setup for license PDF upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join('uploads', 'documents'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.get('/profile/:id', verifyToken, getUserProfile);
router.put('/update/:id', verifyToken, upload.single('licensePdf'), updateUserProfile);
router.post('/change-password', verifyToken, changePassword);

// Contact query route (no auth required for submission)
router.post('/contact', submitContactQuery);

export default router;
