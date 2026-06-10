import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import connectDB from '../config/db.js';
import '../loadEnv.js'; // Load .env before anything else

const fixVehicleImages = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find all vehicles with image paths starting with 'uploads/vehicles/'
    const vehicles = await Vehicle.find({
      vehicleImage: { $regex: '^uploads/vehicles/' }
    });

    console.log(`Found ${vehicles.length} vehicles with incorrect image paths`);

    for (const vehicle of vehicles) {
      const oldPath = vehicle.vehicleImage;
      // Extract filename from path like 'uploads/vehicles/vehicle-123456789.png'
      const filename = oldPath.split('/').pop();
      vehicle.vehicleImage = filename;
      await vehicle.save();
      console.log(`Updated ${vehicle.vehicleNumber}: ${oldPath} -> ${filename}`);
    }

    console.log('✅ All vehicle images fixed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing vehicle images:', error);
    process.exit(1);
  }
};

fixVehicleImages();
