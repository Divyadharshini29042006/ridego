import './loadEnv.js'; // Load .env before anything else
import cron from 'node-cron';

import Razorpay from 'razorpay';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import multer from 'multer';
import { OAuth2Client } from 'google-auth-library';

import connectDB from './config/db.js';
import User from './models/User.js';
import { generateToken } from './config/jwt.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import createPaymentRoutes from './routes/paymentRoutes.js';
import contactRoutes from './controllers/contactRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';


import { retryFailedAssignments } from './services/driverAssignmentService.js';

const app = express();

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('🔄 Running scheduled driver assignment retry...');
  await retryFailedAssignments();
});

// ✅ ENV Checks
console.log('✅ ENV Loaded:', {
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
});

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('❌ Razorpay credentials missing from .env');
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('❌ GOOGLE_CLIENT_ID missing from .env');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 📁 Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔌 Connect to MongoDB
connectDB();

// 🔧 Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 📂 Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 📂 Debug file serving
app.get('/uploads/:folder/:filename', (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', folder, filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'File not found', path: filePath });
    }
  });
});

app.get('/debug/uploads', (req, res) => {
  const fs = require('fs');
  const vehiclesDir = path.join(__dirname, 'uploads', 'vehicles');
  try {
    const files = fs.readdirSync(vehiclesDir);
    res.json({ files });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// 🚦 API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', createPaymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/chat', chatbotRoutes);

// 🔐 Google Sign-In Route
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Credential is required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        password: sub, // placeholder, should be hashed in model
        profileImage: picture,
        role: 'customer',
      });
      await user.save();
    }

    const token = generateToken(user);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('❌ Google token verification failed:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// ❤️ Health check
app.get('/', (req, res) => res.send('🚗 RideGo API running v2...'));

// 🧯 Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  if (err instanceof multer.MulterError || err.message?.includes('Only image files are allowed')) {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Unexpected server error' });
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


// Add this after your other routes, before the error handler

// Test Email Configuration
app.post('/api/test-email', async (req, res) => {
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Verify connection
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    // Send test email
    const info = await transporter.sendMail({
      from: `"RideGo Test" <${process.env.SMTP_FROM}>`,
      to: req.body.email || process.env.SMTP_USER,
      subject: 'Test Email from RideGo',
      text: 'If you received this, your email configuration is working correctly!',
      html: '<p>If you received this, your email configuration is working correctly!</p>'
    });

    console.log('Test email sent successfully:', info.messageId);

    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Test email sent successfully',
      recipient: req.body.email || process.env.SMTP_USER
    });
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.stack
    });
  }
});