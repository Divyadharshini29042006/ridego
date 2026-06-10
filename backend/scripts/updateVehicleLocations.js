import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Vehicle from '../models/Vehicle.js';
import Location from '../models/Location.js';

async function updateVehicleLocations() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const vehicles = await Vehicle.find({}).populate('assignedLocation', 'name city lat lng radius');

    let updatedCount = 0;

    for (const vehicle of vehicles) {
      if (!vehicle.assignedLocation || !vehicle.assignedLocation.lat || !vehicle.assignedLocation.lng || !vehicle.assignedLocation.radius) {
        console.warn(`⚠️ Vehicle ${vehicle.vehicleNumber} has no valid assigned location coordinates`);
        continue;
      }

      // Generate random location within assigned location radius
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * vehicle.assignedLocation.radius;

      const newLat = vehicle.assignedLocation.lat + radius * Math.cos(angle);
      const newLng = vehicle.assignedLocation.lng + radius * Math.sin(angle);

      vehicle.currentLocation = {
        lat: parseFloat(newLat.toFixed(6)),
        lng: parseFloat(newLng.toFixed(6)),
        updatedAt: new Date()
      };

      // Only update location, don't save other fields that might cause validation errors
      await Vehicle.updateOne(
        { _id: vehicle._id },
        {
          $set: {
            currentLocation: vehicle.currentLocation
          }
        }
      );

      updatedCount++;
      console.log(`✅ Updated ${vehicle.vehicleNumber} location to lat=${newLat.toFixed(6)}, lng=${newLng.toFixed(6)}`);
    }

    console.log(`✅ Updated ${updatedCount} vehicle locations`);
  } catch (error) {
    console.error('❌ Error updating vehicle locations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🛑 Disconnected from MongoDB');
  }
}

updateVehicleLocations();
