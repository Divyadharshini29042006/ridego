import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import Location from '../models/Location.js';
import connectDB from '../config/db.js'; // Import the DB connection from backend config

// Connect to MongoDB
await connectDB();

const checkAndMigrateVehicles = async () => {
  try {
    console.log('🔍 Starting vehicle data check and migration...');

    // Query all available vehicles
    const availableVehicles = await Vehicle.find({ status: 'Available' });
    console.log(`📊 Total available vehicles found: ${availableVehicles.length}`);

    if (availableVehicles.length === 0) {
      console.log('No available vehicles to check.');
      process.exit(0);
    }

    // Group vehicles by assignedLocation
    const locationGroups = {};
    let migrationNeeded = false;

    for (const vehicle of availableVehicles) {
      const locId = vehicle.assignedLocation;
      const locType = mongoose.Types.ObjectId.isValid(locId) && locId instanceof mongoose.Types.ObjectId ? 'ObjectId' : 'String';
      
      if (!locationGroups[locId]) {
        locationGroups[locId] = { count: 0, type: locType, vehicles: [] };
      }
      locationGroups[locId].count++;
      locationGroups[locId].vehicles.push(vehicle._id);
      
      if (locType === 'String') {
        migrationNeeded = true;
        console.log(`⚠️ String assignedLocation detected for vehicle ${vehicle._id}: ${locId}`);
      }
    }

    // Fetch location details for each group
    console.log('\n📍 Vehicle distribution by location:');
    for (const [locId, group] of Object.entries(locationGroups)) {
      let locationInfo = 'Unknown';
      try {
        const location = await Location.findById(locId);
        if (location) {
          locationInfo = `${location.city} - ${location.name}`;
        } else if (mongoose.Types.ObjectId.isValid(locId)) {
          locationInfo = `Valid ObjectId but location not found`;
        } else {
          locationInfo = `Invalid ID: ${locId}`;
        }
      } catch (err) {
        locationInfo = `Error fetching location: ${err.message}`;
      }
      
      console.log(`  - ${locId} (${group.type}): ${group.count} vehicles in ${locationInfo}`);
    }

    // Perform migration if needed
    if (migrationNeeded) {
      console.log('\n🔄 Starting migration: Converting string assignedLocation to ObjectId...');
      let migratedCount = 0;
      
      for (const [locIdStr, group] of Object.entries(locationGroups)) {
        if (group.type === 'String' && mongoose.Types.ObjectId.isValid(locIdStr)) {
          const objectId = new mongoose.Types.ObjectId(locIdStr);
          
          // Verify the ObjectId exists as a location
          const locationExists = await Location.findById(objectId);
          if (locationExists) {
            // Update all vehicles in this group
            const result = await Vehicle.updateMany(
              { _id: { $in: group.vehicles } },
              { assignedLocation: objectId }
            );
            migratedCount += result.modifiedCount;
            console.log(`  ✅ Migrated ${result.modifiedCount} vehicles for location ${locIdStr} → ${objectId} (${locationExists.city} - ${locationExists.name})`);
          } else {
            console.log(`  ❌ Skipped invalid location ${locIdStr}: No matching ObjectId found.`);
          }
        }
      }
      
      console.log(`\n✅ Migration complete: ${migratedCount} vehicles updated.`);
    } else {
      console.log('\n✅ No migration needed: All assignedLocation are ObjectId.');
    }

    // Final verification
    const postVehicles = await Vehicle.find({ status: 'Available' });
    console.log(`\n📊 Post-check: Total available vehicles: ${postVehicles.length}`);
    
    // Re-group to confirm
    const postGroups = {};
    for (const vehicle of postVehicles) {
      const locId = vehicle.assignedLocation;
      if (!postGroups[locId]) postGroups[locId] = 0;
      postGroups[locId]++;
    }
    
    console.log('📍 Post-migration distribution:');
    for (const [locId, count] of Object.entries(postGroups)) {
      const location = await Location.findById(locId);
      const locationInfo = location ? `${location.city} - ${location.name}` : 'Unknown';
      console.log(`  - ${locId}: ${count} vehicles in ${locationInfo}`);
    }

    console.log('\n🎉 Data check and migration completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error during data check/migration:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
