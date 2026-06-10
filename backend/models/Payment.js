//backend/models/Payment.js

import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['razorpay', 'stripe'],
    required: true,
  },
  status: {
    type: String,
    enum: ['initiated', 'success', 'failed', 'invalid'],
    default: 'initiated',
  },
  transactionId: {
    type: String
  },
  signature: {
    type: String
  },
  paymentType: {
    type: String,
    enum: ['booking', 'penalty'],
    default: 'booking',
  },
  errorMessage: {
    type: String,
  },
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ booking: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
