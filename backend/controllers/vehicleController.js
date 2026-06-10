// backend/controllers/vehicleController.js
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Location from '../models/Location.js';
import { ensureValidRentData } from '../utils/vehicleValidator.js';

// 🚗 Create Vehicle
export const createVehicle = async (req, res) => {
  console.log('Received vehicle data:', req.body);
  const {
    vehicleModel,
    brand,
    color,
    vehicleType,
    fuelType,
    seatingCapacity,
    transmission,
    rentPerDay,
    rentPerHour,
    depositAmount,
    vehicleNumber,
    modelYear,
    mileage,
    subLocation, // Add subLocation from request
  } = req.body;

  // Parse numeric fields
  const parsedRentPerDay = rentPerDay ? parseFloat(rentPerDay) : 0;
  const parsedRentPerHour = rentPerHour ? parseFloat(rentPerHour) : 0;
  const parsedDepositAmount = depositAmount ? parseFloat(depositAmount) : 0;
  const parsedSeatingCapacity = seatingCapacity ? parseInt(seatingCapacity) : 0;
  const parsedModelYear = modelYear ? parseInt(modelYear) : new Date().getFullYear();
  const parsedMileage = mileage || null; // Keep as string since model expects String

  // Validate rent fields
  if (isNaN(parsedRentPerDay) || parsedRentPerDay < 0) {
    return res.status(400).json({ message: 'Invalid rentPerDay value' });
  }
  if (isNaN(parsedRentPerHour) || parsedRentPerHour < 0) {
    return res.status(400).json({ message: 'Invalid rentPerHour value' });
  }
  if (isNaN(parsedDepositAmount) || parsedDepositAmount < 0) {
    return res.status(400).json({ message: 'Invalid depositAmount value' });
  }
  if (isNaN(parsedSeatingCapacity) || parsedSeatingCapacity < 0) {
    return res.status(400).json({ message: 'Invalid seatingCapacity value' });
  }
  if (isNaN(parsedModelYear) || parsedModelYear < 1900 || parsedModelYear > new Date().getFullYear() + 1) {
    return res.status(400).json({ message: 'Invalid modelYear value' });
  }

  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const managerId = manager._id;
    const image = req.file ? req.file.filename : null;

    const exists = await Vehicle.findOne({ vehicleNumber });
    if (exists) {
      return res.status(400).json({ message: 'Vehicle number already exists' });
    }

    const vehicle = new Vehicle({
      managerId,
      assignedLocation: manager.assignedLocation,
      subLocation: subLocation || '', // Store the selected sub-city
      vehicleModel,
      brand,
      color,
      vehicleType,
      fuelType,
      seatingCapacity: parsedSeatingCapacity,
      transmission,
      rentPerDay: parsedRentPerDay,
      rentPerHour: parsedRentPerHour,
      depositAmount: parsedDepositAmount,
      vehicleNumber,
      modelYear: parsedModelYear,
      mileage: parsedMileage,
      vehicleImage: image,
    });

    await vehicle.save();
    res.status(201).json({ message: 'Vehicle created successfully', vehicle });
  } catch (error) {
    console.error('❌ Vehicle creation error:', error.message);
    res.status(500).json({ message: 'Error creating vehicle', errors: error.errors || error.message });
  }
};

// 📍 Get Vehicles by Manager's Location
export const getVehiclesByLocation = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const vehicles = await Vehicle.find({ assignedLocation: manager.assignedLocation })
      .populate('assignedLocation', 'name city subCities')
      .sort({ createdAt: -1 });

    res.status(200).json({ vehicles });
  } catch (error) {
    console.error('❌ Error fetching vehicles:', error.message);
    res.status(500).json({ message: 'Error fetching vehicles' });
  }
};

// 📦 Get Vehicles by Manager ID
export const getManagerVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ managerId: req.user.id })
      .populate('assignedLocation', 'name city subCities')
      .populate('assignedDriver', 'name phone subLocation status');
    res.status(200).json({ vehicles });
  } catch (err) {
    console.error('❌ Error fetching vehicles:', err.message);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

// ✏️ Update Vehicle (image not required)
export const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const managerId = req.user.id;

  try {
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const vehicle = await Vehicle.findOne({ _id: id, assignedLocation: manager.assignedLocation });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found or access denied' });
    }

    const updates = req.body;

    // Include subLocation in allowed updates
    const allowedUpdates = [
      'vehicleModel', 'brand', 'color', 'vehicleType', 'fuelType', 
      'seatingCapacity', 'transmission', 'rentPerDay', 'rentPerHour', 
      'depositAmount', 'vehicleNumber', 'modelYear', 'mileage', 
      'vehicleImage', 'subLocation'
    ];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        vehicle[field] = updates[field];
      }
    });
    
    await vehicle.save();

    res.status(200).json({ message: 'Vehicle updated successfully', vehicle });
  } catch (error) {
    console.error('❌ Error updating vehicle:', error.message);
    res.status(500).json({ message: 'Error updating vehicle' });
  }
};

