/* Orders that never reach Stripe must not collide with each other.
 *
 * `stripePaymentIntentId` carries a unique sparse index. A sparse index skips
 * documents that do not have the field — but it still indexes an explicit
 * null, and the schema used to default the field to null. So the first order
 * without a PaymentIntent (cash on delivery, or a card checkout abandoned
 * before the intent was created) stored null, and every later one failed with
 * E11000 and a 500. */
import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns';
import mongoose from 'mongoose';
import express from 'express';

import { isDatabaseNameSafe, isHostnameSafe, parseMongoDatabaseName, parseMongoHostname } from '../services/mongoSafetyGuard.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);
process.env.NODE_ENV = 'test';

const testUri = process.env.TEST_MONGODB_URI || '';
const targetIsSafe = Boolean(testUri)
  && isDatabaseNameSafe(parseMongoDatabaseName(testUri)).safe
  && isHostnameSafe(parseMongoHostname(testUri)).safe;
async function canReachTestDatabase() {
  if (!targetIsSafe) return false;
  try {
    await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5_000 });
    return true;
  } catch {
    await mongoose.disconnect().catch(() => {});
    return false;
  }
}
const databaseAvailable = await canReachTestDatabase();
const dbDescribe = databaseAvailable ? describe : describe.skip;

const orderRoutes = (await import('../routes/orderRoutes.js')).default;
const Order = (await import('../models/Order.js')).default;
const Product = (await import('../models/Product.js')).default;

const TAG = `intent-${process.pid}-${Date.now().toString(36)}`;
const SKU = TAG.toUpperCase();
let server;
let base;

dbDescribe('orders without a PaymentIntent (MongoDB)', () => {
  before(async () => {
    await Order.syncIndexes();
    await Product.create({ id: SKU, sku: SKU, name: 'Intent test garment', description: 'Intent index test garment.', price: 30, image: '/images/p.jpg', category: 'Tops', color: 'Black', sizes: ['M'], sizeStock: [{ size: 'M', stock: 20 }] });
    const app = express();
    app.use(express.json());
    app.use('/api/orders', orderRoutes);
    await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${server.address().port}/api/orders`;
  });

  after(async () => {
    server?.close();
    await Order.deleteMany({ 'customer.email': { $regex: `^${TAG}` } });
    await Product.deleteOne({ id: SKU });
    await mongoose.disconnect();
  });

  it('several cash-on-delivery and card orders in a row are all accepted', async () => {
    for (const [n, paymentMethod] of ['cod', 'cod', 'visa', 'qr'].entries()) {
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { firstName: 'Intent', lastName: 'Test', email: `${TAG}-${n}@matcha-test.internal`, phone: '0899999999', address: '1 Road', city: 'Bangkok', zipCode: '10110' },
          items: [{ productId: SKU, quantity: 1, size: 'M' }],
          paymentMethod,
          shippingOption: 'standard'
        })
      });
      assert.equal(res.status, 201, `order ${n + 1} (${paymentMethod}) was refused: ${await res.text()}`);
    }
    const stored = await Order.find({ 'customer.email': { $regex: `^${TAG}` } }).lean();
    assert.equal(stored.length, 4);
    assert.ok(stored.every(o => !('stripePaymentIntentId' in o)), 'no order stores a null intent id');
  });
});
