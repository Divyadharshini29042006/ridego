import mongoose from 'mongoose';
import Location from './models/Location.js';
import User from './models/User.js';

async function checkData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ridego');
    console.log('Connected to MongoDB');

    const locations = await Location.find({});
    console.log('Locations:', locations.map(l => ({ id: l._id, name: l.name, city: l.city, subCities: l.subCities })));

    const managers = await User.find({ role: 'manager' });
    console.log('Managers:', managers.map(m => ({ id: m._id, name: m.name, assignedLocation: m.assignedLocation })));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
