/* The payment lifecycle of an order, in one place.
 *
 * An order takes its stock off the shelf in the same transaction that writes
 * it, before Stripe has been asked for anything. That ordering is deliberate
 * and is kept: it is the only way two shoppers cannot both buy the last M.
 * What it costs is that an order which never completes is holding real
 * inventory, so every such order needs a state that says so and a deadline
 * after which the goods go back.
 *
 * There used to be three states — unpaid, paid, refunded — and a checkout
 * that failed stayed `unpaid` forever, indistinguishable from a cash-on-
 * delivery order that simply had not been delivered yet. Nothing could tell
 * the two apart, so nothing could safely reclaim the stock from either.
 *
 *   unpaid           no online payment step: cash on delivery. Nothing is
 *                    owed to a gateway, nothing expires, the courier
 *                    collects. Also the state of legacy orders written
 *                    before this lifecycle existed.
 *
 *   pending_payment  a Stripe order that has been created and is waiting on
 *                    the customer: entering a card, scanning a QR. Holds
 *                    stock, carries a deadline.
 *
 *   failed           Stripe told us the attempt did not go through. Still
 *                    holds its stock and its deadline, because the common
 *                    next move is another card or another scan, and taking
 *                    the goods away mid-checkout turns a retry into an
 *                    out-of-stock.
 *
 *   paid             the webhook confirmed it, server to server. The only
 *                    state in which money is real, and the only one from
 *                    which stock is never returned.
 *
 *   expired          the deadline passed with nothing paid. The order is
 *                    cancelled and its stock has gone back on sale.
 *                    Terminal: a customer who still wants the garment
 *                    places a new order.
 *
 *   refunded         paid, then given back. An administrator's decision.
 */

export const PAYMENT_STATES = Object.freeze([
  'unpaid',
  'pending_payment',
  'paid',
  'failed',
  'expired',
  'refunded'
]);

/* The states in which an order is still holding stock it has not paid for.
   This is what the reconciler looks for and what every "may this order still
   be paid?" question reduces to. `paid`, `refunded` and `expired` are all
   settled, each in their own way. */
export const AWAITING_PAYMENT = Object.freeze(['unpaid', 'pending_payment', 'failed']);

// The payment methods that go through Stripe and can therefore be abandoned.
export const RESERVED_PAYMENT_METHODS = new Set(['visa', 'mastercard', 'qr']);

/* How long an order may hold stock while its payment is outstanding.

   Long enough for a customer to find their card, open their banking app and
   scan a PromptPay code — including one failed attempt and a retry — and
   short enough that an abandoned checkout does not keep the last M off sale
   for the rest of the day. */
export const PAYMENT_WINDOW_MS = Math.max(
  60 * 1000,
  (Number(process.env.ORDER_RESERVATION_MINUTES) || 30) * 60 * 1000
);

export const isStripeMethod = (method) => RESERVED_PAYMENT_METHODS.has(method);

export const paymentDeadlineFor = (method, from = Date.now()) => (
  isStripeMethod(method) ? new Date(from + PAYMENT_WINDOW_MS) : null
);

export const initialPaymentStatus = (method) => (
  isStripeMethod(method) ? 'pending_payment' : 'unpaid'
);

/* Whether this order can still be paid.

   Deliberately not just "is it pending": an order whose stock has already
   gone back must refuse payment even if a stale browser tab still has a
   client secret, because the units it was holding may since have been sold
   to somebody else. */
export function canAcceptPayment(order, now = Date.now()) {
  if (!order) return false;
  if (order.status === 'cancelled') return false;
  if (order.stockReleasedAt) return false;
  if (!AWAITING_PAYMENT.includes(order.paymentStatus)) return false;
  if (order.paymentExpiresAt && new Date(order.paymentExpiresAt).getTime() <= now) return false;
  return true;
}

export default {
  PAYMENT_STATES,
  AWAITING_PAYMENT,
  RESERVED_PAYMENT_METHODS,
  PAYMENT_WINDOW_MS,
  isStripeMethod,
  paymentDeadlineFor,
  initialPaymentStatus,
  canAcceptPayment
};
