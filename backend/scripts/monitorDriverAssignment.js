// backend/scripts/monitorDriverAssignments.js
// Run this script to monitor and test driver assignments

import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Driver from '../models/Driver.js';
import Location from '../models/Location.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Monitor pending driver assignments
 */
const monitorPendingAssignments = async () => {
  try {
    const pendingBookings = await Booking.find({
      status: 'Pending Assignment',
      needsDriver: true,
      driver: null
    })
    .populate('customer', 'name email')
    .populate('vehicle', 'name vehicleType')
    .sort({ createdAt: -1 });

    console.log('\n📋 PENDING DRIVER ASSIGNMENTS');
    console.log('═'.repeat(80));

    if (pendingBookings.length === 0) {
      console.log('✅ No pending assignments - All bookings have drivers!');
      return;
    }

    console.log(`⚠️  Found ${pendingBookings.length} booking(s) waiting for driver assignment\n`);

    for (const booking of pendingBookings) {
      console.log(`\n📍 Booking ID: ${booking._id}`);
      console.log(`   Customer: ${booking.customerName || booking.customer?.name}`);
      console.log(`   Vehicle: ${booking.vehicleName || booking.vehicle?.name}`);
      console.log(`   Pickup: ${booking.pickupLocation}`);
      console.log(`   Gender Preference: ${booking.driverGender}`);
      console.log(`   Created: ${booking.createdAt.toLocaleString()}`);
      console.log(`   Attempts: ${booking.driverAssignmentAttempts || 0}`);
      
      // Check available drivers for this booking
      const city = extractCityFromLocation(booking.pickupLocation);
      const location = await Location.findOne({ 
        city: new RegExp(`^${city}$`, 'i') 
      });

      if (location) {
        const query = {
          location: location._id,
          status: 'Available'
        };

        if (booking.driverGender && booking.driverGender !== 'Any') {
          query.gender = booking.driverGender;
        }

        const availableDrivers = await Driver.countDocuments(query);
        
        if (availableDrivers > 0) {
          console.log(`   ✅ ${availableDrivers} matching driver(s) available`);
        } else {
          console.log(`   ❌ No matching drivers available`);
        }
      } else {
        console.log(`   ❌ Location not found: ${city}`);
      }
    }

    console.log('\n' + '═'.repeat(80));
  } catch (error) {
    console.error('❌ Error monitoring assignments:', error);
  }
};

/**
 * Show driver availability by location
 */
const showDriverAvailability = async () => {
  try {
    console.log('\n🚗 DRIVER AVAILABILITY BY LOCATION');
    console.log('═'.repeat(80));

    const locations = await Location.find();

    for (const location of locations) {
      const availableDrivers = await Driver.countDocuments({
        location: location._id,
        status: 'Available'
      });

      const assignedDrivers = await Driver.countDocuments({
        location: location._id,
        status: 'Assigned'
      });

      const totalDrivers = await Driver.countDocuments({
        location: location._id
      });

      const maleAvailable = await Driver.countDocuments({
        location: location._id,
        status: 'Available',
        gender: 'Male'
      });

      const femaleAvailable = await Driver.countDocuments({
        location: location._id,
        status: 'Available',
        gender: 'Female'
      });

      console.log(`\n📍 ${location.city}, ${location.state}`);
      console.log(`   Total Drivers: ${totalDrivers}`);
      console.log(`   Available: ${availableDrivers} (${maleAvailable} Male, ${femaleAvailable} Female)`);
      console.log(`   Assigned: ${assignedDrivers}`);
      console.log(`   Utilization: ${totalDrivers > 0 ? ((assignedDrivers / totalDrivers) * 100).toFixed(1) : 0}%`);
    }

    console.log('\n' + '═'.repeat(80));
  } catch (error) {
    console.error('❌ Error showing driver availability:', error);
  }
};

/**
 * Show recent assignment activity
 */
const showRecentAssignments = async () => {
  try {
    console.log('\n📊 RECENT DRIVER ASSIGNMENTS (Last 24 hours)');
    console.log('═'.repeat(80));

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentAssignments = await Booking.find({
      driverAssignedAt: { $gte: yesterday },
      driver: { $ne: null }
    })
    .populate('driver', 'name phone gender')
    .populate('customer', 'name')
    .populate('vehicle', 'name')
    .sort({ driverAssignedAt: -1 })
    .limit(10);

    if (recentAssignments.length === 0) {
      console.log('ℹ️  No driver assignments in the last 24 hours');
      return;
    }

    console.log(`\n✅ ${recentAssignments.length} assignment(s) completed\n`);

    for (const booking of recentAssignments) {
      const assignTime = booking.driverAssignedAt;
      const createTime = booking.createdAt;
      const timeDiff = (assignTime - createTime) / 1000 / 60; // minutes

      console.log(`\n📋 Booking: ${booking._id}`);
      console.log(`   Customer: ${booking.customerName || booking.customer?.name}`);
      console.log(`   Vehicle: ${booking.vehicleName || booking.vehicle?.name}`);
      console.log(`   Driver: ${booking.driver.name} (${booking.driver.gender})`);
      console.log(`   Phone: ${booking.driver.phone}`);
      console.log(`   Assigned: ${assignTime.toLocaleString()}`);
      console.log(`   Assignment Time: ${timeDiff.toFixed(1)} minutes`);
    }

    console.log('\n' + '═'.repeat(80));
  } catch (error) {
    console.error('❌ Error showing recent assignments:', error);
  }
};

