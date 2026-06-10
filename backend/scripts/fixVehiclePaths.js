import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vehicle from '../models/Vehicle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function fixVehiclePaths() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find vehicles with incorrect paths
    const vehicles = await Vehicle.find({
      $or: [
        { vehicleImage: { $regex: 'uploads\/vehicles' } },
        { vehicleImage: { $regex: 'uploads\\\\vehicles' } }
      ]
    });

    console.log(`Found ${vehicles.length} vehicles with incorrect paths`);

    // Fix each vehicle's image path
    for (const vehicle of vehicles) {
      const oldPath = vehicle.vehicleImage;
      // Extract just the filename using cross-platform path handling
      const filename = path.basename(oldPath);
      
      // Update the vehicle
      await Vehicle.findByIdAndUpdate(vehicle._id, {
        vehicleImage: filename
      });
      
      console.log(`✅ Fixed: ${oldPath} -> ${filename}`);
    }

    console.log('\nDatabase cleanup complete!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('📋 Database connection closed');
    }
  }
}

// Run the fix
fixVehiclePaths();