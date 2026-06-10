// backend/controllers/paymentController.js

import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';

/**
 * Create Razorpay Order
 */
export const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Save payment record with initiated status
    const payment = new Payment({
      customer: req.user._id,
      amount: amount,
      method: 'razorpay',
      status: 'initiated',
      transactionId: order.id,
    });

    await payment.save();

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentRecordId: payment._id,
    });
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

/**
 * Verify Razorpay Payment Signature
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Create signature for verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update payment status
      await Payment.findOneAndUpdate(
        { transactionId: razorpay_order_id },
        {
          status: 'success',
          transactionId: razorpay_payment_id,
          signature: razorpay_signature,
        }
      );

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
      });
    } else {
      // Update payment status to failed
      await Payment.findOneAndUpdate(
        { transactionId: razorpay_order_id },
        { status: 'failed' }
      );

      res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};

/**
 * Flag Payment for Review (mark as invalid when booking fails)
 */
export const flagPaymentForReview = async (req, res) => {
  try {
    const { paymentId, error: errorMessage } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required',
      });
    }

    // Find and update payment status to invalid
    const payment = await Payment.findOneAndUpdate(
      { transactionId: paymentId },
      {
        status: 'invalid',
        errorMessage: errorMessage || 'Booking creation failed after successful payment'
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    console.log(`⚠️ Payment ${paymentId} flagged as invalid due to booking failure`);

    res.status(200).json({
      success: true,
      message: 'Payment flagged for review',
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        status: payment.status,
        errorMessage: payment.errorMessage
      }
    });
  } catch (error) {
    console.error('❌ Error flagging payment for review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag payment for review',
      error: error.message,
    });
  }
};

// ===== PENALTY PAYMENT FUNCTIONS =====

import Booking from '../models/Booking.js';

/**
 * Create Razorpay Order for Penalty Payment
 */
export const createPenaltyOrder = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    console.log('💰 Creating penalty order for booking:', bookingId);

    // Find booking and validate
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if booking belongs to user
    if (booking.customer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to booking',
      });
    }

    // Check if penalty exists and is unpaid
    if (!booking.penaltyAmount || booking.penaltyAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No penalty amount found for this booking',
      });
    }

    if (booking.penaltyPaid) {
      return res.status(400).json({
        success: false,
        message: 'Penalty already paid',
      });
    }

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    const options = {
      amount: Math.round(booking.penaltyAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: `pen_${bookingId.slice(-8)}_${Date.now().toString().slice(-6)}`, // Keep under 40 chars
      notes: {
        bookingId: bookingId,
        type: 'penalty',
        vehicleName: booking.vehicleName,
        penaltyReason: booking.penaltyReason || 'Damage charges',
      },
    };

    const order = await razorpay.orders.create(options);

    // Save payment record
    const payment = new Payment({
      booking: bookingId,
      customer: userId,
      amount: booking.penaltyAmount,
      method: 'razorpay',
      status: 'initiated',
      transactionId: order.id,
      paymentType: 'penalty',
    });

    await payment.save();

    console.log('✅ Penalty order created:', order.id);

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      paymentRecordId: payment._id,
    });
  } catch (error) {
    console.error('❌ Error creating penalty order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create penalty payment order',
      error: error.message,
    });
  }
};

/**
 * Verify Penalty Payment and Update Booking
 */
export const verifyPenaltyPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id;

    console.log('💳 Verifying penalty payment for booking:', bookingId);

    // Find booking
    const booking = await Booking.findById(bookingId).populate('vehicle driver');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check authorization
    if (booking.customer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      // Update payment status to failed
      await Payment.findOneAndUpdate(
        { transactionId: razorpay_order_id },
        { status: 'failed' }
      );

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Update payment record
    await Payment.findOneAndUpdate(
      { transactionId: razorpay_order_id },
      {
        status: 'success',
        transactionId: razorpay_payment_id,
        signature: razorpay_signature,
      }
    );

    // Update booking - mark penalty as paid and complete the booking
    booking.penaltyPaid = true;
    booking.penaltyPaidAt = new Date();
    booking.status = 'completed'; // Move from "Waiting to pay penalty" to "completed"

    // Make vehicle and driver available again
    if (booking.vehicle) {
      booking.vehicle.isAvailable = true;
      await booking.vehicle.save();
    }

    if (booking.driver) {
      booking.driver.isAvailable = true;
      await booking.driver.save();
    }

    await booking.save();

    console.log('✅ Penalty payment verified and booking completed:', bookingId);

    res.status(200).json({
      success: true,
      message: 'Penalty payment successful! Booking completed.',
      booking: {
        id: booking._id,
        status: booking.status,
        penaltyPaid: booking.penaltyPaid,
        penaltyAmount: booking.penaltyAmount,
      },
    });
  } catch (error) {
    console.error('❌ Error verifying penalty payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};

/**
 * Get Penalty Details for a Booking
 */
export const getPenaltyDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId).select(
      'penaltyAmount penaltyReason penaltyPaid penaltyPaidAt vehicleName customer'
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.customer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    res.status(200).json({
      success: true,
      penalty: {
        amount: booking.penaltyAmount || 0,
        reason: booking.penaltyReason || 'N/A',
        paid: booking.penaltyPaid || false,
        paidAt: booking.penaltyPaidAt || null,
        vehicleName: booking.vehicleName,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching penalty details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch penalty details',
      error: error.message,
    });
  }
};
