export const ensureValidRentData = (vehicle) => {
  const v = vehicle.toObject ? vehicle.toObject() : vehicle;

  const isValidNumber = (val) => typeof val === 'number' && val >= 0;

  if (!isValidNumber(v.rentPerDay)) {
    v.rentPerDay = v.vehicleType === 'Bike' ? 500 : 2000;
  }

  if (!isValidNumber(v.rentPerHour)) {
    v.rentPerHour = v.vehicleType === 'Bike' ? 100 : 300;
  }

  return v;
};
