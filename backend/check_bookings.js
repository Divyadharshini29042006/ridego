import mongoose from 'mongoose';
import Booking from './models/Booking.js';

async function checkBookings() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ridego');
    console.log('Connected to MongoDB');

    const totalBookings = await Booking.countDocuments();
    console.log('Total bookings:', totalBookings);

    const statusCounts = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('Status counts:');
    statusCounts.forEach(status => {
      console.log(`  ${status._id}: ${status.count}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkBookings();
