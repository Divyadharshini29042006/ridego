import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testManagerAPI() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ridegoDB');
    const Booking = (await import('./models/Booking.js')).default;

    // Simulate manager API logic - get bookings for a specific location
    // Let's assume manager location is 'Pondicherry'
    const managerLocation = 'Pondicherry';

    const bookings = await Booking.find({
      $or: [
        { pickupLocation: new RegExp(managerLocation, 'i') },
        { dropLocation: new RegExp(managerLocation, 'i') }
      ]
    });

    console.log('Manager location:', managerLocation);
    console.log('Bookings for manager:', bookings.length);

    const counts = {
      total: bookings.length,
      pending: 0,
      confirmed: 0,
      completed: 0
    };

    bookings.forEach(booking => {
      const status = booking.status?.toLowerCase().trim();

      if (status === 'pending' ||
          status === 'pending assignment' ||
          status === 'need driver') {
        counts.pending++;
      }
      else if (status === 'confirmed' ||
               status === 'driver assigned' ||
               status === 'in progress' ||
               status === 'ongoing') {
        counts.confirmed++;
      }
      else if (status === 'completed' ||
               status === 'waiting to pay penalty') {
        counts.completed++;
      }
    });

    console.log('Manager stats:', counts);
    console.log('Expected: total=11, pending=1, confirmed=0, completed=10');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testManagerAPI();
