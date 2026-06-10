// backend/scripts/vehicleLocationSimulator.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Vehicle from '../models/Vehicle.js';
import Location from '../models/Location.js';

// Movement parameters based on status
const MOVEMENT_CONFIG = {
  Available: {
    speed: 0, // Stationary
    maxMove: 0,
    description: 'Stationary at assigned sub-location'
  },
  Booked: {
    speed: 0.0002, // Realistic driving speed
    maxMove: 0.003,
    description: 'Moving within sub-location radius'
  },
  Completed: {
    speed: 0, // No movement
    maxMove: 0,
    description: 'Stationary at drop location'
  },
  Maintenance: {
    speed: 0, // No movement
    maxMove: 0,
    description: 'Stationary at maintenance location'
  }
};

class VehicleLocationSimulator {
  constructor() {
    this.isRunning = false;
    this.updateInterval = 10000; // 10 seconds
    this.intervalId = null;
  }

  // Connect to MongoDB
  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connected to MongoDB for vehicle simulation');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  // Initialize vehicle locations using assignedLocation coordinates
  async initializeVehicleLocations() {
    try {
      const vehicles = await Vehicle.find()
        .populate('assignedLocation', 'name city lat lng radius');

      let initializedCount = 0;

      for (const vehicle of vehicles) {
        // Skip if vehicle already has a location
        if (vehicle.currentLocation?.lat && vehicle.currentLocation?.lng) {
          continue;
        }

        const location = vehicle.assignedLocation;
        if (!location || !location.lat || !location.lng) {
          console.warn(`⚠️ Missing coordinates for vehicle ${vehicle.vehicleNumber} at location ${location?.name || 'unknown'}`);
          continue;
        }

        // For Available vehicles, place exactly at assigned location
        // For others, place randomly within radius
        let initialLat, initialLng;
        if (vehicle.status === 'Available') {
          initialLat = location.lat;
          initialLng = location.lng;
        } else {
          const randomLocation = this.getRandomLocationInBounds(location);
          initialLat = randomLocation.lat;
          initialLng = randomLocation.lng;
        }

        vehicle.currentLocation = {
          lat: initialLat,
          lng: initialLng,
          updatedAt: new Date()
        };

        await vehicle.save();
        initializedCount++;
      }

      console.log(`✅ Initialized ${initializedCount} vehicle locations`);
    } catch (error) {
      console.error('❌ Error initializing vehicle locations:', error);
    }
  }

  // Generate random location within location bounds
  getRandomLocationInBounds(location) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * location.radius;

    return {
      lat: location.lat + radius * Math.cos(angle),
      lng: location.lng + radius * Math.sin(angle)
    };
  }

  // Check if location is within bounds
  isWithinBounds(lat, lng, bounds) {
    const distance = Math.sqrt(
      Math.pow(lat - bounds.lat, 2) +
      Math.pow(lng - bounds.lng, 2)
    );
    return distance <= bounds.radius;
  }

  // Calculate new position based on vehicle status
  calculateNewPosition(vehicle, locationBounds) {
    const status = vehicle.status;
    const config = MOVEMENT_CONFIG[status] || MOVEMENT_CONFIG.Available;

    // No movement for Available, Completed, and Maintenance
    if (config.speed === 0) {
      return {
        lat: vehicle.currentLocation.lat,
        lng: vehicle.currentLocation.lng
      };
    }

    // Calculate movement for Booked vehicles
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * config.maxMove;

    let newLat = vehicle.currentLocation.lat + distance * Math.cos(angle);
    let newLng = vehicle.currentLocation.lng + distance * Math.sin(angle);

    // Ensure vehicle stays within sub-location bounds
    let attempts = 0;
    while (!this.isWithinBounds(newLat, newLng, locationBounds) && attempts < 10) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * config.maxMove;
      newLat = vehicle.currentLocation.lat + distance * Math.cos(angle);
      newLng = vehicle.currentLocation.lng + distance * Math.sin(angle);
      attempts++;
    }

    // If still out of bounds, keep current location
    if (!this.isWithinBounds(newLat, newLng, locationBounds)) {
      return {
        lat: vehicle.currentLocation.lat,
        lng: vehicle.currentLocation.lng
      };
    }

    return { lat: newLat, lng: newLng };
  }

  // Update all vehicle locations
  async updateVehicleLocations() {
    try {
      const vehicles = await Vehicle.find({
        'currentLocation.lat': { $exists: true },
        'currentLocation.lng': { $exists: true }
      }).populate('assignedLocation', 'name city lat lng radius');

      let updatedCount = 0;
      let stationaryCount = 0;
      let movingCount = 0;

      for (const vehicle of vehicles) {
        const location = vehicle.assignedLocation;
        if (!location || !location.lat || !location.lng || !location.radius) {
          continue;
        }

        const newPosition = this.calculateNewPosition(vehicle, location);

        // Check if position changed
        const hasMoved = newPosition.lat !== vehicle.currentLocation.lat ||
                         newPosition.lng !== vehicle.currentLocation.lng;

        vehicle.currentLocation = {
          lat: newPosition.lat,
          lng: newPosition.lng,
          updatedAt: new Date()
        };

        await vehicle.save();
        updatedCount++;

        if (hasMoved) {
          movingCount++;
        } else {
          stationaryCount++;
        }
      }

      console.log(`🔄 Updated ${updatedCount} vehicle locations at ${new Date().toLocaleTimeString()}`);
      console.log(`   📍 Stationary: ${stationaryCount}, Moving: ${movingCount}`);
    } catch (error) {
      console.error('❌ Error updating vehicle locations:', error);
    }
  }

  // Start the simulator
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Simulator is already running');
      return;
    }

    console.log('🚀 Starting Vehicle Location Simulator...');

    await this.connect();
    await this.initializeVehicleLocations();

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.updateVehicleLocations();
    }, this.updateInterval);

    console.log(`✅ Simulator started. Updating every ${this.updateInterval / 1000} seconds`);
    console.log('📊 Movement Configuration:');
    Object.entries(MOVEMENT_CONFIG).forEach(([status, config]) => {
      console.log(`   ${status}: ${config.description}`);
    });
  }

  // Stop the simulator
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Simulator is not running');
      return;
    }

    clearInterval(this.intervalId);
    this.isRunning = false;
    mongoose.connection.close();
    console.log('🛑 Simulator stopped');
  }
}

// Run simulator if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const simulator = new VehicleLocationSimulator();

  simulator.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    simulator.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    simulator.stop();
    process.exit(0);
  });
}

export default VehicleLocationSimulator;
