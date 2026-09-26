import test from 'node:test';
import assert from 'node:assert/strict';

import { expectedPayment } from '../routes/paymentRoutes.js';
import { matchesPersistedPayment } from '../routes/stripeWebhook.js';
import { ownsOrder } from '../services/orderAccess.js';

test('card and PromptPay amounts are computed in Stripe minor units', () => {
  assert.deepEqual(expectedPayment({ paymentMethod: 'visa', total: 12.34 }), {
    amount: 1234,
    currency: 'usd',
    isQr: false
  });
  assert.deepEqual(expectedPayment({ paymentMethod: 'qr', total: 10 }), {
    amount: 36000,
    currency: 'thb',
    isQr: true
  });
});

test('a guest cannot pay an order belonging to another browser', () => {
  const order = { guestId: 'guest-owner', customer: { email: 'guest@example.com' } };
  assert.equal(ownsOrder({ headers: { 'x-guest-id': 'guest-owner' } }, order), true);
  assert.equal(ownsOrder({ headers: { 'x-guest-id': 'guest-attacker' } }, order), false);
  assert.equal(ownsOrder({ headers: {} }, order), false);
});

test('webhook settlement requires the persisted amount, currency and metadata', () => {
  const order = {
    _id: '507f1f77bcf86cd799439011',
    orderNumber: 'MTA-2026-123456-789',
    stripePaymentIntentId: 'pi_test',
    paymentAmount: 1234,
    paymentCurrency: 'usd'
  };
  const intent = {
    id: 'pi_test',
    amount: 1234,
    currency: 'usd',
    metadata: { orderId: String(order._id), orderNumber: order.orderNumber }
  };

  assert.equal(matchesPersistedPayment(order, intent), true);
  assert.equal(matchesPersistedPayment(order, { ...intent, amount: 999 }), false);
  assert.equal(matchesPersistedPayment(order, { ...intent, currency: 'thb' }), false);
  assert.equal(matchesPersistedPayment(order, { ...intent, metadata: { ...intent.metadata, orderNumber: 'other' } }), false);
});
