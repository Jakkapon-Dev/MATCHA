/* The payment lifecycle, and the stock an unfinished one is holding.
 *
 * An order takes its units off the shelf in the same transaction that writes
 * it, before Stripe has been asked for anything — the only way two shoppers
 * cannot both buy the last M. What that used to cost was every checkout that
 * never finished: a declined card, a closed tab, a PromptPay QR nobody
 * scanned all left an `unpaid` order holding real inventory with nothing
 * anywhere that would give it back, and `unpaid` could not be told apart from
 * a cash-on-delivery order awaiting its courier.
 *
 *   States      unpaid → (cod, terminal on delivery)
 *               pending_payment → paid                 webhook: succeeded
 *                               → failed               webhook: payment_failed
 *                               → pending_payment      retry within the window
 *                               → expired              deadline, or canceled
 *               failed          → pending_payment      retry within the window
 *                               → expired              deadline
 *               paid            → refunded             an administrator
 *
 * `paid` and `expired` never give stock back and never take it again
 * respectively; `expired` is the only state in which the units return.
 */

import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import * as sweeper from '../services/reservationSweeper.js';
import {
  PAYMENT_STATES,
  AWAITING_PAYMENT,
  PAYMENT_WINDOW_MS,
  canAcceptPayment,
  initialPaymentStatus,
  paymentDeadlineFor,
  isStripeMethod
} from '../config/paymentStates.js';

/* ------------------------------------------------------------------ *
 * The state machine itself
 * ------------------------------------------------------------------ */

test('a Stripe order opens owing money; cash on delivery opens with nothing to expire', () => {
  for (const method of ['visa', 'mastercard', 'qr']) {
    assert.equal(initialPaymentStatus(method), 'pending_payment');
    const deadline = paymentDeadlineFor(method, 1_000_000);
    assert.equal(deadline.getTime(), 1_000_000 + PAYMENT_WINDOW_MS);
  }
  for (const method of ['cod', 'demo']) {
    assert.equal(initialPaymentStatus(method), 'unpaid');
    // No deadline at all, which is what keeps COD out of the reconciler.
    assert.equal(paymentDeadlineFor(method), null);
  }
  assert.equal(isStripeMethod('cod'), false);
});

test('no order is ever born paid', () => {
  for (const method of ['visa', 'mastercard', 'qr', 'cod', 'demo']) {
    assert.notEqual(initialPaymentStatus(method), 'paid');
  }
});

test('the states that still hold unpaid stock are exactly the retryable ones', () => {
  assert.deepEqual([...AWAITING_PAYMENT], ['unpaid', 'pending_payment', 'failed']);
  for (const settled of ['paid', 'expired', 'refunded']) {
    assert.equal(AWAITING_PAYMENT.includes(settled), false, `${settled} is settled`);
    assert.equal(PAYMENT_STATES.includes(settled), true);
  }
});

test('a declined card may be retried, right up to the deadline', () => {
  const now = Date.now();
  const declined = {
    status: 'pending',
    paymentStatus: 'failed',
    stockReleasedAt: null,
    paymentExpiresAt: new Date(now + 60_000)
  };
  // The point of keeping the reservation: the customer reaches for a second
  // card and the garment is still theirs.
  assert.equal(canAcceptPayment(declined, now), true);

  // One second past the deadline it is not, even by a second.
  assert.equal(canAcceptPayment({ ...declined, paymentExpiresAt: new Date(now - 1) }, now), false);
});

test('an abandoned PromptPay QR stays payable until the window closes', () => {
  const now = Date.now();
  const abandoned = {
    status: 'pending',
    paymentStatus: 'pending_payment',
    stockReleasedAt: null,
    paymentExpiresAt: new Date(now + PAYMENT_WINDOW_MS / 2)
  };
  assert.equal(canAcceptPayment(abandoned, now), true);
});

