import mongoose from 'mongoose';
import Booking from './models/Booking.js';
import User from './models/User.js';

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ridego');

    const bookingCount = await Booking.countDocuments();
    const userCount = await User.countDocuments();
    const managerCount = await User.countDocuments({ role: 'manager' });

    console.log('Database Status:');
    console.log('Total Bookings:', bookingCount);
    console.log('Total Users:', userCount);
    console.log('Total Managers:', managerCount);

    if (bookingCount > 0) {
      const bookings = await Booking.find({}).limit(5).select('pickupLocation dropLocation status customerName');
      console.log('\nSample Bookings:');
      bookings.forEach((b, i) => {
        console.log(`Booking ${i+1}: ${b.customerName} - ${b.pickupLocation} to ${b.dropLocation} (${b.status})`);
      });
    }

    if (managerCount > 0) {
      const managers = await User.find({ role: 'manager' }).populate('assignedLocation');
      console.log('\nManagers:');
      managers.forEach((m, i) => {
        const loc = m.assignedLocation ? `${m.assignedLocation.city} - ${m.assignedLocation.name}` : 'No location';
        console.log(`Manager ${i+1}: ${m.name} (${m.email}) - Location: ${loc}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkData();
