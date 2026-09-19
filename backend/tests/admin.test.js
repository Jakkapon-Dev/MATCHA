import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import userRoutes from '../routes/userRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import orderRoutes from '../routes/orderRoutes.js';
import productRoutes from '../routes/productRoutes.js';
import { User } from '../services/userStore.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { getJwtSecret } from '../middleware/auth.js';
import { normalizeProduct, normalizeOrder, normalizeMember, monthlyRevenue } from '../../frontend/src/components/admin/adminData.js';

let server, base;
const token = role => jwt.sign({ id: `test-${role}`, role, email: `${role}@example.test` }, getJwtSecret());
const headers = role => ({ Authorization: `Bearer ${token(role)}`, 'Content-Type': 'application/json' });
before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/users', userRoutes);
  app.use('/admin', adminRoutes);
  app.use('/orders', orderRoutes);
  app.use('/', productRoutes);
  server = await new Promise(resolve => { const running = app.listen(0, '127.0.0.1', () => resolve(running)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));

function connected(t) {
  const state = mongoose.connection.readyState;
  mongoose.connection.readyState = 1;
  t.after(() => { mongoose.connection.readyState = state; });
  t.mock.method(User, 'findById', id => ({ lean: async () => ({ _id: id, role: id === 'test-Admin' ? 'Admin' : 'Member' }) }));
}

test('member directory, admin datasets and order writes require an administrator', async () => {
  for (const [path, method, body] of [['/users', 'GET'], ['/users/u_1', 'PUT', { tier: 'VIP Connoisseur' }], ['/admin/products', 'GET'], ['/admin/orders', 'GET'], ['/orders/o_1', 'PATCH', { status: 'shipped' }]]) {
    assert.equal((await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })).status, 401);
    assert.equal((await fetch(base + path, { method, headers: headers('Member'), body: body && JSON.stringify(body) })).status, 403);
  }
});

test('database outages return errors instead of seeds or successful writes', async () => {
  for (const [path, method, body] of [['/users', 'GET'], ['/admin/products', 'GET'], ['/admin/orders', 'GET'], ['/products/p_1', 'PUT', { quantity: 4 }], ['/products/p_1', 'DELETE'], ['/orders/o_1', 'PATCH', { status: 'shipped' }]]) {
    const response = await fetch(base + path, { method, headers: headers('Admin'), body: body && JSON.stringify(body) });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).success, false);
  }
});

test('directory uses safe field projection, real IDs and paid-order totals', async t => {
  connected(t);
  const user = { _id: 'u_real', name: 'Registered Member', email: 'member@example.test', tier: 'Regular Member' };
  t.mock.method(User, 'find', () => ({ select(fields) {
    assert.equal(fields, '_id name email role tier createdAt');
    return { sort: () => ({ lean: async () => [user] }) };
  } }));
  t.mock.method(Order, 'aggregate', async pipeline => {
    assert.equal(pipeline[0].$match.status.$ne, 'cancelled');
    assert.deepEqual(pipeline[1].$group.totalSpent.$sum.$cond[0], { $eq: ['$paymentStatus', 'paid'] });
    return [{ _id: 'u_real', ordersCount: 2, totalSpent: 49 }];
  });
  const response = await fetch(base + '/users', { headers: headers('Admin') });
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.equal(data[0].id, 'u_real');
  assert.equal(data[0].totalSpent, 49);
  assert.ok(!('passwordHash' in data[0]));
  assert.ok(!('addresses' in data[0]));
});

