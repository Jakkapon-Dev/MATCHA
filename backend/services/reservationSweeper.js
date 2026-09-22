/* Give back the stock that abandoned checkouts are holding.
 *
 * Placing an order takes its units off the shelf inside the same transaction
 * that writes the order, before Stripe has been asked for anything. That
 * ordering is what stops two shoppers buying the last M, and it is worth
 * keeping — but on its own it means every checkout that never finishes leaves
 * an `unpaid` order sitting on real inventory: a declined card, a closed tab,
 * a PromptPay QR nobody scans. Nothing released those units, ever.
 *
 * Every order with an online payment step is written with a
 * `reservationExpiresAt`. This worker finds the ones that have passed it and
 * are still pending and unpaid, cancels them and puts the stock back.
 *
 * Two things make it safe to run against live payments:
 *
 *   - Stripe is asked to cancel the PaymentIntent first. If the customer paid
 *     in the seconds before the sweep, that call fails and the order is left
 *     alone for the webhook to mark paid. Cancelling the intent also means a
 *     customer cannot pay for an order whose goods have just gone back.
 *   - The order is moved out of `pending` by a conditional update inside the
 *     same transaction as the release, so a customer cancelling by hand at the
 *     same moment cannot make the units come back twice.
 */

import mongoose from 'mongoose';

import Order from '../models/Order.js';
import { stripe } from '../config/stripe.js';
import { releaseStock } from '../routes/orderRoutes.js';

let sweepTimer = null;

async function cancelIntentIfAny(order) {
  if (!order.stripePaymentIntentId || !stripe) return true;
  try {
    const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (intent.status === 'succeeded' || intent.status === 'processing') {
      // The money is in flight or already taken. Not ours to reclaim — the
      // webhook will mark this order paid.
      return false;
    }
    if (intent.status !== 'canceled') {
      await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
    }
    return true;
  } catch (err) {
    console.warn(`[reservations] could not cancel PaymentIntent for ${order.orderNumber}: ${err.message}`);
    return false;
  }
}

/* Release one expired order. Returns true if its stock went back. */
export async function expireOrder(order) {
  if (!(await cancelIntentIfAny(order))) return false;

  const session = await mongoose.connection.getClient().startSession();
  try {
    let released = false;
    await session.withTransaction(async () => {
      /* The conditions are the whole safety of this: an order that has since
         been paid, cancelled or already released matches nothing, and the
         transaction does nothing rather than crediting the units twice. */
      const claimed = await Order.findOneAndUpdate(
        {
          _id: order._id,
          status: 'pending',
          paymentStatus: 'unpaid',
          reservationReleasedAt: null
        },
        {
          $set: {
            status: 'cancelled',
            reservationExpiresAt: null,
            reservationReleasedAt: new Date(),
            paymentError: order.paymentError || 'Payment was not completed in time; the order expired'
          }
        },
        { new: true, session }
      );
      if (!claimed) return;
      await releaseStock(order.items, session);
      released = true;
    });
    return released;
  } finally {
    await session.endSession();
  }
}

/* One pass. Exported so tests can drive it without waiting on a timer. */
export async function sweepExpiredReservations({ now = new Date(), limit = 50 } = {}) {
  if (mongoose.connection.readyState !== 1) return { scanned: 0, released: 0 };

  const expired = await Order.find({
    status: 'pending',
    paymentStatus: 'unpaid',
    reservationReleasedAt: null,
    reservationExpiresAt: { $ne: null, $lte: now }
  })
    .sort({ reservationExpiresAt: 1 })
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
