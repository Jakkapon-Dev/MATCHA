import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';

import lookbookRoutes from '../routes/lookbookRoutes.js';
import mediaRoutes from '../routes/mediaRoutes.js';
import couponRoutes from '../routes/couponRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import userRoutes from '../routes/userRoutes.js';

let server, base;
const demoAdminHeaders = {
  Authorization: 'Bearer demo-offline-token',
  'Content-Type': 'application/json'
};

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', lookbookRoutes);
  app.use('/api', mediaRoutes);
  app.use('/api', couponRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/users', userRoutes);

  server = await new Promise(resolve => {
    const running = app.listen(0, '127.0.0.1', () => resolve(running));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise(resolve => server.close(resolve)));

test('lookbookRoutes returns 503 with Thai message when database is unavailable', async (t) => {
  const originalState = mongoose.connection.readyState;
  mongoose.connection.readyState = 0;
  t.after(() => { mongoose.connection.readyState = originalState; });

  const res = await fetch(`${base}/api/lookbooks`);
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.message, 'ฐานข้อมูลยังไม่พร้อม กรุณาลองใหม่');
});

test('mediaRoutes returns 503 with Thai message when database is unavailable', async (t) => {
  const originalState = mongoose.connection.readyState;
  mongoose.connection.readyState = 0;
  t.after(() => { mongoose.connection.readyState = originalState; });

  const res = await fetch(`${base}/api/admin/media/products`, { headers: demoAdminHeaders });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.message, 'ฐานข้อมูลยังไม่พร้อม กรุณาลองใหม่');
});

test('couponRoutes returns 503 with Thai message when database is unavailable', async (t) => {
  const originalState = mongoose.connection.readyState;
  mongoose.connection.readyState = 0;
  t.after(() => { mongoose.connection.readyState = originalState; });

  const res = await fetch(`${base}/api/admin/coupons`, { headers: demoAdminHeaders });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.message, 'ฐานข้อมูลยังไม่พร้อม กรุณาลองใหม่');
});

test('adminRoutes returns 503 with English message when database is unavailable', async (t) => {
  const originalState = mongoose.connection.readyState;
  mongoose.connection.readyState = 0;
  t.after(() => { mongoose.connection.readyState = originalState; });

  const res = await fetch(`${base}/api/admin/stats`, { headers: demoAdminHeaders });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.message, 'Database unavailable');
});

test('userRoutes returns 503 with member message when database is unavailable', async (t) => {
  const originalState = mongoose.connection.readyState;
  mongoose.connection.readyState = 0;
  t.after(() => { mongoose.connection.readyState = originalState; });

  const res = await fetch(`${base}/api/users`, { headers: demoAdminHeaders });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.message, 'Member database unavailable');
});
