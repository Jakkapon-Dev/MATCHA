import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import Order from '../models/Order.js';
import { stripe } from '../config/stripe.js';
import { usdToThb, usdToThbSatang } from '../config/currency.js';
import { ownsOrder } from './orderRoutes.js';
import { canAcceptPayment, isStripeMethod, paymentDeadlineFor } from '../config/paymentStates.js';

const router = express.Router();
const STRIPE_PAYMENT_METHODS = new Set(['visa', 'mastercard', 'qr']);

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'เริ่มชำระเงินถี่เกินไป กรุณารอสักครู่แล้วลองใหม่' }
});

function expectedPayment(order) {
  const isQr = order.paymentMethod === 'qr';
  return isQr
    ? { amount: usdToThbSatang(order.total), currency: 'thb', isQr }
    : { amount: Math.round(Number(order.total) * 100), currency: 'usd', isQr };
}

router.post('/create-intent', paymentLimiter, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ success: false, message: 'ยังไม่ได้ตั้งค่า Stripe บนเซิร์ฟเวอร์' });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'ฐานข้อมูลยังไม่พร้อม จึงยังเริ่มการชำระเงินไม่ได้' });
    }

    const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';
    if (!orderId || orderId.length > 100) {
      return res.status(400).json({ success: false, message: 'ไม่พบหมายเลขออเดอร์ที่ถูกต้อง' });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
    const order = await Order.findOne({
      $or: [{ orderNumber: orderId }, { orderId }, ...(isObjectId ? [{ _id: orderId }] : [])]
    });

    if (!order || !ownsOrder(req, order)) {
      return res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อที่ต้องการชำระเงิน' });
    }
    if (!STRIPE_PAYMENT_METHODS.has(order.paymentMethod)) {
      return res.status(400).json({ success: false, message: 'ออเดอร์นี้ไม่ได้เลือกวิธีชำระผ่าน Stripe' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(409).json({ success: false, message: 'ออเดอร์นี้ชำระเงินแล้ว' });
    }
    if (order.status === 'cancelled' && order.paymentStatus !== 'expired') {
      return res.status(409).json({ success: false, message: 'ออเดอร์นี้ถูกยกเลิกแล้ว' });
    }
    /* Past its deadline, or its goods already back on sale. Taking money here
       would sell stock another shopper may since have bought — and a stale
       browser tab still holding a client secret is exactly how that happens.

       Everything up to the deadline is fair game, including a retry after a
       decline or after the customer dismissed the QR: that is what the window
       is for. */
    if (!canAcceptPayment(order)) {
      return res.status(409).json({
        success: false,
        code: 'PAYMENT_WINDOW_CLOSED',
        message: 'ออเดอร์นี้หมดเวลาชำระเงินแล้ว กรุณาสั่งซื้อใหม่อีกครั้ง'
      });
    }

    const expected = expectedPayment(order);
    let intent = null;

    if (order.stripePaymentIntentId) {
      intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
      const reusable = !['succeeded', 'canceled'].includes(intent.status)
        && intent.amount === expected.amount
        && intent.currency === expected.currency;
      if (!reusable && !['succeeded', 'canceled'].includes(intent.status)) {
        await stripe.paymentIntents.cancel(intent.id);
      }
      if (!reusable) intent = null;
    }

    if (!intent) {
      const metadata = { orderId: String(order._id), orderNumber: order.orderNumber };
      intent = await stripe.paymentIntents.create(
        expected.isQr
          ? {
              amount: expected.amount,
              currency: expected.currency,
              payment_method_types: ['promptpay'],
              metadata: { ...metadata, usdTotal: String(order.total) }
            }
          : {
              amount: expected.amount,
              currency: expected.currency,
              payment_method_types: ['card'],
              metadata
            },
        { idempotencyKey: `order-${order._id}-${expected.amount}-${expected.currency}` }
      );
    }

    order.stripePaymentIntentId = intent.id;
    order.paymentAmount = expected.amount;
    order.paymentCurrency = expected.currency;
    order.paymentError = null;
    /* Back to waiting on the customer, whether this is the first attempt or a
       retry after a decline or a dismissed QR. */
    order.paymentStatus = 'pending_payment';
    /* Starting again restarts the clock. A customer who comes back to an
       order and tries a second card deserves the full window rather than
       whatever was left of the one they abandoned. */
    if (isStripeMethod(order.paymentMethod)) {
      order.paymentExpiresAt = paymentDeadlineFor(order.paymentMethod);
    }
    await order.save();

    return res.json({
      success: true,
      data: {
        clientSecret: intent.client_secret,
        // The browser shows a countdown from this and stops offering a retry
        // once it passes, rather than sending the customer into a 409.
        paymentExpiresAt: order.paymentExpiresAt,
        ...(expected.isQr ? { thbAmount: usdToThb(order.total) } : {})
      }
    });
  } catch (error) {
    console.error('Error creating Stripe PaymentIntent:', error);
    return res.status(500).json({ success: false, message: 'ไม่สามารถเริ่มการชำระเงินได้ กรุณาลองใหม่อีกครั้ง' });
  }
});

export { expectedPayment };
export default router;
