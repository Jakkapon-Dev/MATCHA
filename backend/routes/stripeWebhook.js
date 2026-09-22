import express from 'express';
import mongoose from 'mongoose';

import Order from '../models/Order.js';
import { stripe } from '../config/stripe.js';

const router = express.Router();

function matchesPersistedPayment(order, intent) {
  return Boolean(
    order
    && order.stripePaymentIntentId === intent.id
    && Number.isInteger(order.paymentAmount)
    && order.paymentAmount === intent.amount
    && order.paymentCurrency === intent.currency
    && String(intent.metadata?.orderId || '') === String(order._id)
    && intent.metadata?.orderNumber === order.orderNumber
  );
}

router.post('/', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return res.status(503).send('Stripe is not configured on this server');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error.message);
    return res.status(400).send('Invalid webhook signature');
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ received: false });
  }

  try {
    if (
      event.type === 'payment_intent.succeeded'
      || event.type === 'payment_intent.payment_failed'
      || event.type === 'payment_intent.canceled'
    ) {
      const intent = event.data.object;
      const order = await Order.findOne({ stripePaymentIntentId: intent.id });

      if (!order) {
        console.warn(`[stripe] No order found for PaymentIntent ${intent.id}`);
        return res.json({ received: true });
      }
      if (!matchesPersistedPayment(order, intent)) {
        console.error(`[stripe] Refusing mismatched payment for order ${order.orderNumber}`);
        return res.status(409).json({ received: false });
      }

      /* Stripe is the only thing in this codebase allowed to make an order
         paid, and only through this signed, server-to-server event. The
         browser's own confirmation is not evidence: it can be closed, faked
         or simply wrong about what the gateway did.

         Each branch is guarded on the current state rather than assuming
         one, because Stripe retries webhooks and can deliver them out of
         order. A duplicate `succeeded` finds the order already paid and does
         nothing; a `payment_failed` arriving after a successful retry cannot
         drag a paid order backwards. */
      if (order.paymentStatus === 'paid') {
        return res.json({ received: true });
      }

      if (event.type === 'payment_intent.succeeded') {
        order.paymentStatus = 'paid';
        order.paymentError = null;
        /* A paid order holds its stock for good — there is nothing left to
           abandon, so the reconciler must stop looking at this one. */
        order.paymentExpiresAt = null;
        await order.save();
      }

      if (event.type === 'payment_intent.payment_failed') {
        order.paymentStatus = 'failed';
        order.paymentError = intent.last_payment_error?.message || 'Payment failed';
        /* The stock stays held: a declined card is very often retried on the
           spot with another one, and taking the goods away mid-checkout would
           turn a retry into an out-of-stock. The deadline already on the order
           is what eventually gives them back. */
        await order.save();
      }

      /* An intent that Stripe or this server cancelled is a checkout that
         will not finish. Waiting out the rest of the window would keep real
         inventory off sale for no reason, so the goods go back now — through
         the same conditional release the reconciler uses, so a duplicate
         delivery of this event cannot return the units twice. */
      if (event.type === 'payment_intent.canceled') {
        const { expireOrder } = await import('../services/reservationSweeper.js');
        await expireOrder(order.toObject()).catch(error => {
          console.error(`[stripe] could not release stock for cancelled intent ${intent.id}: ${error.message}`);
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Error handling Stripe webhook event:', error);
    return res.status(500).json({ received: false });
  }
});

export { matchesPersistedPayment };
export default router;
