/* The dashboard used to add up whatever the tables were holding.
 *
 * The inventory, orders and members tables are paginated at 25 rows. With 75
 * garments in the catalogue that meant "Active Stock Units", "Low Stock",
 * "garment lines", the category split and the revenue chart were all counted
 * from the first page and nothing else — every one of them understated, and
 * every one of them changing when an administrator turned a page.
 *
 * GET /admin/stats counts the whole collection instead. These cover that it
 * asks the database for the figures rather than a page of rows, and that the
 * admin gate still holds.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import adminRoutes from '../routes/adminRoutes.js';
import { User } from '../services/userStore.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { getJwtSecret } from '../middleware/auth.js';

let server, base;
const adminHeaders = () => ({
  Authorization: `Bearer ${jwt.sign({ id: 'u_admin_test', role: 'Admin', email: 'admin@matcha.local' }, getJwtSecret())}`,
  'Content-Type': 'application/json'
});

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
  server = await new Promise(resolve => {
    const running = app.listen(0, '127.0.0.1', () => resolve(running));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise(resolve => server.close(resolve)));

function mockDbConnected(t) {
  const state = mongoose.connection.readyState;
  mongoose.connection.readyState = 1;
  t.after(() => { mongoose.connection.readyState = state; });
  t.mock.method(User, 'findById', id => ({
    lean: async () => ({ _id: id, role: 'Admin', email: 'admin@matcha.local' })
  }));
}

test('GET /admin/stats reports whole-collection figures, not a page of rows', async (t) => {
  mockDbConnected(t);

  t.mock.method(Product, 'aggregate', async (pipeline) => (
    pipeline.some(stage => stage.$group?._id === '$category')
      ? [{ _id: 'Tops', count: 30 }, { _id: 'Outerwear', count: 45 }]
      : [{ _id: null, totalProducts: 75, totalStockUnits: 3200, lowStockCount: 7 }]
  ));
  t.mock.method(Order, 'aggregate', async (pipeline) => (
    pipeline.some(stage => stage.$sort)
      ? [{ _id: '2026-08', orders: 4, revenue: 800 }, { _id: '2026-09', orders: 9, revenue: 1900 }]
      : [{ _id: null, totalOrders: 13, paidRevenue: 2700 }]
  ));
  t.mock.method(User, 'aggregate', async () => [{ _id: null, totalMembers: 41, vipMembers: 6 }]);

  const res = await fetch(`${base}/api/admin/stats`, { headers: adminHeaders() });
  assert.equal(res.status, 200);
  const { success, data } = await res.json();

  assert.equal(success, true);
  // 75 garments, not the 25 a page would have reached.
  assert.equal(data.totalProducts, 75);
  assert.equal(data.totalStockUnits, 3200);
  assert.equal(data.lowStockCount, 7);
  assert.deepEqual(data.categories, { Tops: 30, Outerwear: 45 });
  assert.equal(data.totalOrders, 13);
  assert.equal(data.paidRevenue, 2700);
  assert.deepEqual(data.monthly, [
    { month: '2026-08', orders: 4, revenue: 800 },
    { month: '2026-09', orders: 9, revenue: 1900 }
  ]);
  assert.equal(data.totalMembers, 41);
  assert.equal(data.vipMembers, 6);
});

test('GET /admin/stats answers zeroes rather than crashing on an empty shop', async (t) => {
  mockDbConnected(t);
  t.mock.method(Product, 'aggregate', async () => []);
  t.mock.method(Order, 'aggregate', async () => []);
  t.mock.method(User, 'aggregate', async () => []);

  const res = await fetch(`${base}/api/admin/stats`, { headers: adminHeaders() });
  assert.equal(res.status, 200);
  const { data } = await res.json();
  assert.equal(data.totalProducts, 0);
  assert.equal(data.paidRevenue, 0);
  assert.deepEqual(data.monthly, []);
  assert.deepEqual(data.categories, {});
});

test('GET /admin/stats is closed to callers who are not administrators', async () => {
  const anonymous = await fetch(`${base}/api/admin/stats`);
  assert.ok([401, 403].includes(anonymous.status), `anonymous got ${anonymous.status}`);

  const customerToken = jwt.sign({ id: 'u_customer', role: 'Customer', email: 'shopper@matcha.local' }, getJwtSecret());
  const customer = await fetch(`${base}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  assert.equal(customer.status, 403);
});
