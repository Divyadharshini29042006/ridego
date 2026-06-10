// backend/controllers/adminController.js

import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Location from '../models/Location.js';
import User from '../models/User.js';
import ContactQuery from '../models/ContactQuery.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';

export const getFilteredBookings = async (req, res) => {
  const { startDate, endDate, location, managerId } = req.query;

  const query = {};
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (location) query.location = location;
  if (managerId) query.manager = managerId;

  try {
    const bookings = await Booking.find(query).populate('manager');
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
};

export const getAllDriversForAdmin = async (req, res) => {
  try {
    const drivers = await Driver.find()
      .populate('location', 'name city')
      .populate('manager', 'name email'); // ✅ Add this line

    res.status(200).json(drivers);
  } catch (err) {
    console.error('❌ Error fetching drivers for admin:', err.message);
    res.status(500).json({ message: 'Error fetching drivers' });
  }
};
export const getResponseTimeMetrics = async (req, res) => {
  try {
    const queries = await ContactQuery.find({ resolvedAt: { $exists: true } });

    const metrics = queries.map(q => ({
      id: q._id,
      location: q.location,
      assignedTo: q.assignedTo,
      responseTimeHours: ((q.resolvedAt - q.createdAt) / (1000 * 60 * 60)).toFixed(2)
    }));

    res.status(200).json(metrics);
  } catch (err) {
    res.status(500).json({ message: 'Error calculating response times' });
  }
};

export const assignQueryToManager = async (req, res) => {
  const { queryId, managerId } = req.body;

  try {
    const updatedQuery = await ContactQuery.findByIdAndUpdate(
      queryId,
      { assignedTo: managerId },
      { new: true }
    ).populate('assignedTo');

    res.status(200).json(updatedQuery);
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign query' });
  }
};

export const getAllContactQueries = async (req, res) => {
  try {
    const queries = await ContactQuery.find()
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(queries);
  } catch (err) {
    console.error('❌ Error fetching contact queries:', err.message);
    res.status(500).json({ message: 'Error fetching contact queries' });
  }
};

export const replyToQuery = async (req, res) => {
  const { queryId, reply } = req.body;

  try {
    const updatedQuery = await ContactQuery.findByIdAndUpdate(
      queryId,
      {
        reply,
        status: 'completed',
        resolvedAt: new Date()
      },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!updatedQuery) {
      return res.status(404).json({ message: 'Query not found' });
    }

    res.status(200).json(updatedQuery);
  } catch (err) {
    console.error('❌ Error replying to query:', err.message);
    res.status(500).json({ message: 'Failed to reply to query' });
  }
};

export const getTotalBookings = async (req, res) => {
  try {
    const count = await Booking.countDocuments();
    res.status(200).json({ total: count });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching booking count' });
  }
};
export const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    await booking.save();

    res.status(200).json({ message: 'Status updated', booking });
  } catch (err) {
    res.status(500).json({ message: 'Error updating booking status' });
  }
};