// 🗑️ Delete Vehicle
export const deleteVehicle = async (req, res) => {
  const { id } = req.params;
  const managerId = req.user.id;

  try {
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const vehicle = await Vehicle.findOneAndDelete({ 
      _id: id, 
      assignedLocation: manager.assignedLocation 
    });
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found or access denied' });
    }

    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting vehicle:', error.message);
    res.status(500).json({ message: 'Error deleting vehicle' });
  }
};

// 🔄 Update Vehicle Status
export const updateVehicleStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Available', 'Booked', 'Maintenance'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const previousStatus = vehicle.status;
    vehicle.status = status;
    await vehicle.save();

    console.log(`✅ Vehicle ${vehicle.vehicleNumber} status changed from ${previousStatus} to ${status}`);
    res.status(200).json({ message: 'Status updated successfully', vehicle });
  } catch (error) {
    console.error('❌ Error updating status:', error.message);
    res.status(500).json({ message: 'Error updating status' });
  }
};

// 📋 Vehicle Details + Booking History
export const getVehicleWithBookings = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('assignedLocation', 'name city subCities');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const bookings = await Booking.find({ vehicle: vehicle._id }).populate('customer');
    res.json({ vehicle, bookings });
  } catch (err) {
    console.error('❌ Error fetching vehicle details:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// 📊 Vehicle Summary
export const getVehicleSummary = async (req, res) => {
  try {
    const managerId = req.user._id;

    const vehicles = await Vehicle.find({ managerId });
    const bookings = await Booking.find({ vehicle: { $in: vehicles.map(v => v._id) } });

    const summary = {
      total: vehicles.length,
      available: vehicles.filter(v => v.status === 'Available').length,
      booked: vehicles.filter(v => v.status === 'Booked').length,
      maintenance: vehicles.filter(v => v.status === 'Maintenance').length,
      mostBooked: [],
      idleVehicles: [],
    };

    // Count bookings per vehicle
    const bookingCount = {};
    bookings.forEach(b => {
      const id = b.vehicle.toString();
      bookingCount[id] = (bookingCount[id] || 0) + 1;
    });

    summary.mostBooked = vehicles
      .filter(v => bookingCount[v._id])
      .sort((a, b) => bookingCount[b._id] - bookingCount[a._id])
      .slice(0, 5);

    const now = new Date();
    summary.idleVehicles = vehicles.filter(v => {
      const lastBooking = bookings
        .filter(b => b.vehicle.toString() === v._id.toString())
        .sort((a, b) => new Date(b.tripDate) - new Date(a.tripDate))[0];
      return !lastBooking || new Date(lastBooking.tripDate) < new Date(now - 7 * 24 * 60 * 60 * 1000);
    });

    res.json(summary);
  } catch (err) {
    console.error('❌ Error generating summary:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔍 Get Vehicle by ID (Manager)
export const getVehicleById = async (req, res) => {
  const { id } = req.params;
  const managerId = req.user.id;

  try {
    const vehicle = await Vehicle.findOne({ _id: id, managerId })
      .populate('assignedLocation', 'name city subCities');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found or access denied' });
    }
    res.status(200).json({ vehicle });
  } catch (error) {
    console.error('❌ Error fetching vehicle by ID:', error.message);
    res.status(500).json({ message: 'Error fetching vehicle' });
  }
};

// 🌐 Get Public Vehicle by ID
export const getPublicVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id)
      .populate('assignedLocation', 'name city subCities');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.status(200).json({ vehicle });
  } catch (error) {
    console.error('❌ Error fetching vehicle by ID:', error.message);
    res.status(500).json({ message: 'Error fetching vehicle' });
  }
};

// 📍 Update Vehicle Location
export const updateVehicleLocation = async (req, res) => {
  const { vehicleId } = req.params;
  const { lat, lng } = req.body;

  try {
    // Validate input
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'Invalid latitude or longitude' });
    }

    // Find and update vehicle location
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    vehicle.currentLocation = {
      lat,
      lng,
      updatedAt: new Date(),
    };

    await vehicle.save();

    console.log(`📍 Vehicle ${vehicle.vehicleNumber} location updated: lat=${lat}, lng=${lng}`);

    res.status(200).json({
      message: 'Vehicle location updated successfully',
      vehicle: {
        _id: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        currentLocation: vehicle.currentLocation,
      },
    });
  } catch (error) {
    console.error('❌ Error updating vehicle location:', error.message);
    res.status(500).json({ message: 'Error updating vehicle location' });
  }
};

