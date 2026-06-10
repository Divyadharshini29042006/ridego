// backend/controllers/bookingController.js - FIXED VERSION

import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js'; // ✅ CRITICAL FIX: Import Driver model
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { calculateFare } from '../utils/fareCalculator.js';
import { sendBookingConfirmationEmail, sendJourneyCompletionEmail,sendPenaltyNotificationEmail } from '../utils/mailer.js';
import { assignDriverToBooking, scheduleDriverAssignment } from '../services/driverAssignmentService.js';


/**
 * ✅ NEW: Manager completes booking with optional penalty
 */
export const managerCompleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { hasDamage, damageReason, penaltyAmount } = req.body;
    const managerId = req.user._id;

    console.log('🎯 Manager completion request:', { 
      bookingId, 
      managerId: managerId.toString(),
      hasDamage,
      damageReason,
      penaltyAmount 
    });

    // Verify manager authorization
    const manager = await User.findById(managerId).populate('assignedLocation');
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Manager role required'
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate('vehicle')
      .populate('driver', 'name phone email gender status')
      .populate('customer', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify booking is in manager's location
    const locationCity = manager.assignedLocation.city;
    const locationName = manager.assignedLocation.name;
    const fullLocationName = `${locationCity} - ${locationName}`;
    const pickupLoc = (booking.pickupLocation || '').trim();
    const dropLoc = (booking.dropLocation || '').trim();
    const isInLocation = pickupLoc === fullLocationName || dropLoc === fullLocationName;

    if (!isInLocation) {
      return res.status(403).json({
        success: false,
        message: 'This booking is not in your assigned location'
      });
    }

    // Check if booking can be completed
    const completableStatuses = ['confirmed', 'Driver Assigned', 'In Progress', 'Waiting to pay penalty'];
    if (!completableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete booking with status: ${booking.status}`
      });
    }

    // ✅ CASE 1: Vehicle has damage - Apply penalty
    if (hasDamage && penaltyAmount > 0) {
      if (!damageReason || damageReason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Damage reason is required when applying penalty'
        });
      }

      // Apply penalty
      await booking.applyPenalty(penaltyAmount, damageReason);
      console.log(`⚠️ Penalty applied: ₹${penaltyAmount} for booking ${bookingId}`);

      // Send penalty notification email to user
      try {
        await sendPenaltyNotificationEmail(booking.customerEmail || booking.customer.email, {
          userName: booking.customerName || booking.customer.name,
          bookingId: booking._id.toString(),
          vehicleName: booking.vehicleName,
          damageReason: damageReason,
          penaltyAmount: penaltyAmount,
          totalAmount: booking.totalAmount,
          pickupLocation: booking.pickupLocation,
          dropLocation: booking.dropLocation
        });
        console.log('✅ Penalty notification email sent to user');
      } catch (emailError) {
        console.error('❌ Failed to send penalty notification email:', emailError);
      }

      // Release vehicle immediately after manager inspection
      if (booking.vehicle) {
        const vehicle = await Vehicle.findById(booking.vehicle._id);
        if (vehicle) {
          vehicle.status = 'Available';
          vehicle.assignedDriver = null;
          await vehicle.save();
          console.log(`✅ Vehicle ${vehicle.vehicleNumber} marked as Available (penalty applied)`);
        }
      }

      // Release driver immediately after manager inspection
      if (booking.driver) {
        const driver = await Driver.findById(booking.driver._id);
        if (driver) {
          driver.status = 'Available';
          await driver.save();
          console.log(`✅ Driver ${driver.name} marked as Available (penalty applied)`);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Penalty applied. Vehicle and driver are now available. User will be notified about penalty payment.',
        booking: {
          _id: booking._id,
          status: booking.status,
          hasPenalty: booking.hasPenalty,
          penaltyAmount: booking.penaltyAmount,
          damageReason: booking.damageReason
        }
      });
    }

    // ✅ CASE 2: No damage - Complete immediately
    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();
    console.log('✅ Booking marked as completed (no penalty)');

    // Release vehicle
    if (booking.vehicle) {
      const vehicle = await Vehicle.findById(booking.vehicle._id);
      if (vehicle) {
        vehicle.status = 'Available';
        vehicle.assignedDriver = null;
        await vehicle.save();
        console.log(`✅ Vehicle ${vehicle.vehicleNumber} marked as Available`);
      }
    }

    // Release driver
    if (booking.driver) {
      const driver = await Driver.findById(booking.driver._id);
      if (driver) {
        driver.status = 'Available';
        await driver.save();
        console.log(`✅ Driver ${driver.name} marked as Available`);
      }
    }

    // Send completion email
    try {
      await sendJourneyCompletionEmail(booking.customerEmail || booking.customer.email, {
        userName: booking.customerName || booking.customer.name,
        bookingId: booking._id.toString(),
        vehicleName: booking.vehicleName,
        completionDate: new Date().toLocaleString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        }),
        totalAmount: booking.totalAmount,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation
      });
      console.log('✅ Completion email sent');
    } catch (emailError) {
      console.error('❌ Failed to send completion email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Booking completed successfully',
      booking: {
        _id: booking._id,
        status: booking.status,
        completedAt: booking.completedAt
      }
    });
  } catch (error) {
    console.error('❌ Error completing booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete booking',
      error: error.message
    });
  }
};

/**
 * ✅ NEW: Create Razorpay order for penalty payment
 */
export const createPenaltyPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    console.log('💰 Creating penalty payment order:', { bookingId, userId: userId.toString() });

    // Find booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify user owns this booking
    if (booking.customer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to pay penalty for this booking'
      });
    }

    // Check if penalty exists and is unpaid
    if (!booking.hasPenalty) {
      return res.status(400).json({
        success: false,
        message: 'No penalty exists for this booking'
      });
    }

    if (booking.penaltyPaid) {
      return res.status(400).json({
        success: false,
        message: 'Penalty already paid'
      });
    }

    if (booking.status !== 'Waiting to pay penalty') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not waiting for penalty payment'
      });
    }

    // Import Razorpay instance
    const razorpay = (await import('../utils/razorpay.js')).default;

    // Create Razorpay order for penalty
    const options = {
      amount: Math.round(booking.penaltyAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: `penalty_${bookingId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    console.log(`✅ Penalty payment order created: ${order.id} for ₹${booking.penaltyAmount}`);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      penaltyAmount: booking.penaltyAmount,
      damageReason: booking.damageReason
    });
  } catch (error) {
    console.error('❌ Error creating penalty payment order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create penalty payment order',
      error: error.message
    });
  }
};