test('an order whose stock has gone back can never be paid again', () => {
  const now = Date.now();
  /* The dangerous case: a browser tab left open with a live client secret,
     for an order whose units have since been sold to somebody else. */
  const released = {
    status: 'cancelled',
    paymentStatus: 'expired',
    stockReleasedAt: new Date(now - 1000),
    paymentExpiresAt: null
  };
  assert.equal(canAcceptPayment(released, now), false);
  // Even if only the release stamp is set and everything else still looks open.
  assert.equal(canAcceptPayment({
    status: 'pending', paymentStatus: 'pending_payment', stockReleasedAt: new Date(), paymentExpiresAt: null
  }, now), false);
});

test('a paid order is not payable again, and a cash order never expires', () => {
  const now = Date.now();
  assert.equal(canAcceptPayment({ status: 'pending', paymentStatus: 'paid', stockReleasedAt: null }, now), false);
  // COD: no deadline, so it stays payable however long it sits.
  assert.equal(canAcceptPayment({
    status: 'pending', paymentStatus: 'unpaid', stockReleasedAt: null, paymentExpiresAt: null
  }, now + 400 * PAYMENT_WINDOW_MS), true);
});

/* ------------------------------------------------------------------ *
 * Releasing the stock
 * ------------------------------------------------------------------ */

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
  const getClient = mongoose.connection.getClient;
  mongoose.connection.readyState = 1;
  mongoose.connection.getClient = fakeSessionClient;
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

/* A stand-in for the orders collection that enforces the one rule the real
   conditional update enforces: `stockReleasedAt` can only be stamped once. */
function oneShotCollection(order) {
  const row = { ...order };
  const claims = [];
  mock.method(Order, 'findOneAndUpdate', async (filter, update) => {
    claims.push(filter);
    const stillOwed = filter.paymentStatus?.$in?.includes(row.paymentStatus);
    const notYetReleased = filter.stockReleasedAt === null && row.stockReleasedAt === null;
    if (!stillOwed || !notYetReleased) return null;
    Object.assign(row, update.$set);
    return { ...row };
  });
  return { row, claims };
}

test('an expired order is marked expired and its stock returned', async () => {
  await withFakeMongo(async () => {
    const { row } = oneShotCollection(expiredOrder());
    assert.equal(await sweeper.expireOrder(expiredOrder()), true);
    assert.equal(row.status, 'cancelled');
    assert.equal(row.paymentStatus, 'expired');
    assert.equal(row.paymentExpiresAt, null);
    assert.ok(row.stockReleasedAt instanceof Date);
  });
});

test('a duplicate webhook cannot return the same units twice', async () => {
  await withFakeMongo(async () => {
    /* Stripe retries webhook deliveries. Two deliveries of the same
       payment_intent.canceled must not credit the bucket twice. */
    const { row } = oneShotCollection(expiredOrder());
    const first = await sweeper.expireOrder(expiredOrder());
    const second = await sweeper.expireOrder(expiredOrder());
    assert.equal(first, true);
    assert.equal(second, false, 'the second delivery released nothing');
    assert.equal(row.paymentStatus, 'expired');
  });
});

test('two expiries racing on the same order release it once', async () => {
  await withFakeMongo(async () => {
    const { row, claims } = oneShotCollection(expiredOrder());
    // The reconciler and a canceled-intent webhook arriving together.
    const results = await Promise.all([
      sweeper.expireOrder(expiredOrder()),
      sweeper.expireOrder(expiredOrder()),
      sweeper.expireOrder(expiredOrder())
    ]);
    assert.deepEqual(results.filter(Boolean).length, 1, 'exactly one release won');
    assert.equal(claims.length, 3, 'all three tried');
    assert.ok(row.stockReleasedAt instanceof Date);
  });
});

test('a paid order never has its stock returned', async () => {
  await withFakeMongo(async () => {
    /* The order was paid in the seconds between the sweep's query and its
       claim — the one interleaving that would be unrecoverable. */
    const { row } = oneShotCollection(expiredOrder({ paymentStatus: 'paid' }));
    assert.equal(await sweeper.expireOrder(expiredOrder()), false);
    assert.equal(row.paymentStatus, 'paid');
    assert.equal(row.stockReleasedAt, null);
  });
});

