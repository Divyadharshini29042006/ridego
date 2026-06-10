export const calculateFare = ({
  tripType,
  pickupLocation,
  dropLocation,
  pickupDate,
  returnDate,
  vehicleRentPerDay,
  vehicleRentPerHour,
  vehicleType,
  hours,
  needsDriver
}) => {
  console.log('🧮 Backend Calculate Fare Input:', {
    tripType,
    pickupLocation,
    dropLocation,
    vehicleRentPerDay,
    vehicleRentPerHour,
    vehicleType,
    hours,
    needsDriver
  });

  // Validation
  if (!tripType) {
    console.error('❌ Missing tripType');
    throw new Error('Trip type is required');
  }

  // Set default values - MATCH FRONTEND LOGIC
  const rentPerDay = vehicleRentPerDay || 0;
  // ✅ FIX: Use same fallback logic as frontend: vehicleRentPerHour || (vehicleRentPerDay / 10)
  const rentPerHour = vehicleRentPerHour || (vehicleRentPerDay ? vehicleRentPerDay / 10 : (vehicleType === 'Bike' ? 100 : 300));

  let breakdown = {
    vehicleRent: 0,
    distanceCharges: 0,
    driverCharges: 0,
    nightCharges: 0,
    platformFee: vehicleType === 'Bike' ? 99 : 199,
    gst: 0
  };

  let days = 1;

  // Base calculations based on trip type
  switch (tripType) {
    case 'outstation':
      if (!pickupDate || !returnDate) {
        console.error('❌ Missing dates for outstation trip');
        throw new Error('Pickup and return dates are required for outstation trips');
      }

      days = Math.max(1, Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)));
      breakdown.vehicleRent = rentPerDay * days;

      // ✅ FIX: Always calculate distance charges for outstation (match frontend)
      breakdown.distanceCharges = calculateDistanceCharges(pickupLocation, dropLocation);

      console.log(`📅 Outstation: ${days} days × ₹${rentPerDay} = ₹${breakdown.vehicleRent}`);
      break;

    case 'hourly':
      const actualHours = Math.max(1, hours || 1);
      breakdown.vehicleRent = rentPerHour * actualHours;
      console.log(`⏰ Hourly: ${actualHours} hours × ₹${rentPerHour} = ₹${breakdown.vehicleRent}`);
      break;

    case 'local':
      breakdown.vehicleRent = rentPerDay;

      if (pickupLocation && dropLocation && pickupLocation !== dropLocation) {
        breakdown.distanceCharges = calculateDistanceCharges(pickupLocation, dropLocation) * 0.5;
      }

      console.log(`🚗 Local: ₹${rentPerDay} + distance charges ₹${breakdown.distanceCharges}`);
      break;

    default:
      console.error('❌ Invalid trip type:', tripType);
      throw new Error('Invalid trip type');
  }

  // Add driver charges if needed
  if (needsDriver) {
    breakdown.driverCharges = calculateDriverCharges(tripType, hours, days);
    console.log(`👨‍✈️ Driver charges: ₹${breakdown.driverCharges}`);
  }

  // ✅ FIX: Use local time for night charge calculation (IST)
  if (pickupDate) {
    const pickupDateTime = new Date(pickupDate);

    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(pickupDateTime.getTime() + istOffset);
    const istHours = istTime.getUTCHours(); // Get hours in IST

    // Night time: 8 PM (20:00) to 6 AM (06:00)
    if (istHours >= 20 || istHours < 6) {
      breakdown.nightCharges = 299;
      console.log(`🌙 Night charges applied (IST time: ${istHours}:00): ₹299`);
    } else {
      console.log(`☀️ No night charges (IST time: ${istHours}:00)`);
    }
  }

  // Calculate subtotal (before GST)
  const subtotal =
    breakdown.vehicleRent +
    breakdown.distanceCharges +
    breakdown.driverCharges +
    breakdown.nightCharges +
    breakdown.platformFee;

  // Calculate GST (5% on subtotal)
  breakdown.gst = Math.round(subtotal * 0.05);

  // Calculate total
  const total = subtotal + breakdown.gst;

  console.log('💰 Backend Fare Breakdown:', {
    ...breakdown,
    subtotal,
    total
  });

  return {
    breakdown,
    total: Math.round(total),
    ...(tripType === 'outstation' ? { days } : {})
  };
};

const calculateDistanceCharges = (pickup, drop) => {
  if (!pickup || !drop || pickup === drop) {
    return 0; // No distance charges for round-trip (same location)
  }

  // Extract city names (remove sub-location parts)
  const pickupCity = pickup.split(' - ')[0].trim();
  const dropCity = drop.split(' - ')[0].trim();

  if (pickupCity === dropCity) {
    return 0; // Same city
  }

  const distanceMatrix = {
    'Madurai-Chennai': 450,
    'Chennai-Madurai': 450,
    'Madurai-Coimbatore': 220,
    'Coimbatore-Madurai': 220,
    'Chennai-Coimbatore': 510,
    'Coimbatore-Chennai': 510,
    'Madurai-Trichy': 150,
    'Trichy-Madurai': 150,
    'Chennai-Trichy': 320,
    'Trichy-Chennai': 320,
    'Coimbatore-Trichy': 200,
    'Trichy-Coimbatore': 200
  };

  const key = `${pickupCity}-${dropCity}`;
  const distance = distanceMatrix[key] || 100;
  const charges = distance * 12; // ₹12 per km

  console.log(`🛣️ Distance ${pickupCity} → ${dropCity}: ${distance}km × ₹12 = ₹${charges}`);

  return charges;
};

const calculateDriverCharges = (tripType, hours = 0, days = 1) => {
  switch (tripType) {
    case 'outstation':
      return 1500 * Math.max(1, days); // ₹1500 per day for outstation
    case 'hourly':
      return Math.max(1, hours) * 150; // ₹150 per hour
    case 'local':
      return 800; // Fixed rate for local trips
    default:
      return 0;
  }
};
