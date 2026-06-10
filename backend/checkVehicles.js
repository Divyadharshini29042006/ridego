import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Vehicle from './models/Vehicle.js';
import Location from './models/Location.js';

async function checkVehicles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const vehicles = await Vehicle.find({}).populate('assignedLocation', 'name city').limit(10);

    console.log('Sample vehicles:');
    vehicles.forEach(v => {
      console.log(`Vehicle: ${v.vehicleNumber}, Location: ${v.assignedLocation?.name} (${v.assignedLocation?.city}), assignedLocation: ${v.assignedLocation?._id}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkVehicles();
