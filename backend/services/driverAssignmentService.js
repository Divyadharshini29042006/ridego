// backend/services/driverAssignmentService.js

import Booking from '../models/Booking.js';
import Driver from '../models/Driver.js';
import Location from '../models/Location.js';
import Vehicle from '../models/Vehicle.js';
import { sendDriverAssignmentEmail } from '../utils/mailer.js';

/**
 * 🚗 Assign Driver to Booking
 * Finds available driver matching location and gender preference
 */
export const assignDriverToBooking = async (bookingId) => {
  try {
    console.log(`🔍 Starting driver assignment for booking: ${bookingId}`);

    // Fetch booking with populated data
    const booking = await Booking.findById(bookingId)
      .populate('vehicle')
      .populate('customer', 'name email phone');

    if (!booking) {
      console.error(`❌ Booking ${bookingId} not found`);
      return { success: false, message: 'Booking not found' };
    }

    // Check if driver is needed and not already assigned
    if (!booking.needsDriver) {
      console.log(`⚠️ Booking ${bookingId} doesn't need a driver`);
      return { success: false, message: 'Driver not required for this booking' };
    }

    if (booking.driver) {
      console.log(`⚠️ Booking ${bookingId} already has driver assigned`);
      return { success: false, message: 'Driver already assigned' };
    }

    // Extract city and sublocation from pickup location
    // Format: "City - SubLocation" or just "City"
    const pickupParts = booking.pickupLocation.split(' - ');
    const pickupCity = pickupParts[0]?.trim();

    if (!pickupCity) {
      console.error(`❌ Invalid pickup location format: ${booking.pickupLocation}`);
      return { success: false, message: 'Invalid pickup location format' };
    }

    const pickupSubLocation = pickupParts[1]?.trim() || 'Main Location';

    console.log(`📍 Pickup location parsed: City="${pickupCity}", SubLocation="${pickupSubLocation}"`);

    // Find matching location in database
    console.log(`🔍 Searching for location with city: "${pickupCity}" and subLocation: "${pickupSubLocation}"`);
    const locationDoc = await Location.findOne({
      city: { $regex: new RegExp(`^${pickupCity}$`, 'i') },
      name: { $regex: new RegExp(`^${pickupSubLocation}$`, 'i') }
    });

    if (!locationDoc) {
      console.error(`❌ Location not found for city: ${pickupCity}`);
      console.log(`📋 Available locations in DB:`, await Location.find({}, 'name city').lean());
      booking.status = 'confirmed'; // Fallback to confirmed without driver
      await booking.save();
      return { success: false, message: `No location found for ${pickupCity}` };
    }

    console.log(`✅ Found location: ${locationDoc.name} (ID: ${locationDoc._id}) - City: ${locationDoc.city}`);

    // Build driver query
    const driverQuery = {
      location: locationDoc._id,
      status: 'Available'
    };

    // Match sublocation (case-insensitive)
    if (pickupSubLocation && pickupSubLocation !== 'Main Location') {
      driverQuery.subLocation = { $regex: new RegExp(`^${pickupSubLocation}$`, 'i') };
    } else {
      // For "Main Location", match null, empty, or "Main Location"
      driverQuery.subLocation = { $in: [null, '', 'Main Location'] };
    }

    // Match gender preference (unless "Any")
    if (booking.driverGender && booking.driverGender !== 'Any') {
      driverQuery.gender = booking.driverGender;
    }

    console.log(`🔎 Searching for driver with query:`, JSON.stringify(driverQuery, null, 2));

    // Find available drivers
    const availableDrivers = await Driver.find(driverQuery)
      .populate('location', 'city name')
      .limit(10);

    console.log(`📊 Found ${availableDrivers.length} available driver(s)`);

    if (availableDrivers.length === 0) {
      // No drivers available - try relaxing constraints
      console.log(`⚠️ No drivers found with strict criteria, trying relaxed search...`);
      
      // Try without sublocation requirement
      const relaxedQuery = {
        location: locationDoc._id,
        status: 'Available'
      };
      
      if (booking.driverGender && booking.driverGender !== 'Any') {
        relaxedQuery.gender = booking.driverGender;
      }

      const relaxedDrivers = await Driver.find(relaxedQuery).limit(5);
      console.log(`📊 Relaxed search found ${relaxedDrivers.length} driver(s)`);

      if (relaxedDrivers.length === 0) {
        // Still no drivers - update booking status and increment attempts
        booking.driverAssignmentAttempts = (booking.driverAssignmentAttempts || 0) + 1;
        
        if (booking.driverAssignmentAttempts >= 3) {
          // After 3 attempts, mark as confirmed without driver
          booking.status = 'confirmed';
          console.log(`⚠️ Max attempts reached, marking booking as confirmed without driver`);
        }
        
        await booking.save();
        return { 
          success: false, 
          message: `No available ${booking.driverGender} drivers in ${pickupCity}${pickupSubLocation !== 'Main Location' ? ` - ${pickupSubLocation}` : ''}`,
          attempts: booking.driverAssignmentAttempts
        };
      }

      availableDrivers.push(...relaxedDrivers);
    }

    // Select first available driver (you can implement smarter logic here)
    const selectedDriver = availableDrivers[0];

    console.log(`✅ Selected driver: ${selectedDriver.name} (ID: ${selectedDriver._id})`);

    // Update driver status
    selectedDriver.status = 'Assigned';
    await selectedDriver.save();

    // Assign driver to booking
    booking.driver = selectedDriver._id;
    booking.status = 'Driver Assigned';
    booking.driverAssignedAt = new Date();
    await booking.save();

    console.log(`✅ Driver ${selectedDriver.name} assigned to booking ${bookingId}`);

    // Update vehicle status if needed
    if (booking.vehicle) {
      const vehicle = await Vehicle.findById(booking.vehicle._id);
      if (vehicle) {
        vehicle.status = 'Booked';
        vehicle.assignedDriver = selectedDriver._id;
        await vehicle.save();
      }
    }

    // Send email notifications
    try {
      // ✅ FIX: Ensure customer phone is available
      const customerPhone = booking.customer?.phone || booking.customerPhone || 'Not provided';

      await sendDriverAssignmentEmail({
        customerEmail: booking.customerEmail || booking.customer?.email,
        customerName: booking.customerName || booking.customer?.name,
        customerPhone: customerPhone, // ✅ Explicitly pass phone
        bookingId: booking._id.toString(),
        driverName: selectedDriver.name,
        driverPhone: selectedDriver.phone,
        driverGender: selectedDriver.gender,
        vehicleName: booking.vehicleName,
        pickupDate: booking.pickupDate,
        pickupLocation: booking.pickupLocation
      });
      console.log(`✅ Assignment email sent to customer`);
    } catch (emailError) {
      console.error(`❌ Failed to send assignment email:`, emailError.message);
      // Don't fail the assignment if email fails
    }

    return {
      success: true,
      message: 'Driver assigned successfully',
      driver: {
        id: selectedDriver._id,
        name: selectedDriver.name,
        phone: selectedDriver.phone,
        gender: selectedDriver.gender
      }
    };

  } catch (error) {
    console.error(`❌ Error assigning driver to booking ${bookingId}:`, error);
    return {
      success: false,
      message: error.message || 'Failed to assign driver'
    };
  }
};

