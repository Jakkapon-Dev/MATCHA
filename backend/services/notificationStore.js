import mongoose from 'mongoose';
import { isDemo } from '../config/storeMode.js';

/* The offline demo store's notification list.

   It exists only so the demo build has something to show without a database
   behind it. A live shop must never read from it: an admin looking at a stale
   in-memory list during an outage sees an empty badge and concludes no orders
   came in, which is worse than being told the list is unavailable. */
export const memoryNotifications = [];

export function isDbConnected() {
  return mongoose.connection.readyState === 1 && Boolean(mongoose.connection.db);
}

/** True only for the offline demo build, never for a live or production shop. */
export function isMemoryFallbackAllowed() {
  return isDemo && process.env.NODE_ENV !== 'production';
}

export default {
  memoryNotifications,
  isDbConnected,
  isMemoryFallbackAllowed,
};
