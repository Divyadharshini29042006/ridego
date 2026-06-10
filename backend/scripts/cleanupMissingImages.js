import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vehicle from '../models/Vehicle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function cleanupMissingImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const uploadsPath = path.join(__dirname, '..', 'uploads', 'vehicles');
    const files = fs.readdirSync(uploadsPath);
    
    const vehicles = await Vehicle.find({ vehicleImage: { $exists: true } });
    
    for (const vehicle of vehicles) {
      const filename = vehicle.vehicleImage;
      if (!files.includes(filename)) {
        console.log(`🔍 Found missing image for vehicle:`, {
          id: vehicle._id,
          model: vehicle.vehicleModel,
          image: filename
        });
        
        // Remove image reference from vehicle
        await Vehicle.findByIdAndUpdate(vehicle._id, {
          $unset: { vehicleImage: "" }
        });
        console.log('✅ Removed missing image reference from database');
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('📋 Cleanup complete');
  }
}

cleanupMissingImages();