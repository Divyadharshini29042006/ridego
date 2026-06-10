// backend/controllers/authController.js

import User from '../models/User.js';
import Location from '../models/Location.js';
import { generateToken } from '../config/jwt.js';
import { sendOtpEmail, sendPasswordResetOtpEmail } from '../utils/mailer.js';
import { generateResetToken, hashToken } from '../utils/token.js';
import bcrypt from 'bcryptjs';

// Signup for regular users (with OTP)
export const signupUser = async (req, res) => {
  const { name, email, password, role, dateOfBirth } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    const user = new User({
      name,
      email,
      password,
      dateOfBirth,
      role: role || 'customer',
      isVerified: false,
      otpHash,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
      lastOtpSentAt: new Date()
    });

    await user.save();

    try {
      await sendOtpEmail(email, otp, name);
    } catch (emailError) {
      await User.findByIdAndDelete(user._id);
      console.error('Email sending failed:', emailError.message);
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }

    res.status(201).json({
      message: 'Signup successful! OTP sent to your email.',
      email: user.email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User is already verified' });

    if (!user.otpExpires || new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.', expired: true });
    }

    const isValid = await user.compareOtp(otp);
    if (!isValid) return res.status(400).json({ message: 'Invalid OTP' });

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.lastOtpSentAt = undefined;
    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      message: 'Email verified successfully!',
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token
    });
  } catch (error) {
    console.error('OTP verification error:', error.message);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// Resend OTP
export const resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User is already verified' });

    if (user.lastOtpSentAt) {
      const timeSinceLastOtp = Date.now() - user.lastOtpSentAt.getTime();
      const cooldownMs = 30 * 1000;
      if (timeSinceLastOtp < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000);
        return res.status(429).json({ 
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
          remainingSeconds 
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    user.otpHash = otpHash;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.lastOtpSentAt = new Date();
    await user.save();

    try {
      await sendOtpEmail(email, otp, user.name);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }

    res.status(200).json({ message: 'New OTP sent to your email', email: user.email });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    res.status(500).json({ message: 'Server error during OTP resend' });
  }
};

// Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log('loginUser called with email:', email);

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role === 'customer' && !user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    const token = generateToken(user);
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Register Manager
export const registerManager = async (req, res) => {
  console.log('Register payload:', req.body);
  console.log('Uploaded file:', req.file);

  const { name, email, password, assignedLocation } = req.body;
  const imagePath = req.file?.path;

  if (!name || !email || !password || !assignedLocation) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const location = await Location.findById(assignedLocation);
    if (!location) return res.status(404).json({ message: 'Assigned location not found' });
    if (location.managerId) return res.status(400).json({ message: 'This location already has a manager' });

    const manager = new User({
      name,
      email,
      password,
      role: 'manager',
      assignedLocation,
      profileImage: imagePath,
      isVerified: true
    });

    await manager.save();
    await Location.findByIdAndUpdate(assignedLocation, { managerId: manager._id });

    res.status(201).json({ message: 'Manager created and location synced', manager });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// FIXED: Forgot Password - Send OTP
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  console.log('[FORGOT PASSWORD] Request received for email:', email);
  
  if (!email) {
    console.log('[FORGOT PASSWORD] Missing email in request');
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    console.log('[FORGOT PASSWORD] Searching for user...');
    const user = await User.findOne({ email });
    
    const genericMessage = 'If an account exists with this email, you will receive an OTP shortly.';

    if (!user) {
      console.log('[FORGOT PASSWORD] User not found');
      return res.status(200).json({ message: genericMessage });
    }

    console.log('[FORGOT PASSWORD] User found:', user.email);

    // Check cooldown (30 seconds)
    if (user.lastOtpSentAt) {
      const timeSinceLastOtp = Date.now() - user.lastOtpSentAt.getTime();
      if (timeSinceLastOtp < 30 * 1000) {
        const remainingSeconds = Math.ceil((30 * 1000 - timeSinceLastOtp) / 1000);
        console.log(`[FORGOT PASSWORD] Cooldown active: ${remainingSeconds}s remaining`);
        return res.status(429).json({ 
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
          remainingSeconds 
        });
      }
    }

    // Generate OTP
    console.log('[FORGOT PASSWORD] Generating OTP...');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('[FORGOT PASSWORD] OTP generated');

    // Hash OTP
    console.log('[FORGOT PASSWORD] Hashing OTP...');
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    console.log('[FORGOT PASSWORD] OTP hashed');

    // Update user
    console.log('[FORGOT PASSWORD] Updating user document...');
    user.passwordResetToken = otpHash;
    user.passwordResetExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    user.lastOtpSentAt = new Date();
    
    try {
      await user.save();
      console.log('[FORGOT PASSWORD] User document saved');
    } catch (saveError) {
      console.error('[FORGOT PASSWORD] Database save error:', saveError);
      throw new Error(`Database save failed: ${saveError.message}`);
    }

    // Send OTP email - THE FIX IS HERE!
    console.log('[FORGOT PASSWORD] Sending OTP email...');
    try {
      await sendPasswordResetOtpEmail(email, otp, user.name);
      console.log('[FORGOT PASSWORD] OTP email sent successfully');
    } catch (emailError) {
      console.error('[FORGOT PASSWORD] Email sending failed:', emailError);
      console.error('[FORGOT PASSWORD] Full error:', emailError.stack);
      
      // Rollback database changes
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.lastOtpSentAt = undefined;
      await user.save();
      console.log('[FORGOT PASSWORD] Database rollback completed');
      
      return res.status(500).json({ 
        message: 'Failed to send OTP email. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

    console.log('[FORGOT PASSWORD] Process completed successfully');
    res.status(200).json({ 
      message: genericMessage, 
      email: user.email 
    });

  } catch (error) {
    console.error('[FORGOT PASSWORD] Unexpected error:', error);
    console.error('[FORGOT PASSWORD] Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error during password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify Password Reset OTP
export const verifyPasswordResetOtp = async (req, res) => {
  const { email, otp } = req.body;
  
  console.log('[VERIFY RESET OTP] Request for email:', email);

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('[VERIFY RESET OTP] User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.passwordResetToken || !user.passwordResetExpires) {
      console.log('[VERIFY RESET OTP] No OTP found');
      return res.status(400).json({ 
        message: 'No OTP found. Please request a new one.',
        expired: true
      });
    }

    // Check if OTP expired
    if (new Date() > user.passwordResetExpires) {
      console.log('[VERIFY RESET OTP] OTP expired');
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.lastOtpSentAt = undefined;
      await user.save();

      return res.status(400).json({ 
        message: 'OTP has expired. Please request a new one.',
        expired: true
      });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, user.passwordResetToken);

    if (!isValid) {
      console.log('[VERIFY RESET OTP] Invalid OTP');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    console.log('[VERIFY RESET OTP] OTP verified successfully');

    // Generate a temporary token for password reset (valid for 10 minutes)
    const resetToken = generateResetToken();
    const hashedToken = hashToken(resetToken);

    // Store the verified token
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    res.status(200).json({
      message: 'OTP verified successfully!',
      resetToken,
      userId: user._id,
      success: true
    });
  } catch (error) {
    console.error('[VERIFY RESET OTP] Error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// Resend Password Reset OTP
export const resendPasswordResetOtp = async (req, res) => {
  const { email } = req.body;
  
  console.log('[RESEND RESET OTP] Request for email:', email);

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log('[RESEND RESET OTP] User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Check cooldown (30 seconds)
    if (user.lastOtpSentAt) {
      const timeSinceLastOtp = Date.now() - user.lastOtpSentAt.getTime();
      const cooldownMs = 30 * 1000;

      if (timeSinceLastOtp < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000);
        console.log(`[RESEND RESET OTP] Cooldown active: ${remainingSeconds}s`);
        return res.status(429).json({ 
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
          remainingSeconds
        });
      }
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Update user with new OTP
    user.passwordResetToken = otpHash;
    user.passwordResetExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    user.lastOtpSentAt = new Date();
    await user.save();

    // Send OTP email
    try {
      await sendPasswordResetOtpEmail(email, otp, user.name);
      console.log('[RESEND RESET OTP] Email sent successfully');
    } catch (emailError) {
      console.error('[RESEND RESET OTP] Email failed:', emailError);
      return res.status(500).json({ 
        message: 'Failed to send OTP email. Please try again.' 
      });
    }

    res.status(200).json({
      message: 'New OTP sent to your email',
      email: user.email
    });
  } catch (error) {
    console.error('[RESEND RESET OTP] Error:', error);
    res.status(500).json({ message: 'Server error during OTP resend' });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { token, userId, newPassword, confirmPassword } = req.body;
  
  console.log('[RESET PASSWORD] Request received for user:', userId);

  if (!token || !userId || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      console.log('[RESET PASSWORD] User not found');
      return res.status(404).json({ message: 'Invalid or expired reset link' });
    }

    if (!user.passwordResetToken || !user.passwordResetExpires) {
      console.log('[RESET PASSWORD] No reset token found');
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    // Check if token expired
    if (new Date() > user.passwordResetExpires) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      console.log('[RESET PASSWORD] Reset token expired');
      return res.status(400).json({ 
        message: 'Reset link has expired. Please request a new one.',
        expired: true
      });
    }

    // Hash the provided token and compare with stored hash
    const hashedToken = hashToken(token);

    if (hashedToken !== user.passwordResetToken) {
      console.log('[RESET PASSWORD] Invalid token');
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    
    // Clear reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();

    console.log('[RESET PASSWORD] Password reset successful for:', user.email);

    res.status(200).json({
      message: 'Password reset successful! You can now login with your new password.',
      success: true
    });
  } catch (error) {
    console.error('[RESET PASSWORD] Error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};