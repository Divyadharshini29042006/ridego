import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Location from '../models/Location.js';
import { manuallyAssignDriver } from '../services/driverAssignmentService.js';

//
// 📊 Manager Dashboard
//
export const getManagerDashboard = async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await User.findById(managerId).populate('assignedLocation');

    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const locationId = manager.assignedLocation?._id;

    const driverCount = await Driver.countDocuments({ location: locationId });
    const vehicleCount = await Vehicle.countDocuments({ assignedLocation: locationId });

    // Count bookings where vehicle is assigned to this location
    const vehicleIds = await Vehicle.find({ assignedLocation: locationId }).select('_id');
    const bookingCount = await Booking.countDocuments({ vehicle: { $in: vehicleIds } });

    const available = await Vehicle.countDocuments({ assignedLocation: locationId, status: 'Available' });
    const booked = await Vehicle.countDocuments({ assignedLocation: locationId, status: 'Booked' });
    const maintenance = await Vehicle.countDocuments({ assignedLocation: locationId, status: 'Maintenance' });

    res.json({
      manager: {
        name: manager.name,
        email: manager.email,
        profileImage: manager.profileImage || null,
        assignedLocation: manager.assignedLocation,
        createdAt: manager.createdAt,
      },
      stats: {
        drivers: driverCount,
        vehicles: vehicleCount,
        bookings: bookingCount,
        available,
        booked,
        maintenance,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

//
// 👤 Get Manager Profile
//
export const getManagerProfile = async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await User.findById(managerId).populate('assignedLocation');

    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!manager.assignedLocation) {
      return res.status(404).json({ message: 'No location assigned to this manager' });
    }

    // ✅ Fetch all sublocations in the same city
    const city = manager.assignedLocation.city;
    const allSubLocations = await Location.find({ city: city })
      .select('name city')
      .sort({ name: 1 });

    // ✅ WRAP RESPONSE IN 'manager' OBJECT FOR CONSISTENCY
    res.json({
      manager: {
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        profileImage: manager.profileImage,
        assignedLocation: manager.assignedLocation,
        availableSubLocations: allSubLocations.map(loc => loc.name),
        city: city,
        createdAt: manager.createdAt,
      }
    });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

//
// ✅ Get Manager Details (for AddDriver.jsx autofill)
//
export const getManagerDetails = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id).populate('assignedLocation');
    if (!manager || manager.role !== 'manager') {
      return res.status(404).json({ message: 'Manager not found or unauthorized' });
    }

    res.status(200).json({
      manager: {
        _id: manager._id,
        name: manager.name,
        email: manager.email,
        profileImage: manager.profileImage,
        assignedLocation: manager.assignedLocation,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching manager details:', error.message);
    res.status(500).json({ message: 'Error fetching manager details' });
  }
};

//
// ✏️ Update Manager Profile
//
export const updateManagerProfile = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { name, email, phone, password, oldPassword, newPassword, confirmPassword } = req.body;

    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if oldPassword is provided and matches the current password
    if (oldPassword && !await manager.comparePassword(oldPassword)) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // If newPassword is provided, validate it
    if (newPassword) {
      // Ensure newPassword and confirmPassword match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New password and confirm password do not match' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }
      manager.password = newPassword;  // Update password
    }

    // Update other fields
    if (name) manager.name = name;
    if (email) manager.email = email;
    if (phone) manager.phone = phone;

    await manager.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};


//
// 🚗 Get Manager's Vehicles
//
export const getManagerVehicles = async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await User.findById(managerId).populate('assignedLocation');

    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const locationId = manager.assignedLocation?._id;
    const vehicles = await Vehicle.find({ assignedLocation: locationId })
      .populate('assignedLocation')
      .populate({
        path: 'assignedDriver',
        select: 'name phone subLocation status gender'
      });
    res.status(200).json(vehicles);
  } catch (err) {
    console.error('Error fetching vehicles:', err.message);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

//
// 📅 Get Manager's Bookings
//
export const getManagerBookings = async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await User.findById(managerId).populate('assignedLocation');

    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const locationId = manager.assignedLocation?._id;

    // Find vehicles assigned to this location
    const vehicleIds = await Vehicle.find({ assignedLocation: locationId }).select('_id');

    // Find bookings for these vehicles
    const bookings = await Booking.find({ vehicle: { $in: vehicleIds } })
      .populate('customer', 'name email phone')
      .populate('vehicle')
      .populate('driver', 'name phone gender');

    // Calculate stats
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => {
      const status = b.status?.toLowerCase().trim();
      return status === 'pending' ||
             status === 'pending assignment' ||
             status === 'need driver';
    }).length;

    // Remove driver assigned count and add cancelled count
    const cancelledBookings = bookings.filter(b => {
      const status = b.status?.toLowerCase().trim();
      return status === 'cancelled';
    }).length;

    const completedBookings = bookings.filter(b => {
      const status = b.status?.toLowerCase().trim();
      return status === 'completed' ||
             status === 'waiting to pay penalty';
    }).length;

    res.status(200).json({
      bookings,
      location: manager.assignedLocation,
      stats: {
        total: totalBookings,
        pending: pendingBookings,
        cancelled: cancelledBookings,  // Changed from confirmed to cancelled
        completed: completedBookings
      }
    });
  } catch (err) {
    console.error('Error fetching bookings:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

//
// 🚗 Create Vehicle (manager-side)
//
export const createVehicle = async (req, res) => {
  try {
    const managerId = req.user.id;
    const {
      vehicleModel,
      vehicleNumber,
      brand,
      color,
      vehicleType,
      fuelType,
      seatingCapacity,
      transmission,
      rentPerDay,
      depositAmount,
    } = req.body;

    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const exists = await Vehicle.findOne({ vehicleNumber });
    if (exists) {
      return res.status(400).json({ message: 'Vehicle number already exists' });
    }

    const imagePath = req.file ? req.file.filename : null;

    const newVehicle = new Vehicle({
      vehicleModel,
      vehicleNumber,
      brand,
      color,
      vehicleType,
      fuelType,
      seatingCapacity,
      transmission,
      rentPerDay,
      depositAmount,
      vehicleImage: imagePath,
      managerId,
      assignedLocation: manager.assignedLocation,
    });

    await newVehicle.save();
    res.status(201).json({ message: 'Vehicle created successfully', vehicle: newVehicle });
  } catch (err) {
    console.error('Failed to create vehicle:', err.stack);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

export const updateManagerProfileImage = async (req, res) => {
  try {
    const managerId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Save only the filename, normalize to use forward slashes if needed
    let filename = req.file.filename;
    // Remove any directory path if present, keep only the basename
    filename = filename.split(/[/\\]/).pop();
    manager.profileImage = filename;

    await manager.save();

    res.json({ message: 'Profile image updated successfully' });
  } catch (err) {
    console.error('Update profile image error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

//
// 💳 Get Manager's Payments (for their location)
//
export const getManagerPayments = async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await User.findById(managerId).populate('assignedLocation');

    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const locationId = manager.assignedLocation?._id;

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find vehicles assigned to this location
    const vehicleIds = await Vehicle.find({ assignedLocation: locationId }).select('_id');

    // Find bookings for these vehicles
    const bookingIds = await Booking.find({ vehicle: { $in: vehicleIds } }).select('_id');

    // Find payments for these bookings with pagination
    const payments = await Payment.find({ booking: { $in: bookingIds } })
      .populate('customer', 'name email')
      .populate({
        path: 'booking',
        populate: [
          { path: 'vehicle', select: 'vehicleModel brand vehicleNumber' },
          { path: 'driver', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalPayments = await Payment.countDocuments({ booking: { $in: bookingIds } });
    const totalPages = Math.ceil(totalPayments / limit);

    res.status(200).json({
      payments,
      pagination: {
        currentPage: page,
        totalPages,
        totalPayments,
        limit
      }
    });
  } catch (err) {
    console.error('Error fetching payments:', err.message);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};

//
// 🚗 Manually Assign Driver to Booking (Manager Override)
//
export const assignDriverToBooking = async (req, res) => {
  try {
    const { bookingId, driverId } = req.body;
    const managerId = req.user.id;

    // Verify manager
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate inputs
    if (!bookingId || !driverId) {
      return res.status(400).json({ message: 'Booking ID and Driver ID are required' });
    }

    // Check if booking exists and belongs to manager's location
    const booking = await Booking.findById(bookingId).populate('vehicle');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify booking belongs to manager's location
    if (booking.vehicle?.assignedLocation?.toString() !== manager.assignedLocation?.toString()) {
      return res.status(403).json({ message: 'Booking does not belong to your location' });
    }

    // Check if booking needs driver and doesn't already have one
    if (!booking.needsDriver) {
      return res.status(400).json({ message: 'This booking does not require a driver' });
    }

    if (booking.driver) {
      return res.status(400).json({ message: 'Driver already assigned to this booking' });
    }

    // Check if driver exists and is available
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (driver.status !== 'Available') {
      return res.status(400).json({ message: 'Driver is not available' });
    }

    // Verify driver belongs to manager's location
    if (driver.location?.toString() !== manager.assignedLocation?.toString()) {
      return res.status(403).json({ message: 'Driver does not belong to your location' });
    }

    // Update driver status using an atomic update to avoid triggering validation errors
    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      { $set: { status: 'Assigned' } },
      { new: true, runValidators: false } // do not run validators here
    );
    // fallback in case findByIdAndUpdate returned null (very unlikely)
    const driverToReturn = updatedDriver || driver;

    // Update booking
    booking.driver = driverId;
    booking.status = 'Driver Assigned';
    booking.driverAssignedAt = new Date();
    await booking.save();

    // Update vehicle status and assigned driver
    if (booking.vehicle) {
      await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
        status: 'Booked',
        assignedDriver: driverId
      });
    }

    // Fetch updated booking with populated data
    const updatedBooking = await Booking.findById(bookingId)
      .populate('customer', 'name email phone')
      .populate('vehicle')
      .populate('driver', 'name phone gender');

    res.status(200).json({
      message: 'Driver assigned successfully',
      booking: updatedBooking,
      driver: {
        id: driverToReturn._id,
        name: driverToReturn.name,
        phone: driverToReturn.phone,
        gender: driverToReturn.gender
      }
    });

  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({ message: 'Failed to assign driver' });
  }
};