/**
 * Test driver assignment for a specific booking
 */
const testDriverAssignment = async (bookingId) => {
  try {
    console.log(`\n🧪 TESTING DRIVER ASSIGNMENT FOR BOOKING: ${bookingId}`);
    console.log('═'.repeat(80));

    const { assignDriverToBooking } = await import('../services/driverAssignmentService.js');
    
    const result = await assignDriverToBooking(bookingId);

    if (result.success) {
      console.log('\n✅ Driver assigned successfully!');
      console.log(`   Driver: ${result.driver.name}`);
      console.log(`   Phone: ${result.driver.phone}`);
      console.log(`   Gender: ${result.driver.gender}`);
    } else {
      console.log('\n❌ Driver assignment failed');
      console.log(`   Reason: ${result.message}`);
    }

    console.log('\n' + '═'.repeat(80));
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

/**
 * Show assignment statistics
 */
const showAssignmentStats = async () => {
  try {
    console.log('\n📈 DRIVER ASSIGNMENT STATISTICS');
    console.log('═'.repeat(80));

    const totalBookings = await Booking.countDocuments({ needsDriver: true });
    const assigned = await Booking.countDocuments({ 
      needsDriver: true, 
      driver: { $ne: null } 
    });
    const pending = await Booking.countDocuments({ 
      status: 'Pending Assignment',
      needsDriver: true 
    });

    const successRate = totalBookings > 0 ? (assigned / totalBookings * 100).toFixed(1) : 0;

    console.log(`\n📊 Overall Statistics:`);
    console.log(`   Total Bookings (with driver): ${totalBookings}`);
    console.log(`   Successfully Assigned: ${assigned}`);
    console.log(`   Pending Assignment: ${pending}`);
    console.log(`   Success Rate: ${successRate}%`);

    // Average assignment time
    const assignedBookings = await Booking.find({
      needsDriver: true,
      driver: { $ne: null },
      driverAssignedAt: { $ne: null }
    });

    if (assignedBookings.length > 0) {
      const totalTime = assignedBookings.reduce((sum, booking) => {
        const timeDiff = (booking.driverAssignedAt - booking.createdAt) / 1000 / 60;
        return sum + timeDiff;
      }, 0);

      const avgTime = (totalTime / assignedBookings.length).toFixed(1);
      console.log(`   Average Assignment Time: ${avgTime} minutes`);
    }

    console.log('\n' + '═'.repeat(80));
  } catch (error) {
    console.error('❌ Error showing stats:', error);
  }
};

// Helper function
const extractCityFromLocation = (location) => {
  if (!location) return '';
  const parts = location.split(',').map(part => part.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return parts[0];
};

// Main menu
const showMenu = () => {
  console.log('\n🚗 RIDEGO DRIVER ASSIGNMENT MONITOR');
  console.log('═'.repeat(80));
  console.log('\nChoose an option:');
  console.log('  1. Monitor pending assignments');
  console.log('  2. Show driver availability');
  console.log('  3. Show recent assignments');
  console.log('  4. Show assignment statistics');
  console.log('  5. Test assignment (provide booking ID)');
  console.log('  6. Full report (all of the above)');
  console.log('  0. Exit');
  console.log('\n═'.repeat(80));
};

// Run the monitor
const run = async () => {
  await connectDB();

  const args = process.argv.slice(2);
  const option = args[0];

  if (!option) {
    // Interactive mode
    showMenu();
    console.log('\nUsage: node monitorDriverAssignments.js [option]');
    console.log('Example: node monitorDriverAssignments.js 1');
    console.log('         node monitorDriverAssignments.js 5 <bookingId>\n');
    process.exit(0);
  }

  switch (option) {
    case '1':
      await monitorPendingAssignments();
      break;
    case '2':
      await showDriverAvailability();
      break;
    case '3':
      await showRecentAssignments();
      break;
    case '4':
      await showAssignmentStats();
      break;
    case '5':
      if (!args[1]) {
        console.error('❌ Please provide a booking ID');
        console.log('Usage: node monitorDriverAssignments.js 5 <bookingId>');
      } else {
        await testDriverAssignment(args[1]);
      }
      break;
    case '6':
      await showAssignmentStats();
      await showDriverAvailability();
      await monitorPendingAssignments();
      await showRecentAssignments();
      break;
    default:
      console.error('❌ Invalid option');
      showMenu();
  }

  mongoose.connection.close();
  console.log('\n✅ Monitor closed\n');
};

run();