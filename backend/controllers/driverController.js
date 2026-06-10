// controllers/driverController.js

import Driver from '../models/Driver.js';
import User from '../models/User.js';
import Location from '../models/Location.js';
import Vehicle from '../models/Vehicle.js';

export const createDriver = async (req, res) => {
  const { name, email, phone, gender, licenseNumber, subLocation } = req.body;
  const managerId = req.user._id;

  const image = req.files?.image?.[0]?.path;
  const licenseFile = req.files?.licenseFile?.[0]?.path;

  try {
    // 🔍 Fetch manager and assigned location
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied: not a manager' });
    }

    const location = manager.assignedLocation;
    if (!location) {
      return res.status(400).json({ message: 'Manager has no assigned location' });
    }

    // 🚫 Check for duplicate driver in same location
    const duplicateLicense = await Driver.findOne({ licenseNumber, location });
    if (duplicateLicense) {
      return res.status(400).json({ message: 'Driver already exists in this location with this license number' });
    }

    const duplicatePhone = await Driver.findOne({ phone, location });
    if (duplicatePhone) {
      return res.status(400).json({ message: 'Driver already exists in this location with this phone number' });
    }

    const driver = new Driver({
      manager: managerId,
      location,
      subLocation: subLocation || 'Main Location',
      name,
      email,
      phone,
      gender,
      licenseNumber,
      image,
      licenseFile,
    });

    await driver.save();
    res.status(201).json({ message: 'Driver created', driver });
  } catch (error) {
    console.error('❌ Driver creation error:', error.message);
    res.status(500).json({ message: 'Error creating driver' });
  }
};

//
// 📄 Get Drivers by Manager (paginated)
//
export const getDriversByManager = async (req, res) => {
  const managerId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    const drivers = await Driver.find({ manager: managerId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('location');

    const total = await Driver.countDocuments({ manager: managerId });

    res.status(200).json({
      drivers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('❌ Fetch drivers error:', error.message);
    res.status(500).json({ message: 'Error fetching drivers' });
  }
};

//
// ✅ Get Available Drivers by Manager (for booking assignment)
//
export const getAvailableDriversByManager = async (req, res) => {
  const managerId = req.user._id;

  try {
    const drivers = await Driver.find({
      manager: managerId,
      status: 'Available'
    })
      .sort({ createdAt: -1 })
      .populate('location');

    res.status(200).json({
      drivers,
      total: drivers.length
    });
  } catch (error) {
    console.error('❌ Fetch available drivers error:', error.message);
    res.status(500).json({ message: 'Error fetching available drivers' });
  }
};

//
// ✏️ Update Driver (location auto-synced to manager)
//
export const updateDriver = async (req, res) => {
  const { name, phone, licenseNumber, status, subLocation } = req.body;
  const managerId = req.user._id;
  const driverId = req.params.id;

  const image = req.files?.image?.[0]?.path;
  const licenseFile = req.files?.licenseFile?.[0]?.path;

  try {
    const driver = await Driver.findOne({ _id: driverId, manager: managerId });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found or unauthorized' });
    }

    const manager = await User.findById(managerId);
    driver.location = manager.assignedLocation; // ✅ Sync location

    if (name) driver.name = name;
    if (phone) driver.phone = phone;
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (status) driver.status = status;
    if (subLocation) driver.subLocation = subLocation;
    if (image) driver.image = image;
    if (licenseFile) driver.licenseFile = licenseFile;

    await driver.save();
    res.status(200).json({ message: 'Driver updated successfully', driver });
  } catch (error) {
    console.error('❌ Driver update error:', error.message);
    res.status(500).json({ message: 'Error updating driver' });
  }
};

//
// 🗑️ Delete Driver (manager ownership enforced)
//
export const deleteDriver = async (req, res) => {
  const managerId = req.user._id;
  const driverId = req.params.id;

  try {
    const driver = await Driver.findOneAndDelete({ _id: driverId, manager: managerId });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found or unauthorized' });
    }

    res.status(200).json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('❌ Driver deletion error:', error.message);
    res.status(500).json({ message: 'Error deleting driver' });
  }
};

//
// 📍 Get Available Drivers by Location (for booking)
//
export const getDriversByLocation = async (req, res) => {
  const { city } = req.params;

  try {
    const location = await Location.findOne({ city: new RegExp(`^${city}$`, 'i') });
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const drivers = await Driver.find({ location: location._id, status: 'Available' }).populate('location');
    res.status(200).json({ drivers });
  } catch (error) {
    console.error('❌ Error fetching drivers by location:', error.message);
    res.status(500).json({ message: 'Error fetching drivers' });
  }
};

//
// 🚗 Get Drivers with Filters (for booking)
//
export const getDriversWithFilters = async (req, res) => {
  const { city, location: subLocation, gender, vehicleId } = req.query;

  try {
    let drivers = [];
    let useFallback = true;

    // If vehicleId provided, prioritize fetching the assigned driver
    if (vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId).populate('assignedDriver');
      if (vehicle && vehicle.assignedDriver && vehicle.assignedDriver.status === 'Available') {
        drivers = [vehicle.assignedDriver];
        useFallback = false;
        console.log(`Returning assigned driver for vehicle ${vehicleId}`);
      } else if (vehicle && !vehicle.assignedDriver) {
        // No assigned driver for vehicle ${vehicleId}, falling back to location drivers
      } else if (!vehicle) {
        // Vehicle ${vehicleId} not found, falling back to location drivers
      } else {
        // Assigned driver exists but not available
        // Assigned driver for vehicle ${vehicleId} is not available, falling back to location drivers
      }
    }

    // Fall back to location-based filtering if no assigned driver or vehicle issues
    if (useFallback) {
      let query = { status: 'Available' };

      if (city) {
        const loc = await Location.findOne({ city: new RegExp(`^${city}$`, 'i') });
        if (loc) {
          query.location = loc._id;
        } else {
          return res.status(404).json({ message: 'City not found' });
        }
      }

      if (subLocation) {
        if (subLocation === 'Main Location') {
          // For main location, include drivers with null/undefined or 'Main Location'
          query.subLocation = { $in: [null, 'Main Location'] };
        } else {
          // For specific sublocation, exact match (case insensitive)
          query.subLocation = { $regex: new RegExp(`^${subLocation}$`, 'i') };
        }
      }

      if (gender && gender !== 'Any') {
        query.gender = gender;
      }

      drivers = await Driver.find(query).populate('location');
    }

    res.status(200).json({ drivers });
  } catch (error) {
    console.error('❌ Error fetching drivers with filters:', error.message);
    res.status(500).json({ message: 'Error fetching drivers' });
  }
};

//
// 🔄 Update Driver Status (for booking assignment)
//
export const updateDriverStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    driver.status = status;
    await driver.save();
    res.status(200).json({ message: 'Driver status updated', driver });
  } catch (error) {
    console.error('❌ Error updating driver status:', error.message);
    res.status(500).json({ message: 'Error updating driver status' });
  }
};
