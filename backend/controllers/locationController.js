// backend/controllers/locationController.js

import Location from '../models/Location.js';
import User from '../models/User.js';

export const createLocation = async (req, res) => {
  const { name, city, state, managerId, subCities } = req.body;

  try {
    // 🔍 Check if location already exists
    const existingLocation = await Location.findOne({ name, city });
    if (existingLocation) {
      return res.status(400).json({ message: 'Location already exists in this city' });
    }

    // 🔍 Validate manager only if provided
    let validManager = null;
    if (managerId) {
      validManager = await User.findById(managerId);
      if (!validManager || validManager.role !== 'manager') {
        return res.status(400).json({ message: 'Invalid manager ID or role' });
      }
    }

    // ✅ Create location
    const location = new Location({
      name,
      city,
      state,
      managerId: validManager ? validManager._id : null,
      subCities: Array.isArray(subCities) ? subCities : []
    });

    await location.save();

    // 🔄 Sync manager’s assignedLocation
    if (validManager) {
      validManager.assignedLocation = location._id;
      await validManager.save();
    }

    res.status(201).json({ message: 'Location created', location });
  } catch (error) {
    console.error('❌ Location creation error:', error.message);
    res.status(500).json({ message: 'Error creating location' });
  }
};
export const getAllLocations = async (req, res) => {
  try {
    const { city } = req.query;
    let query = {};

    if (city) {
      query.city = { $regex: new RegExp(`^${city}$`, 'i') };
    }

    const locations = await Location.find(query).populate('managerId', 'name email');
    console.log('Locations fetched:', locations.map(loc => ({
      id: loc._id.toString(),
      manager: loc.managerId ? { id: loc.managerId._id.toString(), name: loc.managerId.name, email: loc.managerId.email } : null
    })));
    res.status(200).json(locations);
  } catch (err) {
    console.error('Error fetching locations:', err.message);
    res.status(500).json({ message: 'Error fetching locations' });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    console.log('Deleting location with ID:', locationId);
    const deletedLocation = await Location.findByIdAndDelete(locationId);
    if (!deletedLocation) {
      console.log('Location not found for deletion:', locationId);
      return res.status(404).json({ message: 'Location not found' });
    }
    console.log('Location deleted:', deletedLocation._id.toString());
    res.status(200).json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('❌ Location deletion error:', error.message);
    res.status(500).json({ message: 'Error deleting location' });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    const { name, city, state, managerId, subCities } = req.body;

    // 🔍 Check if location exists
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // 🔍 Check for duplicate location (same name + city but different ID)
    if (name && city) {
      const existingLocation = await Location.findOne({ name, city, _id: { $ne: locationId } });
      if (existingLocation) {
        return res.status(400).json({ message: 'Another location with same name and city exists' });
      }
    }

    // ✅ Update only provided fields
    if (name) location.name = name;
    if (city) location.city = city;
    if (state) location.state = state;
    if (Array.isArray(subCities)) location.subCities = subCities;

    // ✅ Handle manager updates properly
    if (managerId) {
      const validManager = await User.findById(managerId);
      if (!validManager || validManager.role !== 'manager') {
        return res.status(400).json({ message: 'Invalid manager ID or role' });
      }

      // Clear previous manager if different
      if (location.managerId && location.managerId.toString() !== managerId) {
        const prevManager = await User.findById(location.managerId);
        if (prevManager) {
          prevManager.assignedLocation = null;
          await prevManager.save();
        }
      }

      // Assign new manager
      location.managerId = validManager._id;
      validManager.assignedLocation = location._id;
      await validManager.save();
    }

    await location.save();
    res.status(200).json({ message: 'Location updated successfully', location });
  } catch (error) {
    console.error('❌ Location update error:', error.message);
    res.status(500).json({ message: 'Error updating location' });
  }
};

