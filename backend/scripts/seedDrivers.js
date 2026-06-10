// backend/scripts/seedDrivers.js - Seed test drivers for development

import mongoose from 'mongoose';
import Driver from '../models/Driver.js';
import Location from '../models/Location.js';
import User from '../models/User.js';
import connectDB from '../config/db.js';

const seedDrivers = async () => {
  try {
    console.log('🌱 Seeding test drivers...');

    // Connect to database
    await connectDB();

    // Find a manager user (assuming there's at least one manager)
    const manager = await User.findOne({ role: 'manager' });
    if (!manager) {
      console.error('❌ No manager found. Please create a manager user first.');
      process.exit(1);
    }

    // Get all locations
    const locations = await Location.find({});
    if (locations.length === 0) {
      console.error('❌ No locations found. Please seed locations first.');
      process.exit(1);
    }

    console.log(`📍 Found ${locations.length} locations`);

    // Test drivers data
    const testDrivers = [
      {
        manager: manager._id,
        location: locations[0]._id, // First location
        subLocation: 'Main Location',
        name: 'Rajesh Kumar',
        email: 'rajesh.driver@test.com',
        phone: '9876543210',
        gender: 'Male',
        licenseNumber: 'DL123456789',
        status: 'Available'
      },
      {
        manager: manager._id,
        location: locations[0]._id,
        subLocation: 'Main Location',
        name: 'Priya Sharma',
        email: 'priya.driver@test.com',
        phone: '9876543211',
        gender: 'Female',
        licenseNumber: 'DL123456790',
        status: 'Available'
      },
      {
        manager: manager._id,
        location: locations[0]._id,
        subLocation: 'Auroville',
        name: 'Arun Patel',
        email: 'arun.driver@test.com',
        phone: '9876543212',
        gender: 'Male',
        licenseNumber: 'DL123456791',
        status: 'Available'
      },
      {
        manager: manager._id,
        location: locations[1] ? locations[1]._id : locations[0]._id, // Second location or fallback
        subLocation: 'Main Location',
        name: 'Sunita Verma',
        email: 'sunita.driver@test.com',
        phone: '9876543213',
        gender: 'Female',
        licenseNumber: 'DL123456792',
        status: 'Available'
      },
      {
        manager: manager._id,
        location: locations[1] ? locations[1]._id : locations[0]._id,
        subLocation: 'Beach Area',
        name: 'Vikram Singh',
        email: 'vikram.driver@test.com',
        phone: '9876543214',
        gender: 'Male',
        licenseNumber: 'DL123456793',
        status: 'Available'
      }
    ];

    // Check existing drivers
    const existingCount = await Driver.countDocuments();
    console.log(`📊 Existing drivers: ${existingCount}`);

    if (existingCount > 0) {
      console.log('⚠️  Drivers already exist. Skipping seeding.');
      return;
    }

    // Insert test drivers
    const insertedDrivers = await Driver.insertMany(testDrivers);
    console.log(`✅ Successfully seeded ${insertedDrivers.length} test drivers`);

    // Log the drivers
    insertedDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.name} (${driver.gender}) - ${driver.phone} - Location: ${driver.subLocation}`);
    });

    console.log('🎉 Driver seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding drivers:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run the seeder
seedDrivers();
