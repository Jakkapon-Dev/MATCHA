/* Give back the stock that unfinished checkouts are holding.
 *
 * Placing an order takes its units off the shelf inside the same transaction
 * that writes the order, before Stripe has been asked for anything. That
 * ordering is what stops two shoppers buying the last M, and it is worth
 * keeping — but on its own it means every checkout that never finishes leaves
 * an order sitting on real inventory: a declined card, a closed tab, a
 * PromptPay QR nobody scans. Nothing released those units, ever.
 *
 * Every order with an online payment step is written with a
 * `paymentExpiresAt`. This worker finds the ones that have passed it while
 * still owing money, marks them `expired`, cancels them and puts the stock
 * back. It is also the reconciliation path for anything the webhooks missed:
 * a `succeeded` that never arrived leaves an order that this eventually
 * expires, and Stripe is asked before that happens so the money is never in
 * doubt.
 *
 * Three things make it safe to run against live payments:
 *
 *   - Stripe is asked to cancel the PaymentIntent first. If the customer paid
 *     in the seconds before the sweep, that call fails and the order is left
 *     alone for the webhook to mark paid. Cancelling the intent also means a
 *     customer cannot pay for an order whose goods have just gone back.
 *   - The release is claimed by a conditional update requiring
 *     `stockReleasedAt: null`, inside the same transaction that returns the
 *     units. A duplicate webhook, a retried job, a second worker and a
 *     customer pressing cancel all race for that one stamp, and only one can
 *     win — so the same units can never be credited twice.
 *   - A paid order is excluded by the query and by the claim, so stock that
 *     has been bought is never returned.
 */

import mongoose from 'mongoose';

import Order from '../models/Order.js';
import { stripe } from '../config/stripe.js';
import { releaseStock } from '../routes/orderRoutes.js';
import { releaseCoupon } from './coupons.js';
import { AWAITING_PAYMENT } from '../config/paymentStates.js';

let sweepTimer = null;

/* Everything still holding stock it has not paid for, past its deadline.
   Cash on delivery has no deadline, so it is never matched. */
export const expiredReservationFilter = (now) => ({
  paymentStatus: { $in: AWAITING_PAYMENT },
  stockReleasedAt: null,
  paymentExpiresAt: { $ne: null, $lte: now }
});

/* The gateway is a parameter so this can be exercised without a live Stripe
   account, and so a test can put a succeeded intent in front of it. */
export async function cancelIntentIfAny(order, gateway = stripe) {
  if (!order.stripePaymentIntentId || !gateway) return true;
  try {
    const intent = await gateway.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (intent.status === 'succeeded' || intent.status === 'processing') {
      // The money is in flight or already taken. Not ours to reclaim — the
      // webhook will mark this order paid.
      return false;
    }
    if (intent.status !== 'canceled') {
      await gateway.paymentIntents.cancel(order.stripePaymentIntentId);
    }
    return true;
  } catch (err) {
    console.warn(`[reservations] could not cancel PaymentIntent for ${order.orderNumber}: ${err.message}`);
    return false;
  }
}

/* Release one order's stock and mark it expired.
 *
 * Returns true only if this call is the one that did it. Called by the sweep
 * below and by the `payment_intent.canceled` webhook, which is why it has to
 * be safe to call concurrently with itself.
 */
export async function expireOrder(order, { gateway = stripe } = {}) {
  if (!(await cancelIntentIfAny(order, gateway))) return false;

  const session = await mongoose.connection.getClient().startSession();
  try {
    let released = false;
    await session.withTransaction(async () => {
      /* The conditions are the whole safety of this. An order that has since
         been paid, or whose stock somebody else already returned, matches
         nothing — and the transaction does nothing rather than crediting the
         units a second time. */
      const claimed = await Order.findOneAndUpdate(
        {
          _id: order._id,
          paymentStatus: { $in: AWAITING_PAYMENT },
          stockReleasedAt: null
        },
        {
          $set: {
            status: 'cancelled',
            paymentStatus: 'expired',
            paymentExpiresAt: null,
            stockReleasedAt: new Date(),
            paymentError: order.paymentError || 'Payment was not completed in time; the order expired'
          }
        },
        { new: true, session }
      );
      if (!claimed) return;
      await releaseStock(order.items, session);
      await releaseCoupon(order, { session });
      released = true;
    });
    return released;
  } finally {
    await session.endSession();
  }
}

/* One pass. Exported so tests and an operator can drive it without waiting on
   a timer. */
export async function sweepExpiredReservations({ now = new Date(), limit = 50 } = {}) {
  /* No memory fallback here, deliberately. Everywhere else in this codebase a
     database that is down degrades to something; stock and money may not.
     The pass simply does not run, and runs again in a minute. */
  if (mongoose.connection.readyState !== 1) return { scanned: 0, released: 0 };

  const expired = await Order.find(expiredReservationFilter(now))
    .sort({ paymentExpiresAt: 1 })
    .limit(limit)
    .lean();

  let released = 0;
  for (const order of expired) {
    try {
      if (await expireOrder(order)) {
        released += 1;
        console.warn(`[reservations] released stock held by expired order ${order.orderNumber}`);
      }
    } catch (err) {
      console.error(`[reservations] failed to expire ${order.orderNumber}: ${err.message}`);
    }
  }

  return { scanned: expired.length, released };
}

export function startReservationSweeper(intervalMs = 60000) {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => {
    sweepExpiredReservations().catch(err => {
      console.warn(`[reservations] sweep cycle failed: ${err.message}`);
    });
  }, intervalMs);
  // The timer must never be the reason the process stays alive.
  sweepTimer.unref?.();
}

export function stopReservationSweeper() {
  if (sweepTimer) {
    clearInterval(sweepTimer);
    sweepTimer = null;
  }
}
