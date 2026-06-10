// backend/models/Booking.js - UPDATED with Penalty Support

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  // Customer reference
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Denormalized customer info
  customerName: {
    type: String
  },
  customerEmail: {
    type: String
  },
  customerPhone: {
    type: String
  },
  
  // Vehicle reference
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  
  // Denormalized vehicle info
  vehicleName: {
    type: String
  },
  vehicleImage: {
    type: String
  },
  vehicleType: {
    type: String
  },
  
  // Driver reference
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  
  // Location details
  pickupLocation: {
    type: String,
    required: true
  },
  dropLocation: {
    type: String,
    required: true
  },
  
  // Trip details
  tripType: {
    type: String,
    enum: ['outstation', 'hourly', 'local'],
    required: true
  },
  pickupDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    required: true
  },
  hours: {
    type: Number,
    min: 1
  },
  
  // Driver preferences
  needsDriver: {
    type: Boolean,
    default: false
  },
  driverGender: {
    type: String,
    enum: ['Any', 'Male', 'Female'],
    default: 'Any'
  },
  
  // Financial details
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  fareBreakdown: {
    type: Object,
    required: true
  },
  depositAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // ✅ NEW: Penalty/Damage fields
  hasPenalty: {
    type: Boolean,
    default: false
  },
  penaltyAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  damageReason: {
    type: String,
    default: null
  },
  penaltyPaid: {
    type: Boolean,
    default: false
  },
  penaltyPaymentId: {
    type: String,
    default: null
  },
  penaltyPaidAt: {
    type: Date,
    default: null
  },
  
  // Dates
  bookingDate: {
    type: Date,
    default: Date.now
  },
  tripDate: {
    type: Date,
    required: true
  },
  
  // Status with Penalty states
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'Pending Assignment',
      'Driver Assigned',
      'In Progress',
      'Waiting to pay penalty', // ✅ NEW status
      'completed',
      'cancelled'
    ],
    default: 'pending'
  },
  
  // Assignment tracking
  driverAssignedAt: {
    type: Date
  },
  driverAssignmentAttempts: {
    type: Number,
    default: 0
  },
  
  // Cancellation tracking
  cancellationReason: {
    type: String
  },
  cancelledAt: {
    type: Date
  },
  
  // Completion tracking
  completedAt: {
    type: Date
  },
  
  // Idempotency key
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  strictPopulate: false
});

// Indexes
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ vehicle: 1, status: 1 });
bookingSchema.index({ driver: 1, status: 1 });
bookingSchema.index({ pickupDate: 1, status: 1 });
bookingSchema.index({ status: 1, needsDriver: 1 });
bookingSchema.index({ hasPenalty: 1, penaltyPaid: 1 });

// Virtual for checking if booking is active
bookingSchema.virtual('isActive').get(function() {
  return ['confirmed', 'Pending Assignment', 'Driver Assigned', 'In Progress'].includes(this.status);
});

// Method to check if driver can be assigned
bookingSchema.methods.canAssignDriver = function() {
  return this.needsDriver && 
         !this.driver && 
         ['pending', 'confirmed', 'Pending Assignment'].includes(this.status);
};

// Method to assign driver
bookingSchema.methods.assignDriver = async function(driverId) {
  this.driver = driverId;
  this.status = 'Driver Assigned';
  this.driverAssignedAt = new Date();
  return await this.save();
};

// ✅ NEW: Method to apply penalty
bookingSchema.methods.applyPenalty = async function(penaltyAmount, damageReason) {
  this.hasPenalty = true;
  this.penaltyAmount = penaltyAmount;
  this.damageReason = damageReason;
  this.status = 'Waiting to pay penalty';
  this.penaltyPaid = false;
  return await this.save();
};

// ✅ NEW: Method to mark penalty as paid
bookingSchema.methods.markPenaltyPaid = async function(paymentId) {
  this.penaltyPaid = true;
  this.penaltyPaymentId = paymentId;
  this.penaltyPaidAt = new Date();
  this.status = 'completed';
  this.completedAt = new Date();
  return await this.save();
};

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;