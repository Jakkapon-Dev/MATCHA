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
    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
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

      if (event.type === 'payment_intent.succeeded' && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.paymentError = null;
        await order.save();
      }
      if (event.type === 'payment_intent.payment_failed' && order.paymentStatus !== 'paid') {
        order.paymentError = intent.last_payment_error?.message || 'Payment failed';
        await order.save();
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
