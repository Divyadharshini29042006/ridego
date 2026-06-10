// backend/routes/contactRoutes.js

import express from 'express';
import ContactQuery from '../models/ContactQuery.js';
import User from '../models/User.js';
import Location from '../models/Location.js';
import { verifyToken, verifyAdmin, verifyManager } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ========================================
// USER ROUTES
// ========================================

// Submit Contact Query (Logged-in users only)
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const { name, email, mobile, issue, comments, city, subLocation } = req.body;

    // Validation
    if (!name || !email || !mobile || !issue || !comments || !city || !subLocation) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    let assignedTo = null;
    let assignedRole = null;

    // Handle "any" city/subLocation selection
    if (city === 'any' || subLocation === 'any') {
      // Assign to admin for general queries
      const admin = await User.findOne({ role: 'admin' });
      if (admin) {
        assignedTo = admin._id;
        assignedRole = 'admin';
      }
    } else {
      // Try to assign to Manager based on subLocation first (for all issues)
      const location = await Location.findOne({ name: subLocation });
      if (location) {
        const manager = await User.findOne({
          role: 'manager',
          assignedLocation: location._id
        });

        if (manager) {
          assignedTo = manager._id;
          assignedRole = 'manager';
        } else {
          // Fallback to admin if no manager found for the location
          const admin = await User.findOne({ role: 'admin' });
          if (admin) {
            assignedTo = admin._id;
            assignedRole = 'admin';
          }
        }
      } else {
        // Fallback to admin if location not found
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
          assignedTo = admin._id;
          assignedRole = 'admin';
        }
      }
    }

    // Create query
    const query = new ContactQuery({
      userId: req.user.id,
      name,
      email,
      mobile,
      issue,
      comments,
      city,
      subLocation,
      assignedTo,
      assignedRole,
      status: 'pending',
      priority: 'medium'
    });

    await query.save();

    res.status(201).json({
      message: 'Query submitted successfully',
      queryId: query._id
    });
  } catch (error) {
    console.error('Error submitting query:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's own queries
router.get('/my-queries', verifyToken, async (req, res) => {
  try {
    const queries = await ContactQuery.find({ userId: req.user.id })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json(queries);
  } catch (error) {
    console.error('Error fetching user queries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========================================
// ADMIN ROUTES
// ========================================

// Get all queries (Admin only)
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status, city, assignedRole } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (city) filter.city = city;
    if (assignedRole) filter.assignedRole = assignedRole;

    const queries = await ContactQuery.find(filter)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('repliedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(queries);
  } catch (error) {
    console.error('Error fetching admin queries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Respond to query (Admin only - for general inquiries)
router.post('/admin/respond/:queryId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { queryId } = req.params;
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const query = await ContactQuery.findById(queryId);

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    query.reply = reply;
    query.repliedBy = req.user.id;
    query.repliedAt = new Date();
    query.status = 'completed';
    query.resolvedAt = new Date();

    await query.save();

    res.json({ message: 'Response sent successfully', query });
  } catch (error) {
    console.error('Error responding to query:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reassign query (Admin only)
router.post('/admin/reassign/:queryId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { queryId } = req.params;
    const { managerId } = req.body;

    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(400).json({ message: 'Invalid manager ID' });
    }

    const query = await ContactQuery.findByIdAndUpdate(
      queryId,
      {
        assignedTo: managerId,
        assignedRole: 'manager',
        status: 'pending'
      },
      { new: true }
    );

    res.json({ message: 'Query reassigned successfully', query });
  } catch (error) {
    console.error('Error reassigning query:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========================================
// MANAGER ROUTES
// ========================================

// Get manager's assigned queries
router.get('/manager/assigned', verifyToken, verifyManager, async (req, res) => {
  try {
    const queries = await ContactQuery.find({
      assignedRole: 'manager',
      assignedTo: req.user.id
    })
      .populate('userId', 'name email mobile')
      .sort({ createdAt: -1 });

    res.json(queries);
  } catch (error) {
    console.error('Error fetching manager queries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update query status (Manager only)
router.patch('/manager/update-status/:queryId', verifyToken, verifyManager, async (req, res) => {
  try {
    const { queryId } = req.params;
    const { status, reply } = req.body;

    const query = await ContactQuery.findOne({
      _id: queryId,
      assignedTo: req.user.id
    });

    if (!query) {
      return res.status(404).json({ message: 'Query not found or not assigned to you' });
    }

    if (status) query.status = status;
    if (reply) {
      query.reply = reply;
      query.repliedBy = req.user.id;
      query.repliedAt = new Date();
    }

    if (status === 'completed') {
      query.resolvedAt = new Date();
    }

    await query.save();

    res.json({ message: 'Query updated successfully', query });
  } catch (error) {
    console.error('Error updating query:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========================================
// UTILITY ROUTES
// ========================================

// Get available cities
router.get('/cities', async (req, res) => {
  try {
    const cities = await Location.distinct('city');
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sublocations for a city
router.get('/sublocations/:city', async (req, res) => {
  try {
    const locations = await Location.find({ city: req.params.city }).select('name');
    const subLocations = locations.map(l => l.name);
    res.json(subLocations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