test('tier updates persist and reject role escalation, invalid values and missing members', async t => {
  connected(t);
  t.mock.method(User, 'findByIdAndUpdate', (id, update, options) => {
    assert.deepEqual(update, { $set: { tier: 'VIP Connoisseur' } });
    assert.equal(options.runValidators, true);
    return { select: () => ({ lean: async () => id === 'missing' ? null : { _id: id, tier: update.$set.tier } }) };
  });
  const put = (id, body) => fetch(base + '/users/' + id, { method: 'PUT', headers: headers('Admin'), body: JSON.stringify(body) });
  assert.equal((await put('u_real', { tier: 'VIP Connoisseur', role: 'Admin' })).status, 400);
  assert.equal((await put('u_real', { tier: 'Made up' })).status, 400);
  assert.equal((await put('missing', { tier: 'VIP Connoisseur' })).status, 404);
  const response = await put('u_real', { tier: 'VIP Connoisseur' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.tier, 'VIP Connoisseur');
});

test('empty admin datasets stay empty, and database errors are not hidden', async t => {
  connected(t);
  t.mock.method(Product, 'find', () => ({ sort: () => ({ lean: async () => [] }) }));
  const response = await fetch(base + '/admin/products', { headers: headers('Admin') });
  assert.deepEqual((await response.json()).data, []);
  t.mock.method(Order, 'find', () => { throw new Error('private database detail'); });
  const failed = await fetch(base + '/admin/orders', { headers: headers('Admin') });
  assert.equal(failed.status, 503);
  assert.ok(!(await failed.text()).includes('private database detail'));
});

test('admin normalization never invents stock, payment, identity or revenue', () => {
  assert.equal(normalizeProduct({ id: 'p', quantity: 0, stock: 20 }).stock, 0);
  assert.equal(normalizeMember({ _id: 'u_real' }).id, 'u_real');
  assert.equal(normalizeMember({ _id: 'u_real' }).tier, 'Regular Member');
  assert.equal(normalizeOrder({}).paymentStatus, 'Unknown');
  assert.equal(normalizeOrder({}).date, '');
  assert.equal(normalizeOrder({ items: [{ quantity: 3 }, { quantity: 2 }] }).items, 5);
  const records = ['paid', 'unpaid', 'refunded'].map(paymentStatus => normalizeOrder({ createdAt: '2026-09-19T00:00:00Z', status: 'processing', paymentStatus, total: 40 }));
  records.push(normalizeOrder({ createdAt: '2026-09-19T00:00:00Z', status: 'cancelled', paymentStatus: 'paid', total: 100 }));
  assert.deepEqual(monthlyRevenue(records), [{ month: '2026-09', revenue: 40, orders: 3 }]);
  assert.deepEqual(monthlyRevenue([]), []);
});

test('stock updates return persisted products and missing products are not reported as saved', async t => {
  connected(t);
  /* The console sends `quantity`; the write has to land on `stock`, which is
     the field the Product schema declares. This assertion previously expected
     `{ $set: { quantity: 0 } }` — the payload as sent — and passed, because
     the controller forwarded it unchanged. The schema has no `quantity` path
     and strict mode drops it, so that $set reached the database and changed
     nothing while the route answered success. The test was green and the
     feature did not work. */
  t.mock.method(Product, 'findOneAndUpdate', async (filter, update) => {
    assert.equal(filter.$or[0].id, 'p_real');
    assert.deepEqual(update, { $set: { stock: 0 } });
    return { id: 'p_real', name: 'Real product', stock: 0 };
  });
  const saved = await fetch(base + '/products/p_real', { method: 'PUT', headers: headers('Admin'), body: JSON.stringify({ quantity: 0 }) });
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).data.stock, 0);
  t.mock.method(Product, 'findOneAndUpdate', async () => null);
  const missing = await fetch(base + '/products/missing', { method: 'PUT', headers: headers('Admin'), body: JSON.stringify({ quantity: 0 }) });
  assert.equal(missing.status, 404);
  t.mock.method(Product, 'findOneAndDelete', async () => null);
  assert.equal((await fetch(base + '/products/missing', { method: 'DELETE', headers: headers('Admin') })).status, 404);
});

test('order status writes validate values and return the persisted result', async t => {
  connected(t);
  t.mock.method(Order, 'findOneAndUpdate', async (filter, update, options) => {
    assert.equal(options.runValidators, true);
    assert.deepEqual(update, { $set: { status: 'shipped' } });
    return { orderNumber: 'o_real', status: 'shipped' };
  });
  const patch = body => fetch(base + '/orders/o_real', { method: 'PATCH', headers: headers('Admin'), body: JSON.stringify(body) });
  assert.equal((await patch({ status: 'made-up' })).status, 400);
  assert.equal((await patch({ status: 'shipped', total: 0 })).status, 400);
  const response = await patch({ status: 'shipped' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.status, 'shipped');
});
