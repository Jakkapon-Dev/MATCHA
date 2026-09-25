/* Coupons are decided by the server.
 *
 * The rules are unit-tested as a pure function first. The rest runs against
 * the real test database through the real order, coupon and auth routes:
 * checkout sends a code and nothing else, the server prices it, the order
 * keeps a snapshot, the Stripe amount follows the server's total, the last
 * use of a coupon cannot be taken twice by concurrent checkouts, and only an
 * administrator can manage coupons. */
import 'dotenv/config';
import { describe, it, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';

import { isDatabaseNameSafe, isHostnameSafe, parseMongoDatabaseName, parseMongoHostname } from '../services/mongoSafetyGuard.js';
import { evaluateCoupon, couponUserKey } from '../services/coupons.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);
process.env.NODE_ENV = 'test';

const at = (iso) => new Date(iso);
const coupon = (overrides = {}) => ({
  _id: 'x', code: 'TEST', type: 'percentage', value: 10, minOrderAmount: 0, maxDiscountAmount: null,
  startsAt: null, expiresAt: null, usageLimit: null, usedCount: 0, perUserLimit: null, active: true,
  applicableProducts: [], applicableCategories: [], ...overrides
});
const lines = [
  { productId: 'TOP-1', sku: 'TOP-1', category: 'Tops', lineTotal: 100 },
  { productId: 'PANT-1', sku: 'PANT-1', category: 'Bottoms', lineTotal: 50 }
];
const rejects = (c, code, extra = {}) => assert.throws(() => evaluateCoupon(c, { lines, subtotal: 150, ...extra }), e => e.code === code);

describe('coupon rules (pure)', () => {
  test('percentage and fixed amount', () => {
    assert.equal(evaluateCoupon(coupon(), { lines, subtotal: 150 }).discountAmount, 15);
    assert.equal(evaluateCoupon(coupon({ type: 'fixed_amount', value: 20 }), { lines, subtotal: 150 }).discountAmount, 20);
  });
  test('a fixed amount never exceeds what it applies to', () => {
    assert.equal(evaluateCoupon(coupon({ type: 'fixed_amount', value: 80, applicableCategories: ['Bottoms'] }), { lines, subtotal: 150 }).discountAmount, 50);
  });
  test('maximum discount caps a percentage', () => {
    assert.equal(evaluateCoupon(coupon({ value: 50, maxDiscountAmount: 30 }), { lines, subtotal: 150 }).discountAmount, 30);
  });
  test('free shipping carries no discount amount', () => {
    assert.deepEqual(evaluateCoupon(coupon({ type: 'free_shipping', value: 0 }), { lines, subtotal: 150 }), { discountAmount: 0, freeShipping: true, eligibleSubtotal: 150 });
  });
  test('unknown, inactive, not started, expired', () => {
    rejects(null, 'COUPON_INVALID');
    rejects(coupon({ active: false }), 'COUPON_INACTIVE');
    rejects(coupon({ startsAt: at('2030-01-01') }), 'COUPON_NOT_STARTED', { now: at('2029-12-31') });
    rejects(coupon({ expiresAt: at('2026-01-01') }), 'COUPON_EXPIRED', { now: at('2026-01-01') });
  });
  test('minimum order, usage limit, per-user limit', () => {
    rejects(coupon({ minOrderAmount: 150.01 }), 'COUPON_MIN_ORDER');
    rejects(coupon({ usageLimit: 3, usedCount: 3 }), 'COUPON_EXHAUSTED');
    rejects(coupon({ perUserLimit: 1 }), 'COUPON_USER_LIMIT', { userRedemptions: 1 });
  });
  test('product and category restrictions', () => {
    assert.equal(evaluateCoupon(coupon({ applicableProducts: ['PANT-1'] }), { lines, subtotal: 150 }).discountAmount, 5);
    assert.equal(evaluateCoupon(coupon({ applicableCategories: ['Tops'] }), { lines, subtotal: 150 }).discountAmount, 10);
    rejects(coupon({ applicableCategories: ['Shoes'] }), 'COUPON_NOT_APPLICABLE');
  });
  test('a guest is counted by a hash of their email, never the address itself', () => {
    const key = couponUserKey({ email: ' Shopper@Example.com ' });
    assert.match(key, /^email:[a-f0-9]{64}$/);
    assert.equal(key, couponUserKey({ email: 'shopper@example.com' }));
    assert.equal(couponUserKey({ userId: 'u_1', email: 'a@b.c' }), 'user:u_1');
  });
});

/* ------------------------------------------------------------ database */

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
const couponRoutes = (await import('../routes/couponRoutes.js')).default;
const { expectedPayment } = await import('../routes/paymentRoutes.js');
const Order = (await import('../models/Order.js')).default;
const Product = (await import('../models/Product.js')).default;
const Coupon = (await import('../models/Coupon.js')).default;
const CouponRedemption = (await import('../models/CouponRedemption.js')).default;
const { createUser, User } = await import('../services/userStore.js');
const { getJwtSecret } = await import('../middleware/auth.js');

const TAG = `C${process.pid.toString(36)}${Date.now().toString(36).slice(-5)}`.toUpperCase();
const TOP = `${TAG}-TOP`;
const PANT = `${TAG}-PANT`;
const EMAIL_DOMAIN = `${TAG.toLowerCase()}.matcha-test.internal`;
let codeSeq = 0;
const nextCode = (label = 'X') => `${TAG}${label}${(codeSeq += 1)}`.slice(0, 30);

let server;
let base;
let admin;
let member1;
let member2;
const userIds = [];

async function makeUser(role, name) {
  const user = await createUser({ name, email: `${name}@${EMAIL_DOMAIN}`, passwordHash: crypto.randomBytes(16).toString('hex'), role, emailVerified: true });
  userIds.push(user._id);
  return { id: user._id, email: user.email, headers: { Authorization: `Bearer ${jwt.sign({ id: user._id, role, email: user.email, emailVerified: true }, getJwtSecret())}` } };
}

const call = (method, path, headers = {}, body) => fetch(`${base}${path}`, {
  method,
  headers: { 'Content-Type': 'application/json', ...headers },
  ...(body ? { body: JSON.stringify(body) } : {})
});

const cart = (...ids) => ids.map(productId => ({ productId, quantity: 1, size: 'M' }));
const checkout = ({ couponCode, items = cart(TOP, PANT), headers = {}, email = `guest-${crypto.randomUUID().slice(0, 8)}@${EMAIL_DOMAIN}`, extra = {} } = {}) => call('POST', '/api/orders', headers, {
  customer: { firstName: 'Coupon', lastName: 'Tester', email, phone: '0899999999', address: '1 Test Road', city: 'Bangkok', zipCode: '10110' },
  items,
  couponCode,
  paymentMethod: 'visa',
  shippingOption: 'standard',
  ...extra
});
const makeCoupon = (overrides = {}) => Coupon.create({ code: nextCode(), type: 'percentage', value: 10, ...overrides });
const expectCouponError = async (res, status, code) => {
  const body = await res.json();
  assert.equal(res.status, status, JSON.stringify(body));
  assert.equal(body.code, code);
  return body;
};

dbDescribe('coupons (MongoDB)', () => {
  before(async () => {
    const product = (id, name, category, price) => ({
      id, sku: id, name, description: 'Coupon test garment.', price, image: '/images/p.jpg', category, color: 'Black',
      sizes: ['M'], sizeStock: [{ size: 'M', stock: 500 }]
    });
    await Product.create([product(TOP, 'Coupon Top', 'Tops', 100), product(PANT, 'Coupon Trouser', 'Bottoms', 50)]);
    admin = await makeUser('Admin', 'admin');
    member1 = await makeUser('Member', 'member1');
    member2 = await makeUser('Member', 'member2');
    const app = express();
    app.use(express.json());
    app.use('/api/orders', orderRoutes);
    app.use('/api', couponRoutes);
    await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    server?.close();
    const coupons = await Coupon.find({ code: { $regex: `^${TAG}` } }, '_id').lean();
    await CouponRedemption.deleteMany({ couponId: { $in: coupons.map(c => c._id) } });
    await Coupon.deleteMany({ code: { $regex: `^${TAG}` } });
    await Order.deleteMany({ 'customer.email': { $regex: `@${EMAIL_DOMAIN.replace(/\./g, '\\.')}$` } });
    await Product.deleteMany({ id: { $in: [TOP, PANT] } });
    await User.deleteMany({ _id: { $in: userIds } });
    await mongoose.disconnect();
  });

  it('checkout without a coupon is unchanged', async () => {
    const res = await checkout();
    assert.equal(res.status, 201);
    const { data } = await res.json();
    assert.equal(data.subtotal, 150);
    assert.equal(data.discount, 0);
    assert.equal(data.total, 150);
    assert.equal(data.couponCode, null);
    assert.equal(data.coupon, null);
  });

  it('a valid percentage coupon is priced by the server and snapshotted on the order', async () => {
    const c = await makeCoupon({ value: 10 });
    const res = await checkout({ couponCode: ` ${c.code.toLowerCase()} ` });
    assert.equal(res.status, 201);
    const { data } = await res.json();
    assert.equal(data.discount, 15);
    assert.equal(data.total, 135);
    assert.equal(data.couponCode, c.code);
    assert.equal(data.coupon.code, c.code);
    assert.equal(data.coupon.type, 'percentage');
    assert.equal(data.coupon.value, 10);
    assert.equal(data.coupon.discountAmount, 15);
    assert.equal(String(data.coupon.couponId), String(c._id));
    assert.equal((await Coupon.findById(c._id).lean()).usedCount, 1);
  });

  it('the Stripe amount is the server total after the coupon', async () => {
    const c = await makeCoupon({ type: 'fixed_amount', value: 20 });
    const res = await checkout({ couponCode: c.code });
    const { data } = await res.json();
    assert.equal(data.total, 130);
    const stored = await Order.findById(data._id).lean();
    assert.deepEqual(expectedPayment(stored), { amount: 13000, currency: 'usd', isQr: false });
  });

  it('amounts and totals sent by the browser are ignored', async () => {
    const c = await makeCoupon({ value: 10 });
    const res = await checkout({
      couponCode: c.code,
      extra: { discount: 149, discountAmount: 149, discountPercentage: 99, couponValue: 99, total: 1, finalTotal: 1, subtotal: 1 },
      items: cart(TOP, PANT).map(i => ({ ...i, price: 0.01, priceAtPurchase: 0.01 }))
    });
    const { data } = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.subtotal, 150);
    assert.equal(data.discount, 15);
    assert.equal(data.total, 135);
  });

  it('an unknown, disabled, not-yet-started or expired code is refused and no order is written', async () => {
    const email = `refused@${EMAIL_DOMAIN}`;
    await expectCouponError(await checkout({ couponCode: `${TAG}NOPE`, email }), 400, 'COUPON_INVALID');
    await expectCouponError(await checkout({ couponCode: (await makeCoupon({ active: false })).code, email }), 400, 'COUPON_INACTIVE');
    await expectCouponError(await checkout({ couponCode: (await makeCoupon({ startsAt: new Date(Date.now() + 86_400_000) })).code, email }), 400, 'COUPON_NOT_STARTED');
    await expectCouponError(await checkout({ couponCode: (await makeCoupon({ expiresAt: new Date(Date.now() - 1000) })).code, email }), 400, 'COUPON_EXPIRED');
    assert.equal(await Order.countDocuments({ 'customer.email': email }), 0);
  });

  it('minimum order and maximum discount', async () => {
    await expectCouponError(await checkout({ couponCode: (await makeCoupon({ minOrderAmount: 200 })).code }), 400, 'COUPON_MIN_ORDER');
    const res = await checkout({ couponCode: (await makeCoupon({ value: 50, maxDiscountAmount: 30 })).code });
    assert.equal((await res.json()).data.discount, 30);
  });

  it('product and category restrictions', async () => {
    const byProduct = await (await checkout({ couponCode: (await makeCoupon({ applicableProducts: [PANT] })).code })).json();
    assert.equal(byProduct.data.discount, 5);
    const byCategory = await (await checkout({ couponCode: (await makeCoupon({ applicableCategories: ['Tops'] })).code })).json();
    assert.equal(byCategory.data.discount, 10);
    await expectCouponError(await checkout({ couponCode: (await makeCoupon({ applicableCategories: ['Shoes'] })).code }), 400, 'COUPON_NOT_APPLICABLE');
  });

  it('a usage limit stops at its limit', async () => {
    const c = await makeCoupon({ usageLimit: 1 });
    assert.equal((await checkout({ couponCode: c.code })).status, 201);
    await expectCouponError(await checkout({ couponCode: c.code }), 409, 'COUPON_EXHAUSTED');
    assert.equal((await Coupon.findById(c._id).lean()).usedCount, 1);
  });

  it('a per-user limit counts each shopper separately', async () => {
    const c = await makeCoupon({ perUserLimit: 1 });
    assert.equal((await checkout({ couponCode: c.code, headers: member1.headers, email: member1.email })).status, 201);
    await expectCouponError(await checkout({ couponCode: c.code, headers: member1.headers, email: member1.email }), 409, 'COUPON_USER_LIMIT');
    assert.equal((await checkout({ couponCode: c.code, headers: member2.headers, email: member2.email })).status, 201);
    // A guest reusing the same email is the same shopper.
    const guestEmail = `repeat@${EMAIL_DOMAIN}`;
    assert.equal((await checkout({ couponCode: c.code, email: guestEmail })).status, 201);
    await expectCouponError(await checkout({ couponCode: c.code, email: guestEmail.toUpperCase() }), 409, 'COUPON_USER_LIMIT');
  });

  it('two shoppers racing for the last use: exactly one order gets it', async () => {
    const c = await makeCoupon({ usageLimit: 1 });
    const stockBefore = (await Product.findOne({ id: TOP }).lean()).sizeStock[0].stock;
    const results = await Promise.all(Array.from({ length: 6 }, () => checkout({ couponCode: c.code, items: cart(TOP) })));
    const statuses = await Promise.all(results.map(async r => ({ status: r.status, body: await r.json() })));
    const won = statuses.filter(s => s.status === 201);
    const lost = statuses.filter(s => s.status === 409);
    assert.equal(won.length, 1, JSON.stringify(statuses.map(s => [s.status, s.body.code])));
    assert.equal(lost.length, 5);
    assert.ok(lost.every(s => s.body.code === 'COUPON_EXHAUSTED'));
    assert.equal((await Coupon.findById(c._id).lean()).usedCount, 1);
    // The losers' stock reservations rolled back with them.
    assert.equal((await Product.findOne({ id: TOP }).lean()).sizeStock[0].stock, stockBefore - 1);
  });

  it('cancelling an order gives its coupon use back', async () => {
    const c = await makeCoupon({ usageLimit: 1, perUserLimit: 1 });
    const placed = await (await checkout({ couponCode: c.code, headers: member1.headers, email: member1.email })).json();
    assert.equal((await Coupon.findById(c._id).lean()).usedCount, 1);
    const res = await call('POST', `/api/orders/${placed.data.orderNumber}/cancel`, member1.headers);
    assert.equal(res.status, 200);
    assert.equal((await Coupon.findById(c._id).lean()).usedCount, 0);
    assert.equal((await checkout({ couponCode: c.code, headers: member1.headers, email: member1.email })).status, 201);
  });

  it('editing a coupon later does not change an existing order', async () => {
    const c = await makeCoupon({ value: 10 });
    const placed = await (await checkout({ couponCode: c.code })).json();
    const res = await call('PUT', `/api/admin/coupons/${c._id}`, admin.headers, { code: c.code, type: 'percentage', value: 40 });
    assert.equal(res.status, 200);
    const stored = await Order.findById(placed.data._id).lean();
    assert.equal(stored.coupon.value, 10);
    assert.equal(stored.coupon.discountAmount, 15);
    assert.equal(stored.total, 135);
  });

  it('the quote endpoint prices a code against the catalogue, not the request', async () => {
    const c = await makeCoupon({ value: 10 });
    const res = await call('POST', '/api/coupons/quote', {}, { code: c.code.toLowerCase(), items: [{ productId: TOP, quantity: 2, price: 0.01 }], discountAmount: 999 });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual({ code: body.data.code, discountAmount: body.data.discountAmount, subtotal: body.data.subtotal, label: body.data.label }, { code: c.code, discountAmount: 20, subtotal: 200, label: '10% OFF' });
    await expectCouponError(await call('POST', '/api/coupons/quote', {}, { code: `${TAG}NOPE`, items: cart(TOP) }), 400, 'COUPON_INVALID');
  });

  it('only an administrator can manage coupons', async () => {
    const c = await makeCoupon();
    const body = { code: nextCode('A'), type: 'percentage', value: 10 };
    for (const [method, path, payload] of [
      ['GET', '/api/admin/coupons'], ['POST', '/api/admin/coupons', body],
      ['PUT', `/api/admin/coupons/${c._id}`, body], ['PATCH', `/api/admin/coupons/${c._id}/status`, { active: false }]
    ]) {
      assert.equal((await call(method, path, {}, payload)).status, 401, `${method} ${path} without a token`);
      assert.equal((await call(method, path, member1.headers, payload)).status, 403, `${method} ${path} as a member`);
    }
    assert.equal(await Coupon.countDocuments({ code: body.code }), 0);
    assert.equal((await Coupon.findById(c._id).lean()).active, true);
    assert.equal((await call('DELETE', `/api/admin/coupons/${c._id}`, admin.headers)).status, 404, 'there is no hard delete');
  });

  it('an administrator creates, edits, disables and re-enables a coupon', async () => {
    const code = nextCode('M');
    const created = await call('POST', '/api/admin/coupons', admin.headers, {
      code: code.toLowerCase(), type: 'percentage', value: 15, maxDiscountAmount: 25, minOrderAmount: 60,
      usageLimit: 100, perUserLimit: 2, applicableCategories: ['Tops'], startsAt: null, expiresAt: '2099-01-01T00:00:00.000Z'
    });
    assert.equal(created.status, 201);
    const { data } = await created.json();
    assert.equal(data.code, code, 'codes are stored upper-case');
    assert.equal(data.status, 'active');
    assert.equal(data.label, '15% OFF');

    assert.equal((await call('POST', '/api/admin/coupons', admin.headers, { code, type: 'fixed_amount', value: 5 })).status, 409, 'duplicate code');
    assert.equal((await call('POST', '/api/admin/coupons', admin.headers, { code: nextCode(), type: 'percentage', value: 150 })).status, 400);
    assert.equal((await call('POST', '/api/admin/coupons', admin.headers, { code: nextCode(), type: 'percentage', value: 10, startsAt: '2030-01-02', expiresAt: '2030-01-01' })).status, 400);
    assert.equal((await call('POST', '/api/admin/coupons', admin.headers, { code: nextCode(), type: 'percentage', value: 10, applicableProducts: [`${TAG}-NOPE`] })).status, 400);
    assert.equal((await call('POST', '/api/admin/coupons', admin.headers, { code: 'no spaces!', type: 'percentage', value: 10 })).status, 400);
    assert.equal((await call('POST', '/api/admin/coupons', admin.headers, { code: nextCode(), type: 'percentage', value: 10, usedCount: 50 })).status, 400, 'usedCount is not an input');

    const edited = await call('PUT', `/api/admin/coupons/${data.id}`, admin.headers, { code, type: 'fixed_amount', value: 12 });
    assert.equal(edited.status, 200);
    assert.equal((await edited.json()).data.value, 12);

    const off = await call('PATCH', `/api/admin/coupons/${data.id}/status`, admin.headers, { active: false });
    assert.equal((await off.json()).data.status, 'disabled');
    await expectCouponError(await checkout({ couponCode: code }), 400, 'COUPON_INACTIVE');

    const on = await call('PATCH', `/api/admin/coupons/${data.id}/status`, admin.headers, { active: true });
    assert.equal((await on.json()).data.status, 'active');
    assert.equal((await checkout({ couponCode: code })).status, 201);

    // Once used, a coupon keeps its code and cannot be limited below its use.
    assert.equal((await call('PUT', `/api/admin/coupons/${data.id}`, admin.headers, { code: nextCode('R'), type: 'fixed_amount', value: 12 })).status, 409);
    assert.equal((await call('PUT', `/api/admin/coupons/${data.id}`, admin.headers, { code, type: 'fixed_amount', value: 12, usageLimit: 1 })).status, 200);
    await Coupon.updateOne({ _id: data.id }, { $set: { usedCount: 2 } });
    assert.equal((await call('PUT', `/api/admin/coupons/${data.id}`, admin.headers, { code, type: 'fixed_amount', value: 12, usageLimit: 1 })).status, 409);

    const list = await (await call('GET', `/api/admin/coupons?search=${code.toLowerCase()}`, admin.headers)).json();
    assert.deepEqual(list.data.map(c => c.code), [code]);
  });
});
