/* The rate-limit store has one job the in-memory store could not do: make a
 * count that every instance shares. These stand a single fake Mongo collection
 * in for the real one — which is exactly what "shared" means, since every
 * instance talks to the same collection — and prove the count accumulates
 * across calls, resets when the window turns over, and keeps each limiter and
 * each client in its own bucket. A fake is used deliberately: the behaviour
 * under test is the store's, not the driver's.
 */

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import { createMongoRateLimitStore } from '../services/rateLimitStore.js';

/* A stand-in for one Mongo collection, implementing just the operations the
   store uses with the same upsert / $inc semantics the real driver has. */
function fakeCollection() {
  const docs = new Map();
  return {
    docs,
    async createIndex() {},
    async findOneAndUpdate(filter, update, options) {
      const id = filter._id;
      let doc = docs.get(id);
      if (!doc) {
        if (!options?.upsert) return null;
        doc = { _id: id, ...(update.$setOnInsert || {}) };
        docs.set(id, doc);
      }
      if (update.$inc) for (const [k, v] of Object.entries(update.$inc)) doc[k] = (doc[k] || 0) + v;
      return doc; // driver v6 shape: the document itself
    },
    async updateOne(filter, update) {
      const doc = docs.get(filter._id);
      if (doc && update.$inc) for (const [k, v] of Object.entries(update.$inc)) doc[k] = (doc[k] || 0) + v;
    },
    async deleteOne(filter) {
      docs.delete(filter._id);
    }
  };
}

let realDb, realReadyState, clock, now;

beforeEach(() => {
  realDb = mongoose.connection.db;
  realReadyState = mongoose.connection.readyState;
  const collection = fakeCollection();
  mongoose.connection.readyState = 1;
  mongoose.connection.db = { collection: () => collection };
  now = 1_000_000_000_000;
  clock = () => now;
});

afterEach(() => {
  mongoose.connection.db = realDb;
  mongoose.connection.readyState = realReadyState;
});

// The store reads Date.now(); pin it so window maths is exact.
const withClock = (fn) => {
  const real = Date.now;
  Date.now = clock;
  return Promise.resolve(fn()).finally(() => { Date.now = real; });
};

test('the count accumulates across calls — the shared counter every instance sees', async () => {
  await withClock(async () => {
    const store = createMongoRateLimitStore({ prefix: 'auth' });
    store.init({ windowMs: 15 * 60 * 1000 });

    const hits = [];
    for (let i = 0; i < 5; i++) hits.push((await store.increment('1.2.3.4')).totalHits);

    assert.deepEqual(hits, [1, 2, 3, 4, 5], 'each attempt is counted, not reset to one');
  });
});

test('two stores built the same way share the collection, as two instances would', async () => {
  await withClock(async () => {
    // Same prefix, same client, different store objects: the second is another
    // process, and it must see the first process's count.
    const instanceA = createMongoRateLimitStore({ prefix: 'auth' });
    const instanceB = createMongoRateLimitStore({ prefix: 'auth' });
    instanceA.init({ windowMs: 15 * 60 * 1000 });
    instanceB.init({ windowMs: 15 * 60 * 1000 });

    await instanceA.increment('9.9.9.9');
    await instanceB.increment('9.9.9.9');
    const third = await instanceA.increment('9.9.9.9');

    assert.equal(third.totalHits, 3, 'the flood is counted together, not once per instance');
  });
});

test('a new window starts the count over', async () => {
  const windowMs = 15 * 60 * 1000;
  const store = createMongoRateLimitStore({ prefix: 'auth' });
  store.init({ windowMs });

  const first = await withClock(() => store.increment('5.5.5.5'));
  assert.equal(first.totalHits, 1);

  now += windowMs; // step into the next window
  const nextWindow = await withClock(() => store.increment('5.5.5.5'));
  assert.equal(nextWindow.totalHits, 1, 'the previous window does not carry over');
});

test('different clients and different limiters never share a bucket', async () => {
  await withClock(async () => {
    const auth = createMongoRateLimitStore({ prefix: 'auth' });
    const reset = createMongoRateLimitStore({ prefix: 'reset' });
    auth.init({ windowMs: 15 * 60 * 1000 });
    reset.init({ windowMs: 60 * 60 * 1000 });

    await auth.increment('1.1.1.1');
    await auth.increment('1.1.1.1');
    const otherClient = await auth.increment('2.2.2.2');
    const otherLimiter = await reset.increment('1.1.1.1');

    assert.equal(otherClient.totalHits, 1, 'another address is a fresh count');
    assert.equal(otherLimiter.totalHits, 1, 'the reset limiter does not inherit login attempts');
  });
});

test('resetKey clears the current window for that client', async () => {
  await withClock(async () => {
    const store = createMongoRateLimitStore({ prefix: 'auth' });
    store.init({ windowMs: 15 * 60 * 1000 });

    await store.increment('7.7.7.7');
    await store.increment('7.7.7.7');
    await store.resetKey('7.7.7.7');
    const afterReset = await store.increment('7.7.7.7');

    assert.equal(afterReset.totalHits, 1, 'the count begins again after a reset');
  });
});

test('a database that is down fails open rather than locking everyone out', async () => {
  await withClock(async () => {
    mongoose.connection.readyState = 0;
    mongoose.connection.db = null;

    const store = createMongoRateLimitStore({ prefix: 'auth' });
    store.init({ windowMs: 15 * 60 * 1000 });

    const result = await store.increment('1.2.3.4');
    assert.equal(result.totalHits, 1, 'an outage never reports a client over the limit');
    assert.ok(result.resetTime instanceof Date);
  });
});

test('a store cannot be built without a prefix', () => {
  assert.throws(() => createMongoRateLimitStore({}), /prefix/);
});
