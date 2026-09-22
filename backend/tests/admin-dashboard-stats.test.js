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
import {
  collectDashboardStats,
  LOW_STOCK_THRESHOLD,
  PRODUCT_TOTALS_PIPELINE,
  CATEGORY_PIPELINE,
  ORDER_TOTALS_PIPELINE,
  MONTHLY_PIPELINE,
  MEMBER_PIPELINE
} from '../services/dashboardStats.js';
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

function mockDbConnected(t, role = 'Admin') {
  const state = mongoose.connection.readyState;
  const db = mongoose.connection.db;
  mongoose.connection.readyState = 1;
  mongoose.connection.db = db || {};
  t.after(() => {
    mongoose.connection.readyState = state;
    mongoose.connection.db = db;
  });
  t.mock.method(User, 'findById', id => {
    return ({
      lean: async () => ({ _id: id, role, email: 'admin@matcha.local' })
    });
  });
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

test('GET /admin/stats is closed to callers who are not administrators', async (t) => {
  mockDbConnected(t, 'Member');
  const anonymous = await fetch(`${base}/api/admin/stats`);
  assert.ok([401, 403].includes(anonymous.status), `anonymous got ${anonymous.status}`);

  const customerToken = jwt.sign({ id: 'u_customer', role: 'Customer', email: 'shopper@matcha.local' }, getJwtSecret());
  const customer = await fetch(`${base}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  assert.equal(customer.status, 403);
});


/* The rules the pipelines encode, asserted against the pipelines themselves.
 *
 * Reading them off a rendered number would not distinguish "revenue excludes
 * cancelled orders" from "there happened to be no cancelled orders in the
 * fixture". These check the conditions are actually in the aggregation the
 * database will run.
 */

test('revenue counts an order only when it is paid and not cancelled', () => {
  const [{ $group }] = ORDER_TOTALS_PIPELINE;
  const [condition] = $group.paidRevenue.$sum.$cond;
  assert.deepEqual(condition, {
    $and: [{ $ne: ['$status', 'cancelled'] }, { $eq: ['$paymentStatus', 'paid'] }]
  });
});

test('the monthly chart drops cancelled orders and only banks paid ones', () => {
  const [match, group, sort] = MONTHLY_PIPELINE;
  // Cancelled orders are not part of the month's trade at all.
  assert.deepEqual(match, { $match: { status: { $ne: 'cancelled' } } });
  // Of what is left, only a paid order moves the revenue bar...
  assert.deepEqual(group.$group.revenue.$sum.$cond[0], { $eq: ['$paymentStatus', 'paid'] });
  // ...while the order count includes those still awaiting payment.
  assert.deepEqual(group.$group.orders, { $sum: 1 });
  assert.deepEqual(group.$group._id, { $dateToString: { format: '%Y-%m', date: '$createdAt' } });
  assert.deepEqual(sort, { $sort: { _id: 1 } });
});

test('the category split is taken over the whole catalogue', () => {
  // A $match here would silently scope the chart to a subset.
  assert.equal(CATEGORY_PIPELINE.some(stage => stage.$match), false);
  assert.deepEqual(CATEGORY_PIPELINE, [{ $group: { _id: '$category', count: { $sum: 1 } } }]);
});

test('product totals cover every garment and use the inventory table’s low-stock threshold', () => {
  const [{ $group }] = PRODUCT_TOTALS_PIPELINE;
  assert.equal(PRODUCT_TOTALS_PIPELINE.some(stage => stage.$match), false);
  assert.equal($group._id, null, 'one bucket, so every product is counted');
  assert.deepEqual($group.totalProducts, { $sum: 1 });
  // Must match the table's own "Low Stock" badge, or the alert count and the
  // list it sends the administrator to would disagree.
  assert.equal(LOW_STOCK_THRESHOLD, 10);
  assert.deepEqual($group.lowStockCount.$sum.$cond[0], {
    $lte: [{ $ifNull: ['$stock', 0] }, 10]
  });
});

test('VIP membership is read off the tier, over every member', () => {
  const [{ $group }] = MEMBER_PIPELINE;
  assert.equal(MEMBER_PIPELINE.some(stage => stage.$match), false);
  assert.deepEqual($group.vipMembers.$sum.$cond[0], {
    $regexMatch: { input: { $ifNull: ['$tier', ''] }, regex: 'VIP' }
  });
});

/* The shaping, driven directly rather than through the route. */

test('collectDashboardStats shapes the five aggregations into the dashboard payload', async () => {
  const data = await collectDashboardStats({
    Product: {
      aggregate: async (pipeline) => (
        pipeline === CATEGORY_PIPELINE
          ? [{ _id: 'Tops', count: 30 }, { _id: null, count: 4 }, { _id: 'Shoes', count: 41 }]
          : [{ _id: null, totalProducts: 75, totalStockUnits: 3200, lowStockCount: 7 }]
      )
    },
    Order: {
      aggregate: async (pipeline) => (
        pipeline === MONTHLY_PIPELINE
          ? [{ _id: '2026-08', orders: 4, revenue: 800 }, { _id: null, orders: 1, revenue: 50 }]
          : [{ _id: null, totalOrders: 13, paidRevenue: 2700 }]
      )
    },
    User: { aggregate: async () => [{ _id: null, totalMembers: 41, vipMembers: 6 }] }
  });

  assert.equal(data.totalProducts, 75);
  assert.equal(data.totalStockUnits, 3200);
  assert.equal(data.lowStockCount, 7);
  assert.equal(data.paidRevenue, 2700);
  assert.equal(data.vipMembers, 6);
  // A product with no category, and an order with no createdAt, are dropped
  // rather than shown as a blank slice or a blank month.
  assert.deepEqual(data.categories, { Tops: 30, Shoes: 41 });
  assert.deepEqual(data.monthly, [{ month: '2026-08', orders: 4, revenue: 800 }]);
});

test('an empty shop reports zeroes, never an invented figure', async () => {
  const empty = { aggregate: async () => [] };
  const data = await collectDashboardStats({ Product: empty, Order: empty, User: empty });
  assert.deepEqual(data, {
    totalProducts: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    categories: {},
    totalOrders: 0,
    paidRevenue: 0,
    monthly: [],
    totalMembers: 0,
    vipMembers: 0
  });
});

/* Nothing here may guess. A database that cannot be reached, or an
   aggregation that fails, has to say so: a KPI that is quietly wrong is worse
   than one that is visibly missing, and the dashboard shows an error state
   for exactly this. */
test('GET /admin/stats answers 503 when the database is unavailable', async (t) => {
  const state = mongoose.connection.readyState;
  mongoose.connection.readyState = 0;
  t.after(() => { mongoose.connection.readyState = state; });
  t.mock.method(User, 'findById', id => ({
    lean: async () => ({ _id: id, role: 'Admin', email: 'admin@matcha.local' })
  }));
  let aggregated = false;
  t.mock.method(Product, 'aggregate', async () => { aggregated = true; return []; });

  const res = await fetch(`${base}/api/admin/stats`, { headers: adminHeaders() });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.data, undefined, 'no figures are served alongside the failure');
  assert.equal(aggregated, false, 'and nothing was queried');
});

test('GET /admin/stats answers 503 when an aggregation fails', async (t) => {
  mockDbConnected(t);
  t.mock.method(Product, 'aggregate', async () => { throw new Error('connection reset'); });
  t.mock.method(Order, 'aggregate', async () => []);
  t.mock.method(User, 'aggregate', async () => []);

  const res = await fetch(`${base}/api/admin/stats`, { headers: adminHeaders() });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).data, undefined);
});