/**
 * ✅ NEW: User pays penalty
 */
export const payPenalty = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userId = req.user._id;

    console.log('💰 Penalty payment request:', { bookingId, userId: userId.toString() });

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate('vehicle')
      .populate('driver');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify user owns this booking
    if (booking.customer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to pay penalty for this booking'
      });
    }

    // Check if penalty exists and is unpaid
    if (!booking.hasPenalty) {
      return res.status(400).json({
        success: false,
        message: 'No penalty exists for this booking'
      });
    }

    if (booking.penaltyPaid) {
      return res.status(400).json({
        success: false,
        message: 'Penalty already paid'
      });
    }

    if (booking.status !== 'Waiting to pay penalty') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not waiting for penalty payment'
      });
    }

    // Mark penalty as paid
    await booking.markPenaltyPaid(razorpay_payment_id);
    console.log(`✅ Penalty paid for booking ${bookingId}`);

    // Release vehicle
    if (booking.vehicle) {
      const vehicle = await Vehicle.findById(booking.vehicle._id);
      if (vehicle) {
        vehicle.status = 'Available';
        vehicle.assignedDriver = null;
        await vehicle.save();
        console.log(`✅ Vehicle ${vehicle.vehicleNumber} marked as Available`);
      }
    }

    // Release driver
    if (booking.driver) {
      const driver = await Driver.findById(booking.driver._id);
      if (driver) {
        driver.status = 'Available';
        await driver.save();
        console.log(`✅ Driver ${driver.name} marked as Available`);
      }
    }

    // Send completion email
    try {
      await sendJourneyCompletionEmail(booking.customerEmail, {
        userName: booking.customerName,
        bookingId: booking._id.toString(),
        vehicleName: booking.vehicleName,
        completionDate: new Date().toLocaleString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        }),
        totalAmount: booking.totalAmount + booking.penaltyAmount,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation
      });
      console.log('✅ Completion email sent after penalty payment');
    } catch (emailError) {
      console.error('❌ Failed to send completion email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Penalty paid successfully. Booking completed.',
      booking: {
        _id: booking._id,
        status: booking.status,
        penaltyPaid: booking.penaltyPaid,
        penaltyPaidAt: booking.penaltyPaidAt
      }
    });
  } catch (error) {
    console.error('❌ Error processing penalty payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process penalty payment',
      error: error.message
    });
  }
};