export const getAllBookingsWithPayment = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name email')
      .populate('vehicle', 'model')
      .populate('driver', 'name')
      .lean();

    const payments = await Payment.find().lean();

    const bookingsWithPayment = bookings.map((b) => {
      const payment = payments.find((p) => p.booking.toString() === b._id.toString());
      return { ...b, payment };
    });

    res.status(200).json(bookingsWithPayment);
  } catch (err) {
    console.error('❌ Error fetching bookings with payment:', err.message);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('customer', 'name email')
      .populate({
        path: 'booking',
        populate: [
          { path: 'vehicle', select: 'vehicleModel brand' },
          { path: 'driver', select: 'name' }
        ]
      })
      .lean();

    res.status(200).json(payments);
  } catch (err) {
    console.error('❌ Error fetching payments:', err.message);
    res.status(500).json({ message: 'Error fetching payments' });
  }
};
// Update Location
export const updateLocation = async (req, res) => {
  const { id } = req.params;
  const { name, city, state, managerId } = req.body;

  try {
    const location = await Location.findById(id);
    if (!location) return res.status(404).json({ message: 'Location not found' });

    location.name = name;
    location.city = city;
    location.state = state;
    location.managerId = managerId;

    await location.save();
    res.status(200).json({ message: 'Location updated', location });
  } catch (err) {
    res.status(500).json({ message: 'Error updating location' });
  }
};
// Delete Location
export const deleteLocation = async (req, res) => {
  const { id } = req.params;

  try {
    const location = await Location.findByIdAndDelete(id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    console.log(`🗑 Deleted location: ${location.name} (${location.city}, ${location.state})`);
    res.status(200).json({ message: 'Location deleted' });
  } catch (err) {
    console.error('❌ Delete error:', err.message);
    res.status(500).json({ message: 'Error deleting location' });
  }
};
//update manager

export const updateManager = async (req, res) => {
  console.log('🛠 Update payload:', req.body);
  console.log('🖼 Uploaded file:', req.file);

  const { id } = req.params;
  const { name, email, password, assignedLocation } = req.body;
    const imagePath = req.file?.path;

    try {
      const manager = await User.findById(id);
      if (!manager || manager.role !== 'manager') {
        return res.status(404).json({ message: 'Manager not found' });
      }

      const previousLocationId = manager.assignedLocation?.toString();

      // 🔄 Handle location reassignment
      if (assignedLocation && assignedLocation !== previousLocationId) {
        const newLocation = await Location.findById(assignedLocation);

        if (!newLocation) {
          return res.status(404).json({ message: 'Assigned location not found' });
        }

        if (newLocation.managerId && newLocation.managerId.toString() !== manager._id.toString()) {
          return res.status(400).json({ message: 'This location is already assigned to another manager' });
        }

        // ✅ Update manager's assignedLocation
        manager.assignedLocation = assignedLocation;

        // ✅ Update new location's managerId
        await Location.findByIdAndUpdate(assignedLocation, { managerId: manager._id });

        // 🧹 Clear previous location's managerId
        if (previousLocationId) {
          await Location.findByIdAndUpdate(previousLocationId, { managerId: null });
        }
      }

      // ✅ Update only provided fields
      if (name) manager.name = name;
      if (email) manager.email = email;
      if (password && password.trim()) {
        manager.password = password; // will be hashed via pre-save hook
      }
      if (imagePath) {
        // Store only the filename, not full path
        const filename = req.file.filename || req.file.path.split('\\').pop().split('/').pop();
        manager.profileImage = filename;
      }

      try {
        await manager.save();
      } catch (err) {
        console.error('❌ Save error:', err.message);
        return res.status(500).json({ message: 'Error saving manager' });
      }

      res.status(200).json({ message: 'Manager updated and location synced', manager });
    } catch (err) {
      console.error('❌ Update error:', err);
      res.status(500).json({ message: 'Server error during update' });
    }
};
// Delete Manager
export const deleteManager = async (req, res) => {
  const { id } = req.params;

  try {
    const manager = await User.findById(id);
    if (!manager || manager.role !== 'manager') {
      return res.status(404).json({ message: 'Manager not found' });
    }

    // ✅ Clear managerId from assigned location
    if (manager.assignedLocation) {
      await Location.findByIdAndUpdate(manager.assignedLocation, { managerId: null });
    }

    await User.findByIdAndDelete(id);
    res.status(200).json({ message: 'Manager deleted and location unassigned' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting manager' });
  }
};

export const getUsersByRole = async (req, res) => {
  const { role } = req.query;
  try {
    const users = await User.find({ role }).populate('assignedLocation');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users by role' });
  }
};

export const getAllVehiclesForAdmin = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('assignedLocation', 'name city')
      .populate('managerId', 'name email');

    res.status(200).json({ vehicles });
  } catch (err) {
    console.error('❌ Error fetching vehicles for admin:', err.message);
    res.status(500).json({ message: 'Error fetching vehicles' });
  }
};
export const getAllBookings = async (req, res) => {
  try {
    const { startDate, endDate, location, managerId } = req.query;

    const query = {};

    // Date filter
    if (startDate && endDate) {
      query.pickupDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Location filter (matches pickup or drop)
    if (location) {
      query.$or = [
        { pickupLocation: new RegExp(location, 'i') },
        { dropLocation: new RegExp(location, 'i') }
      ];
    }

    // Manager filter (through location)
    if (managerId) {
      // Find locations managed by this manager
      const locations = await Location.find({ managerId });
      const locationNames = locations.map(loc => `${loc.city} - ${loc.name}`);

      query.$or = [
        { pickupLocation: { $in: locationNames } },
        { dropLocation: { $in: locationNames } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name email phone')
      .populate('vehicle', 'vehicleModel brand vehicleNumber vehicleType')
      .populate('driver', 'name phone gender status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings,
      total: bookings.length
    });
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: err.message
    });
  }
};

export const getDashboardMetrics = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const totalDrivers = await Driver.countDocuments();
    const totalManagers = await User.countDocuments({ role: 'manager' });

    res.status(200).json({
      totalBookings,
      totalPayments,
      totalDrivers,
      totalManagers
    });
  } catch (err) {
    console.error('❌ Error fetching dashboard metrics:', err.message);
    res.status(500).json({ message: 'Error fetching dashboard metrics' });
  }
};

export const getAnalyticsData = async (req, res) => {
  try {
    // Total revenue (sum of successful payments)
    const totalRevenueResult = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Total bookings
    const totalBookings = await Booking.countDocuments();

    // Completed and cancelled trip counts
    const completedTrips = await Booking.countDocuments({ status: 'completed' });
    const cancelledTrips = await Booking.countDocuments({ status: 'cancelled' });

    // Top locations by revenue (based on payments linked to bookings)
    const topLocationsByRevenue = await Payment.aggregate([
      { $match: { status: 'success' } },
      {
        $lookup: {
          from: 'bookings',
          localField: 'booking',
          foreignField: '_id',
          as: 'booking'
        }
      },
      { $unwind: '$booking' },
      {
        $group: {
          _id: '$booking.pickupLocation',
          revenue: { $sum: '$amount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Top vehicles by bookings
    const topVehiclesByBookings = await Booking.aggregate([
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicle',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $unwind: '$vehicle' },
      {
        $group: {
          _id: '$vehicle._id',
          vehicleName: { $first: '$vehicle.vehicleModel' },
          brand: { $first: '$vehicle.brand' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: 10 }
    ]);

    // Monthly revenue trend (last 12 months)
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'success' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' }
                }
              }
            ]
          },
          revenue: 1,
          bookings: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    res.status(200).json({
      totalRevenue,
      totalBookings,
      completedTrips,
      cancelledTrips,
      topLocationsByRevenue,
      topVehiclesByBookings,
      monthlyRevenue
    });
  } catch (err) {
    console.error('❌ Error fetching analytics data:', err.message);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
};
