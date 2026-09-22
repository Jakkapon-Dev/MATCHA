/* Abandoned checkouts used to keep stock off the shelf for good.
 *
 * An order takes its units in the same transaction that writes it, before
 * Stripe has been asked for anything — the only way two shoppers cannot both
 * buy the last M. But a declined card, a closed tab or a PromptPay QR nobody
 * scans left that order `unpaid` and `pending`, holding real inventory with
 * nothing anywhere that would give it back.
 *
 * These cover the sweeper that now does.
 */

import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import * as sweeper from '../services/reservationSweeper.js';

/* A stand-in for a Mongo session. The real one needs a replica set; what is
   being tested here is which orders are claimed and what is written to them,
   not that Mongo can do transactions. */
function fakeSessionClient() {
  return {
    startSession: async () => ({
      withTransaction: async (fn) => fn(),
      endSession: async () => {}
    })
  };
}

function withFakeMongo(run) {
  const readyState = mongoose.connection.readyState;
  mongoose.connection.readyState = 1;
  const getClient = mongoose.connection.getClient;
  mongoose.connection.getClient = fakeSessionClient;
  // releaseStock credits the size bucket; what it does to Mongo is covered by
  // the order tests, so here it only needs to succeed.
  mock.method(Product, 'updateOne', async () => ({ modifiedCount: 1 }));
  return (async () => {
    try {
      return await run();
    } finally {
      mock.restoreAll();
      mongoose.connection.getClient = getClient;
      mongoose.connection.readyState = readyState;
    }
  })();
}

const expiredOrder = (overrides = {}) => ({
  _id: 'order-1',
  orderNumber: 'MTA-2026-000001-111',
  status: 'pending',
  paymentStatus: 'pending_payment',
  stockReleasedAt: null,
  paymentExpiresAt: new Date(Date.now() - 60_000),
  stripePaymentIntentId: null,
  items: [{ productId: 'LOOK-06-VEST', size: 'M', quantity: 2 }],
  ...overrides
});

test('an expired unpaid order is cancelled and its stock released exactly once', async () => {
  await withFakeMongo(async () => {
    const writes = [];
    mock.method(Order, 'findOneAndUpdate', async (filter, update) => {
      writes.push({ filter, update });
      return { ...expiredOrder(), status: 'cancelled' };
    });

    const released = await sweeper.expireOrder(expiredOrder());
    assert.equal(released, true);
    assert.equal(writes.length, 1);

    const { filter, update } = writes[0];
    /* These conditions are the whole safety of it: an order that has since
       been paid, or whose stock somebody else already returned, matches
       nothing, so the same units can never be credited twice. */
    assert.deepEqual(filter.paymentStatus, { $in: ['unpaid', 'pending_payment', 'failed'] });
    assert.equal(filter.stockReleasedAt, null);
    assert.equal(update.$set.status, 'cancelled');
    assert.equal(update.$set.paymentStatus, 'expired');
    assert.equal(update.$set.paymentExpiresAt, null);
    assert.ok(update.$set.stockReleasedAt instanceof Date);
  });
});

test('an order claimed by someone else in the meantime releases nothing', async () => {
  await withFakeMongo(async () => {
    // A customer cancelling by hand at the same moment wins the conditional
    // update; this pass must then do nothing rather than credit the units again.
    mock.method(Order, 'findOneAndUpdate', async () => null);
    assert.equal(await sweeper.expireOrder(expiredOrder()), false);
  });
});

test('the sweep only looks at orders that still owe money and are past their deadline', async () => {
  await withFakeMongo(async () => {
    let seen = null;
    mock.method(Order, 'find', (filter) => {
      seen = filter;
      return { sort: () => ({ limit: () => ({ lean: async () => [] }) }) };
    });

    const now = new Date('2026-09-22T00:00:00Z');
    const result = await sweeper.sweepExpiredReservations({ now });

    assert.deepEqual(result, { scanned: 0, released: 0 });
    assert.deepEqual(seen.paymentStatus, { $in: ['unpaid', 'pending_payment', 'failed'] });
    assert.equal(seen.stockReleasedAt, null);
    /* Cash on delivery never gets a deadline, so `$ne: null` is what keeps it
       out of the sweep entirely. */
    assert.deepEqual(seen.paymentExpiresAt, { $ne: null, $lte: now });
  });
});

test('a sweep with the database down does nothing rather than throwing', async () => {
  const readyState = mongoose.connection.readyState;
  mongoose.connection.readyState = 0;
  try {
    assert.deepEqual(await sweeper.sweepExpiredReservations(), { scanned: 0, released: 0 });
  } finally {
    mongoose.connection.readyState = readyState;
  }
});

test('one order failing to expire does not stop the rest of the sweep', async () => {
  await withFakeMongo(async () => {
    const orders = [
      expiredOrder({ _id: 'a', orderNumber: 'MTA-A' }),
      expiredOrder({ _id: 'b', orderNumber: 'MTA-B' })
    ];
    mock.method(Order, 'find', () => ({
      sort: () => ({ limit: () => ({ lean: async () => orders }) })
    }));
    mock.method(Order, 'findOneAndUpdate', async (filter) => {
      if (filter._id === 'a') throw new Error('write conflict');
      return { ...orders[1], status: 'cancelled' };
    });

    const result = await sweeper.sweepExpiredReservations();
    assert.equal(result.scanned, 2);
    assert.equal(result.released, 1, 'the second order was still released');
  });
});