/**
 * Create Booking (after successful payment)
 */
export const createBooking = async (req, res) => {
  try {
    const {
      vehicles,
      tripType,
      tripTypeId,
      totalFare,
      vehicleFares,
      numberOfVehicles,
      pickupFromOurLocation,
      commonPickupAddress,
      pickupCity,
      dropCity,
      paymentId,
      orderId,
      signature,
      paymentStatus,
      customerId,
      customerName,
      customerEmail,
      idempotencyKey,
    } = req.body;

    console.log('📥 Received booking request:', {
      vehiclesCount: vehicles?.length,
      tripType: tripTypeId,
      totalFare,
      paymentId,
      customerId: customerId || req.user?._id,
      idempotencyKey
    });

    // Check idempotency key to prevent duplicate bookings
    if (idempotencyKey) {
      const existingBooking = await Booking.findOne({ idempotencyKey });
      if (existingBooking) {
        return res.status(200).json({
          success: true,
          bookingId: existingBooking._id,
          message: 'Booking already exists'
        });
      }
    }

    // Validation
    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one vehicle is required',
      });
    }

    if (!tripTypeId) {
      return res.status(400).json({
        success: false,
        message: 'Trip type is required',
      });
    }

    if (!paymentId || !orderId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment information is required',
      });
    }

    // Verify payment
    const payment = await Payment.findOne({
      transactionId: paymentId,
      status: 'success',
    });

    if (!payment) {
      console.error('❌ Payment not found or not verified:', paymentId);
      return res.status(400).json({
        success: false,
        message: 'Payment not verified or not found.',
      });
    }

    const bookingCustomerId = customerId || req.user._id;
    const bookingCustomerName = customerName || req.user.name;
    const bookingCustomerEmail = customerEmail || req.user.email;

    if (!bookingCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required',
      });
    }

    // Create bookings
    const createdBookings = [];
    const errors = [];
    const vehiclesToUpdate = [];
    const bookingsToCreate = [];

    for (let i = 0; i < vehicles.length; i++) {
      const vehicleData = vehicles[i];

      try {
        if (!vehicleData.vehicleId || !vehicleData.pickupDate) {
          errors.push(`Vehicle ${i + 1}: Missing required fields`);
          continue;
        }

        const vehicle = await Vehicle.findById(vehicleData.vehicleId);
        if (!vehicle) {
          errors.push(`Vehicle ${i + 1}: Not found in database`);
          continue;
        }

        const pickupDate = new Date(vehicleData.pickupDate);
        const returnDate = vehicleData.returnDate
          ? new Date(vehicleData.returnDate)
          : new Date(vehicleData.pickupDate);

        // ✅ CRITICAL FIX: Enhanced date validation with better logic
        if (isNaN(pickupDate.getTime())) {
          errors.push(`Vehicle ${i + 1}: Invalid pickup date format`);
          continue;
        }
        if (isNaN(returnDate.getTime())) {
          errors.push(`Vehicle ${i + 1}: Invalid return date format`);
          continue;
        }

        // ✅ FIX: Allow bookings within last 30 minutes (accounts for payment processing time)
        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - (30 * 60 * 1000));

        console.log(`📅 Vehicle ${i + 1} date check:`, {
          pickupDate: pickupDate.toISOString(),
          now: now.toISOString(),
          thirtyMinutesAgo: thirtyMinutesAgo.toISOString(),
          isValid: pickupDate >= thirtyMinutesAgo
        });

        // Only reject if pickup is more than 30 minutes in the past
        if (pickupDate < thirtyMinutesAgo) {
          const pickupStr = pickupDate.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
          });
          const nowStr = now.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
          });

          errors.push(
            `Vehicle ${i + 1}: Pickup date (${pickupStr}) cannot be more than 30 minutes in the past. Current time: ${nowStr}`
          );
          continue;
        }

        // Calculate fare
        const serverFare = calculateFare({
          tripType: tripTypeId,
          pickupLocation: vehicleData.pickupLocation || pickupCity,
          dropLocation: vehicleData.dropLocation || dropCity || pickupCity,
          pickupDate: vehicleData.pickupDate,
          returnDate: vehicleData.returnDate,
          vehicleRentPerDay: vehicle.rentPerDay,
          vehicleRentPerHour: vehicle.rentPerHour,
          vehicleType: vehicle.vehicleType,
          hours: vehicleData.hours || 1,
          needsDriver: vehicleData.needsDriver,
        });

        // ✅ FIX: Relax fare validation to allow up to ₹500 difference (trust client fare)
        const clientFare = vehicleFares?.[i]?.fare || 0;
        const fareDifference = Math.abs(serverFare.total - clientFare);

        console.log(`💰 Vehicle ${i + 1} fare comparison:`, {
          client: clientFare,
          server: serverFare.total,
          difference: fareDifference
        });

        // Allow up to ₹500 difference, log warnings for minor differences
        if (fareDifference > 500) {
          console.error(`❌ Large fare mismatch: server=₹${serverFare.total}, client=₹${clientFare}`);
          errors.push(`Vehicle ${i + 1}: Fare mismatch (expected: ₹${serverFare.total}, got: ₹${clientFare})`);
          continue;
        } else if (fareDifference > 0) {
          console.warn(`⚠️ Minor fare difference detected (₹${fareDifference}), using client fare`);
        }

        // Set correct initial status
        const initialStatus = vehicleData.needsDriver ? 'Pending Assignment' : 'confirmed';

        // Prepare booking data
        const bookingData = {
          customer: bookingCustomerId,
          customerName: bookingCustomerName,
          customerEmail: bookingCustomerEmail,
          vehicle: vehicle._id,
          vehicleName: vehicleData.vehicleName || vehicle.vehicleModel,
          vehicleImage: vehicleData.vehicleImage || vehicle.vehicleImage,
          vehicleType: vehicleData.vehicleType || vehicle.vehicleType,
          pickupLocation: vehicleData.pickupLocation || commonPickupAddress || pickupCity,
          dropLocation: vehicleData.dropLocation || dropCity || pickupCity,
          tripType: tripTypeId,
          pickupDate: pickupDate,
          returnDate: returnDate,
          hours: vehicleData.hours || null,
          needsDriver: Boolean(vehicleData.needsDriver),
          driverGender: vehicleData.driverGender || 'Any',
          totalAmount: serverFare.total,
          fareBreakdown: serverFare.breakdown || {},
          depositAmount: 0,
          tripDate: pickupDate,
          status: initialStatus,
          idempotencyKey: idempotencyKey,
        };

        bookingsToCreate.push(bookingData);
        vehiclesToUpdate.push(vehicle);

      } catch (vehicleError) {
        console.error(`❌ Error preparing booking for vehicle ${i + 1}:`, vehicleError);
        errors.push(`Vehicle ${i + 1}: ${vehicleError.message}`);
      }
    }

    if (bookingsToCreate.length === 0) {
      // Mark payment as invalid since booking creation failed
      payment.status = 'invalid';
      payment.errorMessage = `Booking creation failed: ${errors.join(', ')}`;
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Failed to create any bookings',
        errors: errors,
      });
    }

    // Create all bookings
    for (const bookingData of bookingsToCreate) {
      const booking = new Booking(bookingData);
      await booking.save();
      createdBookings.push(booking);
      console.log(`✅ Booking created: ${booking._id} (Status: ${booking.status})`);
    }

    // Update all vehicles
    for (const vehicle of vehiclesToUpdate) {
      vehicle.status = 'Booked';
      await vehicle.save();
    }

    // Update payment with booking reference
    payment.booking = createdBookings[0]._id;
    await payment.save();

    console.log(`✅ Successfully created ${createdBookings.length} booking(s)`);

    // Assign drivers for bookings that need them
    for (const booking of createdBookings) {
      if (booking.needsDriver) {
        console.log(`🚗 Starting immediate driver assignment for ${booking._id}`);

        try {
          const assignmentResult = await assignDriverToBooking(booking._id);
          if (assignmentResult.success) {
            console.log(`✅ Driver assigned: ${assignmentResult.driver.name}`);
          } else {
            console.log(`⚠️ Driver assignment failed: ${assignmentResult.message}`);
          }
        } catch (err) {
          console.error(`❌ Driver assignment error:`, err);
        }
      }
    }

    // Send confirmation email
    let emailSent = false;
    try {
      const firstBooking = createdBookings[0];

      const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        });
      };

      const bookingDetails = {
        userName: bookingCustomerName,
        bookingId: firstBooking._id.toString(),
        vehicleName: firstBooking.vehicleName,
        amount: firstBooking.totalAmount,
        paymentId: paymentId,
        bookingDate: formatDate(firstBooking.pickupDate),
      };

      await sendBookingConfirmationEmail(bookingCustomerEmail, bookingDetails);
      emailSent = true;
      console.log('✅ Booking confirmation email sent');
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError.message);
    }

    const response = {
      success: true,
      message: createdBookings.length === vehicles.length
        ? 'All bookings created successfully'
        : `${createdBookings.length} of ${vehicles.length} bookings created`,
      bookingId: createdBookings[0]._id,
      bookings: createdBookings,
      totalBookings: createdBookings.length,
      emailSent: emailSent,
    };

    if (errors.length > 0) {
      response.warnings = errors;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  }
};

