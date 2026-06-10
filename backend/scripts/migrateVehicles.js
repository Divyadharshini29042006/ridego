import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Define schemas directly in the migration script to avoid import issues
const vehicleSchema = new mongoose.Schema({
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
  subLocation: {
    type: String,
    required: false,
    trim: true,
  },
  vehicleModel: String,
  brand: String,
  color: String,
  vehicleType: String,
  fuelType: String,
  seatingCapacity: Number,
  transmission: String,
  rentPerDay: Number,
  rentPerHour: Number,
  depositAmount: Number,
  vehicleNumber: String,
  modelYear: Number,
  mileage: String,
  vehicleImage: String,
  status: {
    type: String,
    enum: ['Available', 'Booked', 'Maintenance'],
    default: 'Available',
  },
}, {
  timestamps: true,
});

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  subCities: {
    type: [String],
    default: []
  }
}, { timestamps: true });

const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
const Location = mongoose.models.Location || mongoose.model('Location', locationSchema);

/**
 * Migration Script: Add subLocation field to existing vehicles
 * Run this once to update your existing vehicle documents
 */

const migrateVehicles = async () => {
  try {
    console.log('🔄 Starting vehicle migration...');
    
    // Connect to MongoDB
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not found in .env file');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all vehicles without subLocation field
    const vehiclesWithoutSubLocation = await Vehicle.find({
      $or: [
        { subLocation: { $exists: false } },
        { subLocation: null }
      ]
    }).populate('assignedLocation');

    console.log(`📋 Found ${vehiclesWithoutSubLocation.length} vehicles to update`);

    if (vehiclesWithoutSubLocation.length === 0) {
      console.log('✅ All vehicles already have subLocation field. No migration needed.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Update each vehicle
    let updated = 0;
    let skipped = 0;

    for (const vehicle of vehiclesWithoutSubLocation) {
      try {
        // Set empty string as default subLocation
        vehicle.subLocation = '';
        await vehicle.save();
        updated++;
        
        console.log(`✅ Updated vehicle: ${vehicle.vehicleNumber} (${vehicle.brand} ${vehicle.vehicleModel})`);
      } catch (err) {
        console.error(`❌ Error updating vehicle ${vehicle.vehicleNumber}:`, err.message);
        skipped++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully updated: ${updated} vehicles`);
    console.log(`   ⚠️  Skipped: ${skipped} vehicles`);
    console.log(`   📋 Total processed: ${vehiclesWithoutSubLocation.length} vehicles`);

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Optional: Verify subCities in locations
const verifyLocations = async () => {
  try {
    console.log('\n🔍 Verifying location data...');
    
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not found in .env file');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const locations = await Location.find({});
    
    console.log(`\n📍 Found ${locations.length} locations:`);
    
    locations.forEach(loc => {
      console.log(`\n   City: ${loc.city}`);
      console.log(`   Name: ${loc.name}`);
      console.log(`   SubCities: ${loc.subCities.length > 0 ? loc.subCities.join(', ') : 'None'}`);
    });

    // Check for locations without subCities
    const locationsWithoutSubCities = locations.filter(loc => !loc.subCities || loc.subCities.length === 0);
    
    if (locationsWithoutSubCities.length > 0) {
      console.log(`\n⚠️  Warning: ${locationsWithoutSubCities.length} location(s) have no subCities defined:`);
      locationsWithoutSubCities.forEach(loc => {
        console.log(`   - ${loc.name} (${loc.city})`);
      });
      console.log('\n💡 Tip: Add subCities to these locations for better filtering.');
    } else {
      console.log('\n✅ All locations have subCities defined!');
    }

    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying locations:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run migration
console.log('🚀 Ridego - Vehicle Migration Tool\n');
console.log('This script will add the subLocation field to all existing vehicles.\n');

const args = process.argv.slice(2);

if (args.includes('--verify-locations')) {
  verifyLocations();
} else {
  migrateVehicles();
}