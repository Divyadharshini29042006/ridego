import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vehicle from '../models/Vehicle.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your-db-name';

async function updateVehicles() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Update all vehicles missing modelYear, rentPerHour, or mileage with default values
    const result = await Vehicle.updateMany(
      {
        $or: [
          { modelYear: { $exists: false } },
          { rentPerHour: { $exists: false } },
          { mileage: { $exists: false } },
        ],
      },
      {
        $set: {
          modelYear: 2020,    // default model year
          rentPerHour: 0,     // default rent per hour
          mileage: 0,         // default mileage
        },
      }
    );

    console.log(`Matched ${result.matchedCount} vehicles, modified ${result.modifiedCount} vehicles.`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating vehicles:', error);
    process.exit(1);
  }
}

updateVehicles();
