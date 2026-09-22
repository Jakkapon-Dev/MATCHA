/* A rate-limit store that every backend instance shares.
 *
 * express-rate-limit's default store keeps its counters in the memory of one
 * process. The deployed API runs behind a load balancer with more than one
 * instance — observed live: the RateLimit-Remaining header for a single client
 * walked two separate sequences at once, one per instance — so each instance
 * only ever saw a fraction of a login flood and none of them reached the limit.
 * Thirty attempts became thirty-per-instance, and cold starts reset even that.
 * The brute-force limiter was, in practice, off.
 *
 * The counters live in Mongo instead, which every instance already shares. No
 * new service: it reuses the connection the app is already holding.
 *
 * Each fixed window is its own document, keyed by <prefix>:<client>:<window
 * start>. Bucketing the window into the id means a request never has to decide
 * whether a document it found is stale — a new window is simply a new id — so
 * there is no read-modify-write race at the window boundary. A TTL index drops
 * a window's document once it can no longer be counted against.
 *
 * If Mongo is unreachable the store fails open, reporting a single hit so a
 * database outage never locks legitimate users out of signing in. Login itself
 * needs the database, so an attacker gains nothing from the gap.
 */

import mongoose from 'mongoose';

const COLLECTION = 'rateLimitHits';
// Keep a window's document a minute past its reset so a late request in the
// same window still counts, then let the TTL monitor remove it.
const TTL_GRACE_MS = 60 * 1000;

let ttlEnsured = false;
async function ensureTtlIndex(collection) {
  if (ttlEnsured) return;
  try {
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    ttlEnsured = true;
  } catch {
    // A missing index only means expired windows are tidied less promptly; the
    // counting is still correct because each window has its own id.
  }
}

/* One store per limiter. The prefix keeps the login limiter and the
   password-reset limiter from sharing a bucket for the same address. */
export function createMongoRateLimitStore({ prefix }) {
  if (!prefix) throw new Error('createMongoRateLimitStore requires a prefix');
  let windowMs = 60 * 1000;

  const collection = () => {
    const conn = mongoose.connection;
    // A real connected Mongoose exposes db.collection(); a test that only fakes
    // readyState and db does not. Requiring the method keeps the store failing
    // open in both the outage case and against a stand-in, never throwing.
    return conn?.readyState === 1 && typeof conn.db?.collection === 'function'
      ? conn.db.collection(COLLECTION)
      : null;
  };

  const windowStartFor = (now) => Math.floor(now / windowMs) * windowMs;
  const idFor = (key, windowStart) => `${prefix}:${key}:${windowStart}`;

  return {
    localKeys: false,

    init(options) {
      if (options?.windowMs) windowMs = options.windowMs;
    },

    async increment(key) {
      const now = Date.now();
      const windowStart = windowStartFor(now);
      const resetTime = new Date(windowStart + windowMs);

      const c = collection();
      if (!c) return { totalHits: 1, resetTime };

      await ensureTtlIndex(c);
      const doc = await c.findOneAndUpdate(
        { _id: idFor(key, windowStart) },
        {
          $inc: { count: 1 },
          $setOnInsert: { expiresAt: new Date(windowStart + windowMs + TTL_GRACE_MS) }
        },
        { upsert: true, returnDocument: 'after' }
      );
      // The mongodb driver returns the document directly; older shapes wrap it
      // in { value }. Accept either so a driver bump does not silently zero the
      // count and disable the limit.
      const stored = doc && 'value' in doc ? doc.value : doc;
      return { totalHits: stored?.count ?? 1, resetTime };
    },

    async decrement(key) {
      const c = collection();
      if (!c) return;
      const windowStart = windowStartFor(Date.now());
      await c.updateOne({ _id: idFor(key, windowStart) }, { $inc: { count: -1 } });
    },

    async resetKey(key) {
      const c = collection();
      if (!c) return;
      const windowStart = windowStartFor(Date.now());
      await c.deleteOne({ _id: idFor(key, windowStart) });
    }
  };
}
