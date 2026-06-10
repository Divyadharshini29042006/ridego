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

const fixDriverEmails = async () => {
  try {
    console.log('🔄 Fixing driver emails...');

    // Update Swathi with email
    await Driver.findByIdAndUpdate('68ce3bc57f5d79f54c359a9e', {
      email: 'swathi.driver@ridego.com',
      gender: 'Male' // Also fix gender
    });
    console.log('✅ Updated Swathi with email and gender');

    // Update Abi with email
    await Driver.findByIdAndUpdate('68cdacb227358248385a4680', {
      email: 'abi.driver@ridego.com',
      gender: 'Female' // Also fix gender
    });
    console.log('✅ Updated Abi with email and gender');

    // Verify the updates
    const drivers = await Driver.find({}, 'name email gender status subLocation');
    console.log('📋 Updated drivers:');
    drivers.forEach(driver => {
      console.log(`   - ${driver.name}: email="${driver.email}", gender="${driver.gender}", status="${driver.status}", subLocation="${driver.subLocation}"`);
    });

  } catch (error) {
    console.error('❌ Error updating drivers:', error);
  }
};

const run = async () => {
  await connectDB();
  await fixDriverEmails();
  mongoose.connection.close();
  console.log('✅ Update completed');
};

run();
