import mongoose from 'mongoose';
import dns from 'dns';
import { logger } from '../lib/logger';

// Set public DNS servers (Google / Cloudflare) to prevent querySrv ECONNREFUSED on Windows ISP DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback if DNS override fails
}

// Serverless functions (Vercel) reuse a warm process across invocations, so
// connectDB() gets called on every request - this must never open a second
// connection on top of an already-live or in-progress one.
let connectPromise: Promise<void> | null = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return; // already connected
  if (connectPromise) return connectPromise; // a connection attempt is already in flight

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    logger.warn('MONGODB_URI not set in environment - running with in-memory fallback');
    return;
  }

  connectPromise = mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
    })
    .then(() => {
      logger.info('✅ MongoDB Connected Successfully!');
    })
    .catch((error) => {
      logger.error({ error }, '❌ MongoDB Connection Failed - continuing with in-memory data');
      // Don't throw — caller runs with in-memory fallback
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB Disconnected');
});

mongoose.connection.on('error', (error) => {
  logger.error({ error }, 'MongoDB Error');
});
