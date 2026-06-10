import mongoose from 'mongoose';
import Driver from '../models/Driver.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const updateDriverSubLocations = async () => {
  try {
    console.log('🔄 Updating driver subLocations for Auroville...');

    // Update all drivers in Pondicherry location to have subLocation "auroville"
    // Location ID from your feedback: 68c447ef6e05a741fe25cceb
    const result = await Driver.updateMany(
      { location: '68c447ef6e05a741fe25cceb' },
      { subLocation: 'auroville' }
    );

    console.log(`✅ Updated ${result.modifiedCount} driver(s) to subLocation "auroville"`);

    // Verify the update
    const drivers = await Driver.find({ location: '68c447ef6e05a741fe25cceb' })
      .select('name subLocation gender status');

    console.log('📋 Updated drivers:');
    drivers.forEach(driver => {
      console.log(`   - ${driver.name}: subLocation="${driver.subLocation}", gender="${driver.gender}", status="${driver.status}"`);
    });

  } catch (error) {
    console.error('❌ Error updating drivers:', error);
  }
};

const run = async () => {
  await connectDB();
  await updateDriverSubLocations();
  mongoose.connection.close();
  console.log('✅ Update completed');
};

run();
