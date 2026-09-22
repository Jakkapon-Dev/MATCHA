import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import notificationRoutes, { memoryNotifications } from '../routes/notificationRoutes.js';
import { User } from '../services/userStore.js';
import Notification from '../models/Notification.js';
import NotificationOutbox from '../models/NotificationOutbox.js';
import Order from '../models/Order.js';
import { getJwtSecret } from '../middleware/auth.js';

let server, base, originalReadyState, originalDb, originalFindById;
const originalNotificationMethods = {};
const originalOutboxFind = NotificationOutbox.find;
const originalOrderFind = Order.find;
const token = role => jwt.sign({ id: `test-${role}`, role, email: `${role}@example.test` }, getJwtSecret());
const headers = role => ({ Authorization: `Bearer ${token(role)}`, 'Content-Type': 'application/json' });

before(async () => {
  originalReadyState = mongoose.connection.readyState;
  originalDb = mongoose.connection.db;
  originalFindById = User.findById;
  mongoose.connection.readyState = 1;
  mongoose.connection.db = originalDb || {};
  User.findById = id => ({
    lean: async () => ({
      _id: id,
      role: id === 'test-Admin' ? 'Admin' : 'Member',
      email: `${id}@example.test`
    })
  });
  for (const method of ['find', 'countDocuments', 'findByIdAndUpdate', 'updateMany']) {
    originalNotificationMethods[method] = Notification[method];
  }

  const notificationQuery = () => ({
    sort: () => notificationQuery(),
    limit: () => notificationQuery(),
    select: () => notificationQuery(),
    lean: async () => [...memoryNotifications]
  });
  Notification.find = () => notificationQuery();
  Notification.countDocuments = async filter => memoryNotifications.filter(item => (
    filter?.read === false ? !item.read : true
  )).length;
  Notification.findByIdAndUpdate = id => ({
    lean: async () => {
      const item = memoryNotifications.find(entry => String(entry._id || entry.id) === String(id));
      if (item) item.read = true;
      return item || null;
    }
  });
  Notification.updateMany = async () => {
    memoryNotifications.forEach(item => { item.read = true; });
    return { modifiedCount: memoryNotifications.length };
  };

  // The routes now read the durable Mongo model. Keep the outbox worker quiet
  // while this route-level test supplies an in-memory model fixture.
  const emptyQuery = () => ({
    sort: () => emptyQuery(),
    limit: () => emptyQuery(),
    select: () => emptyQuery(),
    lean: async () => [],
    // Mongoose queries are awaitable. The outbox replay awaits the result
    // without calling lean(), so the fixture must behave the same way.
    then: (resolve, reject) => Promise.resolve([]).then(resolve, reject)
  });
  NotificationOutbox.find = () => emptyQuery();
  Order.find = () => emptyQuery();
  const app = express();
  app.use(express.json());
  app.use('/api/admin/notifications', notificationRoutes);
  server = await new Promise(resolve => { const running = app.listen(0, '127.0.0.1', () => resolve(running)); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  mongoose.connection.readyState = originalReadyState;
  mongoose.connection.db = originalDb;
  User.findById = originalFindById;
  for (const [method, original] of Object.entries(originalNotificationMethods)) {
    Notification[method] = original;
  }
  NotificationOutbox.find = originalOutboxFind;
  Order.find = originalOrderFind;
});

test('notifications require Admin authorization (401/403 for guest and member)', async () => {
  // Guest
  const guestRes = await fetch(`${base}/api/admin/notifications`);
  assert.equal(guestRes.status, 401);

  // Member
  const memberRes = await fetch(`${base}/api/admin/notifications`, { headers: headers('Member') });
  assert.equal(memberRes.status, 403);
});

test('admin can retrieve notifications and see unreadCount', async () => {
  memoryNotifications.length = 0;
  memoryNotifications.push({
    _id: 'notif_1',
    id: 'notif_1',
    type: 'new_order',
    orderNumber: 'MTA-2026-001',
    customerName: 'Somsak Dee',
    total: 99.5,
    read: false,
    createdAt: new Date().toISOString()
  });

  const res = await fetch(`${base}/api/admin/notifications`, { headers: headers('Admin') });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.unreadCount, 1);
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].orderNumber, 'MTA-2026-001');
});

test('admin can mark a single notification as read', async () => {
  const res = await fetch(`${base}/api/admin/notifications/notif_1/read`, {
    method: 'PATCH',
    headers: headers('Admin')
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.read, true);

  // Check unread count is now 0
  const checkRes = await fetch(`${base}/api/admin/notifications`, { headers: headers('Admin') });
  const checkBody = await checkRes.json();
  assert.equal(checkBody.unreadCount, 0);
});

test('admin can mark all notifications as read', async () => {
  memoryNotifications.push(
    { _id: 'notif_2', id: 'notif_2', read: false, orderNumber: 'MTA-2', customerName: 'A', total: 10, createdAt: new Date().toISOString() },
    { _id: 'notif_3', id: 'notif_3', read: false, orderNumber: 'MTA-3', customerName: 'B', total: 20, createdAt: new Date().toISOString() }
  );

  const res = await fetch(`${base}/api/admin/notifications/read-all`, {
    method: 'PATCH',
    headers: headers('Admin')
  });
  assert.equal(res.status, 200);

  const checkRes = await fetch(`${base}/api/admin/notifications`, { headers: headers('Admin') });
  const checkBody = await checkRes.json();
  assert.equal(checkBody.unreadCount, 0);
});
