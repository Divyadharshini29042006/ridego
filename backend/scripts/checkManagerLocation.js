import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Manager from '../models/Manager.js';

dotenv.config();

async function checkManagerLocation(managerId) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const manager = await Manager.findById(managerId)
      .populate('assignedLocation')
      .lean();

    console.log('Manager Details:', {
      name: manager.name,
      location: manager.assignedLocation?.city,
      subLocations: manager.assignedLocation?.subCities || [],
      availableSubLocations: manager.availableSubLocations || []
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
  }
}

// Get manager ID from command line
const managerId = process.argv[2];
if (!managerId) {
  console.error('Please provide manager ID');
  process.exit(1);
}

checkManagerLocation(managerId);