import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import dotenv from 'dotenv';

dotenv.config();

const normalizeVehicleType = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const normalizeVehicleTypesInDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const vehicles = await Vehicle.find({});
    let updatedCount = 0;

    for (const vehicle of vehicles) {
      const normalizedType = normalizeVehicleType(vehicle.vehicleType);
      if (vehicle.vehicleType !== normalizedType) {
        vehicle.vehicleType = normalizedType;
        await vehicle.save();
        updatedCount++;
        console.log(`Updated vehicle ${vehicle._id} vehicleType to ${normalizedType}`);
      }
    }

    console.log(`Normalization complete. Updated ${updatedCount} vehicles.`);
    process.exit(0);
  } catch (error) {
    console.error('Error normalizing vehicleType:', error);
    process.exit(1);
  }
};

normalizeVehicleTypesInDB();
