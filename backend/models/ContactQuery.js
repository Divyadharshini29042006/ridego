// backend/models/ContactQuery.js

import mongoose from 'mongoose';

const contactQuerySchema = new mongoose.Schema({
  // User Information
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  
  // Query Details
  issue: { 
    type: String, 
    enum: ['general-inquiry', 'technical-support', 'booking-issue', 'billing-question', 'feedback', 'other'],
    required: true 
  },
  comments: { type: String, required: true },
  
  // Location Information
  city: { type: String, required: true },
  subLocation: { type: String, required: true },
  
  // Assignment & Status
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  assignedRole: { 
    type: String, 
    enum: ['admin', 'manager'], 
    default: null 
  },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'overdue'], 
    default: 'pending' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  
  // Response
  reply: { type: String, default: null },
  repliedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  repliedAt: { type: Date, default: null },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Calculate response time in hours
contactQuerySchema.virtual('responseTimeHours').get(function() {
  if (this.repliedAt) {
    return Math.round((this.repliedAt - this.createdAt) / (1000 * 60 * 60));
  }
  return null;
});

// Auto-update status to overdue if pending for more than 24 hours
contactQuerySchema.pre('save', function(next) {
  if (this.status === 'pending') {
    const hoursSinceCreation = (Date.now() - this.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      this.status = 'overdue';
    }
  }
  next();
});

export default mongoose.model('ContactQuery', contactQuerySchema);