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

const updateDriverGenders = async () => {
  try {
    console.log('🔄 Updating driver genders...');

    // Update Swathi to Male
    await Driver.findByIdAndUpdate('68ce3bc57f5d79f54c359a9e', { gender: 'Male' });
    console.log('✅ Updated Swathi to Male');

    // Update Abi to Female
    await Driver.findByIdAndUpdate('68cdacb227358248385a4680', { gender: 'Female' });
    console.log('✅ Updated Abi to Female');

    // Verify the updates
    const drivers = await Driver.find({}, 'name gender status subLocation');
    console.log('📋 Updated drivers:');
    drivers.forEach(driver => {
      console.log(`   - ${driver.name}: gender="${driver.gender}", status="${driver.status}", subLocation="${driver.subLocation}"`);
    });

  } catch (error) {
    console.error('❌ Error updating drivers:', error);
  }
};

const run = async () => {
  await connectDB();
  await updateDriverGenders();
  mongoose.connection.close();
  console.log('✅ Update completed');
};

run();