/**
 * 📅 Schedule Driver Assignment (with delay for testing)
 */
export const scheduleDriverAssignment = (bookingId, delayMinutes = 0) => {
  const delayMs = delayMinutes * 60 * 1000;
  
  console.log(`⏱️ Scheduling driver assignment for booking ${bookingId} in ${delayMinutes} minute(s)`);
  
  setTimeout(async () => {
    console.log(`🚀 Executing scheduled driver assignment for ${bookingId}`);
    await assignDriverToBooking(bookingId);
  }, delayMs);
};

/**
 * 🔄 Retry Failed Assignments (Cron job function)
 */
export const retryFailedAssignments = async () => {
  try {
    console.log(`🔄 Checking for bookings with pending driver assignment...`);

    // Find bookings waiting for driver assignment
    const pendingBookings = await Booking.find({
      status: 'Pending Assignment',
      needsDriver: true,
      driver: null,
      driverAssignmentAttempts: { $lt: 3 }
    });

    console.log(`📋 Found ${pendingBookings.length} pending assignment(s)`);

    for (const booking of pendingBookings) {
      console.log(`🔄 Retrying assignment for booking ${booking._id}`);
      await assignDriverToBooking(booking._id);
      
      // Wait 2 seconds between attempts to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`✅ Completed retry cycle`);
  } catch (error) {
    console.error(`❌ Error in retry failed assignments:`, error);
  }
};

/**
 * 🎯 Manual Driver Assignment (for admin/manager)
 */
export const manuallyAssignDriver = async (bookingId, driverId) => {
  try {
    const booking = await Booking.findById(bookingId);
    const driver = await Driver.findById(driverId);

    if (!booking) throw new Error('Booking not found');
    if (!driver) throw new Error('Driver not found');
    if (driver.status !== 'Available') throw new Error('Driver is not available');

    // Update driver
    driver.status = 'Assigned';
    await driver.save();

    // Update booking
    booking.driver = driver._id;
    booking.status = 'Driver Assigned';
    booking.driverAssignedAt = new Date();
    await booking.save();

    // Update vehicle
    if (booking.vehicle) {
      await Vehicle.findByIdAndUpdate(booking.vehicle._id || booking.vehicle, {
        assignedDriver: driver._id
      });
    }

    console.log(`✅ Manually assigned driver ${driver.name} to booking ${bookingId}`);

    return { success: true, driver };
  } catch (error) {
    console.error(`❌ Manual assignment error:`, error);
    throw error;
  }
};