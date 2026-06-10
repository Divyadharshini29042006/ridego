// backend/config/db.js
import mongoose from 'mongoose';
import dns from 'dns';

// Override DNS servers to Google and Cloudflare to resolve MongoDB Atlas SRV records in cloud environments (Render)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('⚠️ Could not set custom DNS servers:', dnsErr.message);
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;