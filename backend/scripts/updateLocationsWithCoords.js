// backend/scripts/updateLocationsWithCoords.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Location from '../models/Location.js';

// Location coordinates (approximate center and radius in degrees for Tamil Nadu locations)
const LOCATION_COORDS = {
  'Marina': { lat: 13.0827, lng: 80.2707, radius: 0.02 },
  'Besant Nagar': { lat: 13.0005, lng: 80.2667, radius: 0.015 },
  'Guindy': { lat: 13.0067, lng: 80.2206, radius: 0.02 },
  'Peelamedu': { lat: 11.0289, lng: 76.9956, radius: 0.02 },
  'Kovilpatti': { lat: 9.1717, lng: 77.8699, radius: 0.02 },
  'Whitetown': { lat: 11.9300, lng: 79.8300, radius: 0.015 },
  'Auroville': { lat: 11.9300, lng: 79.8100, radius: 0.03 },
  'whitetown': { lat: 11.9300, lng: 79.8300, radius: 0.015 },
  'auroville': { lat: 11.9300, lng: 79.8100, radius: 0.03 },
};

async function updateLocationsWithCoords() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const locations = await Location.find({});
    let updatedCount = 0;

    for (const location of locations) {
      if (!location.lat || !location.lng || !location.radius) {
        const locationCoords = LOCATION_COORDS[location.name];
        if (locationCoords) {
          location.lat = locationCoords.lat;
          location.lng = locationCoords.lng;
          location.radius = locationCoords.radius;
          await location.save();
          updatedCount++;
          console.log(`✅ Updated ${location.name} (${location.city}) with coordinates`);
        } else {
          console.warn(`⚠️ No coordinates available for location: ${location.name}`);
        }
      }
    }

    console.log(`✅ Updated ${updatedCount} locations with coordinates`);
  } catch (error) {
    console.error('❌ Error updating locations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🛑 Disconnected from MongoDB');
  }
}

updateLocationsWithCoords();