/**
 * Check driver assignment status
 */
export const checkDriverAssignment = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('driver', 'name phone gender image')
      .select('status driver driverAssignedAt needsDriver driverGender');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      status: booking.status,
      needsDriver: booking.needsDriver,
      driverAssigned: !!booking.driver,
      driver: booking.driver ? {
        name: booking.driver.name,
        phone: booking.driver.phone,
        gender: booking.driver.gender,
        image: booking.driver.image,
        assignedAt: booking.driverAssignedAt
      } : null
    });
  } catch (error) {
    console.error('❌ Error checking driver assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check driver assignment'
    });
  }
};

/**
 * Get user bookings
 */
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('vehicle')
      .populate('driver', 'name phone gender image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
    });
  }
};

/**
 * ✅ FIXED: Mark Journey as Completed
 * This function now properly:
 * 1. Updates booking status to 'completed'
 * 2. Marks vehicle as 'Available'
 * 3. Releases driver back to 'Available' status
 * 4. Sends completion email
 */
export const completeJourney = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    console.log('🎯 Journey completion requested:', { bookingId, userId: userId.toString() });

    // Find booking and verify ownership
    const booking = await Booking.findById(bookingId)
      .populate('vehicle')
      .populate('driver', 'name phone email gender status');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify user owns this booking
    if (booking.customer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to complete this booking',
      });
    }

    // Check if booking can be completed
    const completableStatuses = ['confirmed', 'Driver Assigned', 'In Progress'];
    if (!completableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete booking with status: ${booking.status}. Must be one of: ${completableStatuses.join(', ')}`,
      });
    }

    // ✅ 1. Update booking status to completed
    booking.status = 'completed';
    await booking.save();
    console.log('✅ Booking marked as completed:', bookingId);

    // ✅ 2. Update vehicle to Available
    if (booking.vehicle) {
      const vehicle = await Vehicle.findById(booking.vehicle._id);
      if (vehicle) {
        vehicle.status = 'Available';
        vehicle.assignedDriver = null; // Clear assigned driver
        await vehicle.save();
        console.log(`✅ Vehicle ${vehicle.vehicleNumber} marked as Available`);
      } else {
        console.warn(`⚠️ Vehicle not found: ${booking.vehicle._id}`);
      }
    }

    // ✅ 3. Release driver back to Available
    if (booking.driver) {
      const driver = await Driver.findById(booking.driver._id);
      if (driver) {
        driver.status = 'Available'; // Release driver
        await driver.save();
        console.log(`✅ Driver ${driver.name} released and marked as Available`);
      } else {
        console.warn(`⚠️ Driver not found: ${booking.driver._id}`);
      }
    }

    // ✅ 4. Send completion email to user
    let emailSent = false;
    try {
      const emailDetails = {
        userName: booking.customerName || req.user.name,
        bookingId: booking._id.toString(),
        vehicleName: booking.vehicleName,
        completionDate: new Date().toLocaleString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        }),
        totalAmount: booking.totalAmount,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation,
      };

      await sendJourneyCompletionEmail(
        booking.customerEmail || req.user.email,
        emailDetails
      );
      emailSent = true;
      console.log('✅ Journey completion email sent');
    } catch (emailError) {
      console.error('❌ Failed to send completion email:', emailError.message);
      // Don't fail the request if email fails
    }

    // Return updated booking with all details
    res.status(200).json({
      success: true,
      message: 'Journey marked as completed successfully',
      booking: {
        _id: booking._id,
        status: booking.status,
        vehicleStatus: 'Available',
        driverStatus: booking.driver ? 'Available' : 'N/A'
      },
      emailSent,
      updates: {
        bookingCompleted: true,
        vehicleReleased: !!booking.vehicle,
        driverReleased: !!booking.driver
      }
    });
  } catch (error) {
    console.error('❌ Error completing journey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete journey',
      error: error.message,
    });
  }
};

/**
 * Get bookings for manager's assigned location
 */
export const getManagerBookings = async (req, res) => {
  try {
    const managerId = req.user._id;

    // Get manager with populated location
    const manager = await User.findById(managerId).populate('assignedLocation');

    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Manager role required'
      });
    }

    if (!manager.assignedLocation) {
      return res.status(400).json({
        success: false,
        message: 'Manager has no assigned location'
      });
    }

    // Get location data
    const locationData = manager.assignedLocation;
    const locationCity = locationData.city.toLowerCase();
    const locationName = locationData.name.toLowerCase();

    console.log(`📍 Fetching bookings for location: ${locationCity} - ${locationName}`);

    // Get all bookings and filter by location matching
    const allBookings = await Booking.find({})
      .populate('customer', 'name email phone')
      .populate('vehicle', 'vehicleModel brand vehicleNumber vehicleType')
      .populate('driver', 'name phone gender status')
      .sort({ createdAt: -1 });

    // Filter bookings based on location matching (case-insensitive)
    const bookings = allBookings.filter(booking => {
      const pickup = (booking.pickupLocation || '').toLowerCase();
      const drop = (booking.dropLocation || '').toLowerCase();

      // Match if either pickup or drop location contains the city or name
      const matchesCity = pickup.includes(locationCity) || drop.includes(locationCity);
      const matchesName = pickup.includes(locationName) || drop.includes(locationName);

      return matchesCity || matchesName;
    });

    // Ensure customerName and customerEmail are set
    bookings.forEach(booking => {
      if (!booking.customerName && booking.customer) {
        booking.customerName = booking.customer.name;
      }
      if (!booking.customerEmail && booking.customer) {
        booking.customerEmail = booking.customer.email;
      }
    });

    console.log(`✅ Found ${bookings.length} bookings for ${locationData.city} - ${locationData.name}`);

    // Group bookings by status
    const bookingsByStatus = {
      pending: bookings.filter(b => b.status === 'pending'),
      confirmed: bookings.filter(b => b.status === 'confirmed'),
      pendingAssignment: bookings.filter(b => b.status === 'Pending Assignment'),
      driverAssigned: bookings.filter(b => b.status === 'Driver Assigned'),
      inProgress: bookings.filter(b => b.status === 'In Progress'),
      waitingToPayPenalty: bookings.filter(b => b.status === 'Waiting to pay penalty'),
      completed: bookings.filter(b => b.status === 'completed'),
      cancelled: bookings.filter(b => b.status === 'cancelled')
    };

    res.status(200).json({
      success: true,
      location: {
        name: locationData.name,
        city: locationData.city,
        fullName: `${locationData.city} - ${locationData.name}`
      },
      bookings,
      stats: {
        total: bookings.length,
        pending: bookingsByStatus.pending.length,
        confirmed: bookingsByStatus.confirmed.length,
        pendingAssignment: bookingsByStatus.pendingAssignment.length,
        driverAssigned: bookingsByStatus.driverAssigned.length,
        inProgress: bookingsByStatus.inProgress.length,
        waitingToPayPenalty: bookingsByStatus.waitingToPayPenalty.length,
        completed: bookingsByStatus.completed.length,
        cancelled: bookingsByStatus.cancelled.length,
        needsDriver: bookings.filter(b => b.needsDriver && !b.driver).length
      },
      bookingsByStatus
    });
  } catch (error) {
    console.error('❌ Error fetching manager bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

/**
 * Cancel Booking
 * Allows users to cancel their bookings and releases associated resources
 */
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user._id;

    console.log('🚫 Cancellation requested:', { bookingId, userId, reason: cancellationReason });

    // Find booking and verify ownership
    const booking = await Booking.findById(bookingId)
      .populate('vehicle')
      .populate('driver', 'name phone email gender status');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify user owns this booking
    if (booking.customer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking',
      });
    }

    // Check if booking can be cancelled
    const cancellableStatuses = ['confirmed', 'Pending Assignment', 'Driver Assigned', 'In Progress'];
    if (!cancellableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status: ${booking.status}. Must be one of: ${cancellableStatuses.join(', ')}`,
      });
    }

    // ✅ 1. Update booking status to cancelled
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason || 'Cancelled by user';
    booking.cancelledAt = new Date();
    await booking.save();
    console.log('✅ Booking marked as cancelled:', bookingId);

    // ✅ 2. Update vehicle to Available
    if (booking.vehicle) {
      const vehicle = await Vehicle.findById(booking.vehicle._id);
      if (vehicle) {
        vehicle.status = 'Available';
        vehicle.assignedDriver = null; // Clear assigned driver
        await vehicle.save();
        console.log(`✅ Vehicle ${vehicle.vehicleName || vehicle.vehicleModel} marked as Available`);
      } else {
        console.warn(`⚠️ Vehicle not found: ${booking.vehicle._id}`);
      }
    }

    // ✅ 3. Release driver back to Available
    if (booking.driver) {
      const driver = await Driver.findById(booking.driver._id);
      if (driver) {
        driver.status = 'Available'; // Release driver
        await driver.save();
        console.log(`✅ Driver ${driver.name} released and marked as Available`);
      } else {
        console.warn(`⚠️ Driver not found: ${booking.driver._id}`);
      }
    }

    // ✅ 4. Send cancellation email to user (optional - can be added later)
    // For now, we'll skip email to keep it simple

    // Return updated booking with all details
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        _id: booking._id,
        status: booking.status,
        cancellationReason: booking.cancellationReason,
        cancelledAt: booking.cancelledAt,
        vehicleStatus: 'Available',
        driverStatus: booking.driver ? 'Available' : 'N/A'
      },
      updates: {
        bookingCancelled: true,
        vehicleReleased: !!booking.vehicle,
        driverReleased: !!booking.driver
      }
    });
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
};

