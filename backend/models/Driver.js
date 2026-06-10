// models/Driver.js

import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  subLocation: { type: String, default: 'Main Location' },
  name: { type: String, required: true },
  email: { type: String }, // Made optional for backward compatibility
  phone: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  licenseNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Available', 'On Duty', 'Inactive', 'Assigned'], default: 'Available' },
  image: { type: String }, // profile image path
  licenseFile: { type: String }, // ✅ license document path
}, { timestamps: true });

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;