export const getPublicVehicles = async (req, res) => {
  try {
    const { city, subLocation, vehicleType, fuelType } = req.query;

    console.log('Received filters:', { city, subLocation, vehicleType, fuelType });

    let vehicleFilter = {
      status: 'Available',
      $or: [
        { rentPerDay: { $gt: 0 } },
        { rentPerHour: { $gt: 0 } }
      ]
    };

    // If both city and subLocation provided, find the specific location by city and name, then filter vehicles by exact assignedLocation
    if (city && subLocation) {
      const location = await Location.findOne({
        city: { $regex: new RegExp(`^${city.trim()}$`, 'i') },
        name: { $regex: new RegExp(`^${subLocation.trim()}$`, 'i') }
      });
      console.log('City + subLocation location filter:', { city: city.trim(), name: subLocation.trim() });
      if (!location) {
        console.log('No specific location found for city and subLocation, returning empty array');
        return res.status(200).json([]);
      }
      vehicleFilter.assignedLocation = location._id;
      console.log(`Filtering vehicles assigned to location ${location.name} (${location._id}) in ${city}`);
    } else if (city) {
      // Only city: find all locations in that city
      const locationFilter = {
        city: { $regex: new RegExp(`^${city.trim()}$`, 'i') }
      };

      console.log('City-only location filter:', locationFilter);

      const locations = await Location.find(locationFilter);
      console.log(`Found ${locations.length} locations for city ${city}:`, locations.map(l => ({ id: l._id, name: l.name, city: l.city })));

      if (locations.length === 0) {
        console.log('No locations found for city, returning empty array');
        return res.status(200).json([]);
      }

      vehicleFilter.assignedLocation = { $in: locations.map(loc => loc._id) };
    }

    if (vehicleType) {
      vehicleFilter.vehicleType = { $regex: new RegExp(`^${vehicleType.trim()}$`, 'i') };
    }

    if (fuelType) {
      vehicleFilter.fuelType = { $regex: new RegExp(`^${fuelType.trim()}$`, 'i') };
    }

    console.log('Vehicle filter:', JSON.stringify(vehicleFilter, null, 2));

    // Find vehicles
    const vehicles = await Vehicle.find(vehicleFilter)
      .populate('assignedLocation', 'name city')
      .populate('assignedDriver', 'name subLocation status')
      .sort({ createdAt: -1 });

    // Ensure all vehicles have valid rent data
    const validatedVehicles = vehicles.map(ensureValidRentData);

    console.log(`Found ${validatedVehicles.length} available vehicles with valid rent data`);
    validatedVehicles.forEach(v => {
      console.log(`✅ Vehicle ${v._id}: ${v.brand} ${v.vehicleModel} - rentPerDay: ${v.rentPerDay}, rentPerHour: ${v.rentPerHour}`);
    });

    res.status(200).json(validatedVehicles);
  } catch (error) {
    console.error('Error fetching public vehicles:', error.message);
    res.status(500).json({ message: 'Error fetching vehicles' });
  }
};

// backend/controllers/vehicleController.js - Add this function

// 📍 Get Vehicle Locations for Manager (for map display)
export const getManagerVehicleLocations = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get all vehicles for the manager's location
    const vehicles = await Vehicle.find({ 
      assignedLocation: manager.assignedLocation,
      'currentLocation.lat': { $exists: true },
      'currentLocation.lng': { $exists: true }
    })
      .select('_id vehicleModel brand vehicleType vehicleNumber status currentLocation subLocation')
      .lean();

    console.log(`📍 Retrieved ${vehicles.length} vehicle locations for manager ${manager.name}`);

    res.status(200).json({ 
      success: true,
      count: vehicles.length,
      vehicles 
    });
  } catch (error) {
    console.error('❌ Error fetching vehicle locations:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching vehicle locations',
      error: error.message 
    });
  }
};

// Note: Add this to your existing vehicleController.js exports