// backend/models/Vehicle.js
import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
  subLocation: {
    type: String,
    required: false,
    trim: true,
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
  },
  vehicleModel: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  vehicleType: {
    type: String,
    enum: ['Car', 'Bike', 'SUV', 'Van'],
    required: true,
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'],
    required: true,
  },
  seatingCapacity: {
    type: Number,
    required: true,
  },
  transmission: {
    type: String,
    enum: ['Manual', 'Automatic'],
    required: true,
  },
  rentPerDay: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  rentPerHour: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  depositAmount: {
    type: Number,
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
  },
  modelYear: {
    type: Number,
    required: true,
  },
  mileage: {
    type: String,
    required: false,
  },
  vehicleImage: {
    type: String,
    default: null,
  },
  rcBook: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['Available', 'Booked', 'Maintenance', 'Completed'],
    default: 'Available',
  },
  currentLocation: {
    lat: {
      type: Number,
      required: false,
    },
    lng: {
      type: Number,
      required: false,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
}, {
  timestamps: true,
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;