// backend/models/Location.js

import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String }, // Optional
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  radius: { type: Number, required: true }, // in degrees
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // ✅ Manager is optional now
  },
  subCities: {
    type: [String], // Array of sublocation names
    default: []
  }
}, { timestamps: true });

// Add a case-insensitive text index on city and name
locationSchema.index({ city: 'text' });
locationSchema.index({ name: 'text' });

const Location = mongoose.model('Location', locationSchema);
export default Location;
