import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vehicle from '../models/Vehicle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function validateVehicleImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const uploadsPath = path.join(__dirname, '..', 'uploads', 'vehicles');
    console.log('Checking directory:', uploadsPath);

    // List all files in uploads directory
    const files = fs.readdirSync(uploadsPath);
    console.log(`Found ${files.length} files in uploads directory`);

    // Check database entries
    const vehicles = await Vehicle.find({ vehicleImage: { $exists: true } });
    console.log(`Found ${vehicles.length} vehicles with images in database`);

    // Cross-reference
    for (const vehicle of vehicles) {
      const filename = vehicle.vehicleImage;
      const exists = files.includes(filename);
      console.log(`${exists ? '✅' : '❌'} ${filename} -> ${exists ? 'Found' : 'Missing'}`);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('📋 Validation complete');
  }
}

validateVehicleImages();