test('the reconciler asks Stripe first, and backs off when the money already moved', async () => {
  await withFakeMongo(async () => {
    const { row } = oneShotCollection(expiredOrder({ stripePaymentIntentId: 'pi_live' }));
    let cancelled = false;
    /* The customer paid in the seconds between the sweep's query and its
       claim. Stripe knows; we do not yet, because the webhook has not landed.
       Reclaiming here would put sold goods back on the shelf. */
    const gateway = {
      paymentIntents: {
        retrieve: async () => ({ id: 'pi_live', status: 'succeeded' }),
        cancel: async () => { cancelled = true; }
      }
    };

    assert.equal(await sweeper.expireOrder(expiredOrder({ stripePaymentIntentId: 'pi_live' }), { gateway }), false);
    assert.equal(cancelled, false, 'a succeeded intent is never cancelled');
    assert.equal(row.stockReleasedAt, null, 'and its stock stays sold');
  });
});

test('an intent still awaiting the customer is cancelled before the stock goes back', async () => {
  await withFakeMongo(async () => {
    const { row } = oneShotCollection(expiredOrder({ stripePaymentIntentId: 'pi_open' }));
    const cancels = [];
    const gateway = {
      paymentIntents: {
        retrieve: async () => ({ id: 'pi_open', status: 'requires_payment_method' }),
        cancel: async (id) => { cancels.push(id); }
      }
    };

    assert.equal(await sweeper.expireOrder(expiredOrder({ stripePaymentIntentId: 'pi_open' }), { gateway }), true);
    /* Cancelling at Stripe is what stops a customer paying for an order whose
       goods have just gone back on sale. */
    assert.deepEqual(cancels, ['pi_open']);
    assert.equal(row.paymentStatus, 'expired');
  });
});

test('an intent in flight is left alone rather than guessed at', async () => {
  await withFakeMongo(async () => {
    oneShotCollection(expiredOrder({ stripePaymentIntentId: 'pi_processing' }));
    const gateway = {
      paymentIntents: {
        retrieve: async () => ({ id: 'pi_processing', status: 'processing' }),
        cancel: async () => { throw new Error('must not be called'); }
      }
    };
    assert.equal(await sweeper.expireOrder(expiredOrder({ stripePaymentIntentId: 'pi_processing' }), { gateway }), false);
  });
});

test('a gateway that cannot be reached blocks the release rather than risking it', async () => {
  await withFakeMongo(async () => {
    const { row } = oneShotCollection(expiredOrder({ stripePaymentIntentId: 'pi_unknown' }));
    const gateway = {
      paymentIntents: {
        retrieve: async () => { throw new Error('connection reset'); },
        cancel: async () => {}
      }
    };
    // Not knowing whether the money moved is not a reason to assume it did not.
    assert.equal(await sweeper.expireOrder(expiredOrder({ stripePaymentIntentId: 'pi_unknown' }), { gateway }), false);
    assert.equal(row.stockReleasedAt, null);
  });
});

test('cash on delivery is never swept', async () => {
  await withFakeMongo(async () => {
    let queried = null;
    mock.method(Order, 'find', (filter) => {
      queried = filter;
      return { sort: () => ({ limit: () => ({ lean: async () => [] }) }) };
    });
    await sweeper.sweepExpiredReservations({ now: new Date() });
    // A COD order has paymentExpiresAt null, and this clause excludes it.
    assert.deepEqual(queried.paymentExpiresAt.$ne, null);
    assert.equal(canAcceptPayment({
      status: 'pending', paymentStatus: 'unpaid', stockReleasedAt: null, paymentExpiresAt: null
    }), true);
  });
});

test('payment work never falls back to memory when the database is down', async () => {
  const readyState = mongoose.connection.readyState;
  mongoose.connection.readyState = 0;
  try {
    let queried = false;
    mock.method(Order, 'find', () => { queried = true; return { sort: () => ({ limit: () => ({ lean: async () => [] }) }) }; });
    const result = await sweeper.sweepExpiredReservations();
    assert.deepEqual(result, { scanned: 0, released: 0 });
    assert.equal(queried, false, 'nothing was read, and nothing was invented');
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = readyState;
  }
});
