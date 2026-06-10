// backend/models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  dateOfBirth: { type: Date },
  role: { type: String, enum: ['admin', 'manager', 'customer'], default: 'customer' },
  profileImage: { type: String },
  assignedLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    default: null
  },

  // ✅ Additional profile fields (NEW)
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  nationality: { type: String },
  cityOfResidence: { type: String },
  state: { type: String },
  aadharNumber: { type: String },
  drivingLicenseNumber: { type: String },
  licensePdfPath: { type: String },
  phone: { type: String },

  // OTP Verification Fields
  isVerified: { type: Boolean, default: false },
  otpHash: { type: String },
  otpExpires: { type: Date },
  lastOtpSentAt: { type: Date },

  // Password Reset Fields
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date }

}, { timestamps: true });


// ✅ Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// ✅ Compare entered password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};


// ✅ Compare OTP with hashed OTP
userSchema.methods.compareOtp = async function (candidateOtp) {
  if (!this.otpHash) return false;
  return await bcrypt.compare(candidateOtp, this.otpHash);
};


// ✅ Remove sensitive fields from JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otpHash;
  delete obj.otpExpires;
  delete obj.lastOtpSentAt;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};


const User = mongoose.model('User', userSchema);
export default User;
