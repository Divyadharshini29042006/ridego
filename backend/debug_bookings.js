import mongoose from 'mongoose';
import Booking from './models/Booking.js';
import User from './models/User.js';
import Location from './models/Location.js';  // Add Location model import
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function debugBookings() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ridegoDB';
    console.log('Using MongoDB URI:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('Successfully connected to MongoDB');

    // Check managers without populate first
    const managerCount = await User.countDocuments({ role: 'manager' });
    console.log(`\nTotal managers found: ${managerCount}`);

    const managers = await User.find({ role: 'manager' })
                             .select('name email assignedLocation')
                             .lean();  // Use lean() for better performance
    
    console.log('\n=== Manager Locations (Raw) ===');
    console.log(JSON.stringify(managers, null, 2));

    // Check bookings without complex population
    const bookingCount = await Booking.countDocuments();
    console.log(`\nTotal bookings found: ${bookingCount}`);

    const bookings = await Booking.find({})
                                .select('pickupLocation dropLocation status customerName')
                                .lean();

    console.log('\n=== Booking Locations (Raw) ===');
    if (bookings.length === 0) {
      console.log('No bookings found in database');
    } else {
      console.log(JSON.stringify(bookings, null, 2));
    }

    // Test location string matching
    console.log('\n=== Location Matching Test ===');
    const testLocations = ['Auroville', 'Pondicherry', 'White Town'];
    
    for (const location of testLocations) {
      const matchingBookings = bookings.filter(b => 
        b.pickupLocation?.toLowerCase().includes(location.toLowerCase()) ||
        b.dropLocation?.toLowerCase().includes(location.toLowerCase())
      );
      
      console.log(`\nLocation "${location}":`);
      console.log(`Found ${matchingBookings.length} matching bookings`);
      if (matchingBookings.length > 0) {
        console.log(JSON.stringify(matchingBookings, null, 2));
      }
    }

    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');

  } catch (err) {
    console.error('\nError details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
  } finally {
    process.exit();
  }
}

// Run the debug function
console.log('Starting debug script...');
debugBookings();