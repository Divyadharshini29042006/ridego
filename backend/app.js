import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import googleAuthRoutes from './routes/googleAuth.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import createPaymentRoutes from './routes/paymentRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import contactRoutes from './controllers/contactRoutes.js';
import Razorpay from 'razorpay';

const app = express();

// 📁 Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

// CORS Configuration - MUST be before routes
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

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// Initialize Razorpay after env is loaded
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', createPaymentRoutes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/contact', contactRoutes);

// 🔐 Google Sign-In Route
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Credential is required' });
  }

  try {
    const { OAuth2Client } = await import('google-auth-library');
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    const User = (await import('./models/User.js')).default;
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        password: sub, // placeholder
        profileImage: picture,
        role: 'customer',
      });
      await user.save();
    }

    const { generateToken } = await import('./config/jwt.js');
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

// Test Email Configuration
app.post('/api/test-email', async (req, res) => {
  try {
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.createTransport({
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
// ✅ Simple test route to check deployment
app.get("/api/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RideGo backend is working fine 🚀",
    environment: process.env.NODE_ENV || "development",
    frontendAllowed: process.env.FRONTEND_URL || "http://localhost:5173"
  });
});

// Test route
app.get('/', (req, res) => {
  res.send('RideGo Backend is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    console.error('MulterError:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    console.error('Unhandled error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', detail: err.message });
  }
  next();
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ CORS enabled for ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`✅ Google Client ID: ${process.env.GOOGLE_CLIENT_ID ? 'Set' : 'NOT SET'}`);
  console.log(`✅ Razorpay: ${process.env.RAZORPAY_KEY_ID ? 'Configured' : 'NOT SET'}`);
});