/**
 * Update booking status (for manager actions)
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Get manager with populated location
    const manager = await User.findById(managerId).populate('assignedLocation');

    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Manager role required'
      });
    }

    if (!manager.assignedLocation) {
      return res.status(400).json({
        success: false,
        message: 'Manager has no assigned location'
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId).populate('vehicle').populate('driver');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify booking is in manager's location
    const locationCity = manager.assignedLocation.city;
    const locationName = manager.assignedLocation.name;
    const fullLocationName = `${locationCity} - ${locationName}`;

    const pickupLoc = (booking.pickupLocation || '').trim();
    const dropLoc = (booking.dropLocation || '').trim();
    const isInLocation = pickupLoc === fullLocationName || dropLoc === fullLocationName ||
                        pickupLoc === locationCity || dropLoc === locationCity;

    if (!isInLocation) {
      return res.status(403).json({
        success: false,
        message: 'This booking is not in your assigned location'
      });
    }

    // Update booking status
    const previousStatus = booking.status;
    booking.status = status;

    // If marking as completed, release vehicle and driver
    if (status === 'completed') {
      if (booking.vehicle) {
        const vehicle = await Vehicle.findById(booking.vehicle._id);
        if (vehicle) {
          vehicle.status = 'Available';
          vehicle.assignedDriver = null;
          await vehicle.save();
          console.log(`✅ Manager: Vehicle ${vehicle.vehicleNumber} marked as Available`);
        }
      }

      if (booking.driver) {
        const driver = await Driver.findById(booking.driver._id);
        if (driver) {
          driver.status = 'Available';
          await driver.save();
          console.log(`✅ Manager: Driver ${driver.name} marked as Available`);
        }
      }
    }

    await booking.save();

    console.log(`✅ Manager updated booking ${bookingId}: ${previousStatus} → ${status}`);

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      booking: {
        _id: booking._id,
        status: booking.status,
        previousStatus
      }
    });
  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};
