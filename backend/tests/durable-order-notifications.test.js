import 'dotenv/config';
import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import dns from 'node:dns';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';

// Windows resolves the Atlas SRV record unreliably through the system servers.
dns.setServers(['8.8.8.8', '1.1.1.1']);

/* The outbox path is read when the service module first loads, so it has to be
   redirected before the import — a test run must never drain or overwrite the
   buffer a real server is holding orders in. Hence the dynamic imports below:
   a static import would be hoisted above this assignment. */
const OUTBOX_PATH = path.join(os.tmpdir(), `matcha-notification-outbox-${process.pid}.json`);
process.env.NOTIFICATION_OUTBOX_PATH = OUTBOX_PATH;

const Notification = (await import('../models/Notification.js')).default;
const NotificationOutbox = (await import('../models/NotificationOutbox.js')).default;
const Order = (await import('../models/Order.js')).default;
const notificationRoutesModule = await import('../routes/notificationRoutes.js');
const {
  dispatchOrderNotification,
  processNotificationOutbox,
  reconcileMissingOrderNotifications,
  ensureNotificationIndexes,
  notificationKey,
  readDiskOutbox,
  writeDiskOutbox,
  getDiskOutboxPath
} = await import('../services/notificationService.js');
const { getJwtSecret } = await import('../middleware/auth.js');

const notificationRoutes = notificationRoutesModule.default;
const { memoryNotifications } = notificationRoutesModule;

const testUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/matcha_test';

let server;
let base;

const token = role => jwt.sign({ id: `test-${role}-durable`, role, email: `${role}@example.test` }, getJwtSecret());
const headers = role => ({ Authorization: `Bearer ${token(role)}`, 'Content-Type': 'application/json' });
const adminHeaders = headers('Admin');

/** Tracks everything written so a failed assertion cannot leave rows behind. */
const createdOrderIds = [];

async function connect() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(testUri, { serverSelectionTimeoutMS: 15000 });
  }
}

async function disconnect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

/* Durable notifications need a real, isolated MongoDB database. A fresh
   checkout does not necessarily have one running locally, and a connection
   refusal used to leave every nested assertion cancelled after a 30-second
   suite timeout. Keep this integration suite strict whenever TEST_MONGODB_URI
   is reachable, but report it as skipped rather than misreporting a missing
   local service as an application failure. */
async function canReachTestDatabase() {
  try {
    await mongoose.connect(testUri, { serverSelectionTimeoutMS: 1_500 });
    await mongoose.disconnect();
    return true;
  } catch {
    await mongoose.disconnect().catch(() => {});
    return false;
  }
}

const databaseAvailable = await canReachTestDatabase();
const durableDescribe = databaseAvailable ? describe : describe.skip;

function trackOrder(orderId) {
  createdOrderIds.push(notificationKey(orderId));
  return orderId;
}

/** A complete, valid order — the reconciliation sweep reads real orders. */
function orderFixture() {
  return {
    idempotencyKey: `test-idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    customer: {
      firstName: 'Somchai',
      lastName: 'Jaidee',
      email: 'somchai@example.test',
      phone: '0800000000',
      address: '1 Test Road',
      city: 'Bangkok',
      zipCode: '10110',
      country: 'Thailand'
    },
    items: [{ productId: 'p1', name: 'Matcha Set', quantity: 1, priceAtPurchase: 500 }],
    paymentMethod: 'cod',
    shippingOption: 'standard',
    subtotal: 500,
    shippingCost: 40,
    discount: 0,
    total: 540
  };
}

durableDescribe('Task 3 — Durable order notifications', () => {
  before(async () => {
    await writeDiskOutbox([]);
    await connect();
    await ensureNotificationIndexes();

    const app = express();
    app.use(express.json());
    app.use('/api/admin/notifications', notificationRoutes);
    server = await new Promise(resolve => {
      const running = app.listen(0, '127.0.0.1', () => resolve(running));
    });
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await connect();
    if (createdOrderIds.length) {
      await Notification.deleteMany({ orderId: { $in: createdOrderIds } });
      await NotificationOutbox.deleteMany({ orderId: { $in: createdOrderIds } });
      await Order.deleteMany({ _id: { $in: createdOrderIds.filter(id => mongoose.isValidObjectId(id)) } });
    }
    await disconnect();

    if (server) await new Promise(resolve => server.close(resolve));
    await fs.rm(getDiskOutboxPath(), { force: true });
  });

  beforeEach(async () => {
    mock.restoreAll();
    await connect();
  });

  it('writes the notification to MongoDB, keyed by orderId', async () => {
    const orderId = trackOrder(new mongoose.Types.ObjectId());
    const orderNumber = `MTA-TEST-${Date.now()}`;

    const result = await dispatchOrderNotification({
      orderId,
      orderNumber,
      customerName: 'Somchai Jaidee',
      total: 1540
    });

    assert.equal(result.success, true);
    assert.equal(result.channel, 'direct');

    const stored = await Notification.findOne({ orderId: notificationKey(orderId) }).lean();
    assert.ok(stored, 'notification must be stored in the database');
    assert.equal(stored.orderNumber, orderNumber);
    assert.equal(stored.total, 1540);
    assert.equal(stored.read, false);
  });

  it('survives a server restart, because the record outlives the connection', async () => {
    const orderId = trackOrder(new mongoose.Types.ObjectId());
    const orderNumber = `MTA-RESTART-${Date.now()}`;

    await dispatchOrderNotification({ orderId, orderNumber, customerName: 'Persistent Buyer', total: 777 });

    /* Drop the connection and open a fresh one: as far as the data is
       concerned this is the process going away and coming back. */
    await disconnect();
    assert.equal(mongoose.connection.readyState, 0);
    await connect();

    const afterRestart = await Notification.findOne({ orderId: notificationKey(orderId) }).lean();
    assert.ok(afterRestart, 'notification must still exist after a restart');
    assert.equal(afterRestart.orderNumber, orderNumber);
    assert.equal(afterRestart.total, 777);
  });

  it('records at most one notification per order, however many times it is retried', async () => {
    const orderId = trackOrder(new mongoose.Types.ObjectId());
    const orderNumber = `MTA-DUP-${Date.now()}`;
    const payload = { orderId, orderNumber, customerName: 'Repeat Buyer', total: 990 };

    const first = await dispatchOrderNotification(payload);
    assert.equal(first.channel, 'direct');

    // Three further attempts, as a stuck retry loop would produce.
    for (let attempt = 0; attempt < 3; attempt++) {
      const retry = await dispatchOrderNotification(payload);
      assert.equal(retry.success, true);
      assert.equal(retry.duplicate, true, 'a retry must be recognised, not written again');
    }

    const count = await Notification.countDocuments({ orderId: notificationKey(orderId) });
    assert.equal(count, 1, 'exactly one notification may exist for an order');
  });

  it('queues to the outbox when the notification write fails, then succeeds on retry', async () => {
    const orderId = trackOrder(new mongoose.Types.ObjectId());
    const orderNumber = `MTA-FAIL-${Date.now()}`;

    // The database is up; the notification write itself is what breaks.
    mock.method(Notification, 'create', async () => {
      throw Object.assign(new Error('simulated write failure'), { code: 251 });
    });

    const dispatched = await dispatchOrderNotification({
      orderId,
      orderNumber,
      customerName: 'Unlucky Buyer',
      total: 1200
    });
    assert.equal(dispatched.success, true, 'a failed write must not fail the caller');
    assert.equal(dispatched.channel, 'mongo_outbox');
    assert.equal(
      await Notification.countDocuments({ orderId: notificationKey(orderId) }),
      0,
      'nothing is written while the failure lasts'
    );

    const queued = await NotificationOutbox.findOne({ orderId: notificationKey(orderId) }).lean();
    assert.ok(queued, 'the payload must be parked in the outbox');
    assert.equal(queued.status, 'pending');

    // The fault clears and the worker runs.
    mock.restoreAll();
    const firstPass = await processNotificationOutbox({ reconcile: false });
    assert.ok(firstPass.succeeded >= 1);

    const recovered = await Notification.findOne({ orderId: notificationKey(orderId) }).lean();
    assert.ok(recovered, 'the retry must produce the notification');
    assert.equal(recovered.orderNumber, orderNumber);
    assert.equal(recovered.total, 1200);

    // A second pass must not double it, and must leave the row completed.
    await processNotificationOutbox({ reconcile: false });
    assert.equal(await Notification.countDocuments({ orderId: notificationKey(orderId) }), 1);
    const settled = await NotificationOutbox.findOne({ orderId: notificationKey(orderId) }).lean();
    assert.equal(settled.status, 'completed');
  });

  it('buffers to disk while the database is down and flushes when it returns', async () => {
    const orderId = trackOrder(new mongoose.Types.ObjectId());
    const orderNumber = `MTA-OFFLINE-${Date.now()}`;

    await disconnect();

    const dispatched = await dispatchOrderNotification({
      orderId,
      orderNumber,
      customerName: 'Offline Shopper',
      total: 2400
    });
    assert.equal(dispatched.success, true);
    assert.equal(dispatched.channel, 'disk_outbox');

    const buffered = (await readDiskOutbox()).find(it => notificationKey(it.orderId) === notificationKey(orderId));
    assert.ok(buffered, 'the payload must be buffered on disk');
    assert.equal(buffered.orderNumber, orderNumber);

    await connect();
    const flushed = await processNotificationOutbox({ reconcile: false });
    assert.ok(flushed.succeeded >= 1);

    const recovered = await Notification.findOne({ orderId: notificationKey(orderId) }).lean();
    assert.ok(recovered, 'the buffered notification must reach the database');
    assert.equal(recovered.total, 2400);

    const drained = (await readDiskOutbox()).find(it => notificationKey(it.orderId) === notificationKey(orderId));
    assert.equal(drained, undefined, 'a flushed entry must leave the buffer');
  });

  it('reconciles an order whose notification was never queued at all', async () => {
    // A crash between committing the order and reaching the notification
    // leaves no outbox row to replay — only the order itself.
    const order = await Order.create(orderFixture());
    trackOrder(order._id);

    assert.equal(await Notification.countDocuments({ orderId: notificationKey(order._id) }), 0);

    const first = await reconcileMissingOrderNotifications({ lookbackMs: 60_000 });
    assert.ok(first.created >= 1, 'the sweep must create the missing notification');

    const created = await Notification.findOne({ orderId: notificationKey(order._id) }).lean();
    assert.ok(created);
    assert.equal(created.orderNumber, order.orderNumber);

    // Running again must not produce a second one, nor a second order.
    const ordersBefore = await Order.countDocuments({ _id: order._id });
    await reconcileMissingOrderNotifications({ lookbackMs: 60_000 });
    assert.equal(await Notification.countDocuments({ orderId: notificationKey(order._id) }), 1);
    assert.equal(await Order.countDocuments({ _id: order._id }), ordersBefore, 'a retry must never create an order');
  });

  it('answers 503 rather than serving memory when the database is unavailable in production', async () => {
    await disconnect();

    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Something in memory to leak, so a passing assertion means something.
    memoryNotifications.push({
      _id: 'notif_leak_probe',
      type: 'new_order',
      orderNumber: 'MTA-LEAK-PROBE',
      customerName: 'Should Never Be Served',
      total: 1,
      read: false,
      createdAt: new Date().toISOString()
    });

    try {
      const listRes = await fetch(`${base}/api/admin/notifications`, { headers: adminHeaders });
      assert.equal(listRes.status, 503, 'GET must report the outage');
      const body = await listRes.json();
      assert.equal(body.success, false);
      assert.equal(body.data, undefined, 'no notification data may be served during an outage');

      const readAllRes = await fetch(`${base}/api/admin/notifications/read-all`, {
        method: 'PATCH',
        headers: adminHeaders
      });
      assert.equal(readAllRes.status, 503);

      const readOneRes = await fetch(`${base}/api/admin/notifications/notif_leak_probe/read`, {
        method: 'PATCH',
        headers: adminHeaders
      });
      assert.equal(readOneRes.status, 503);

      const probe = memoryNotifications.find(n => n._id === 'notif_leak_probe');
      assert.equal(probe.read, false, 'the memory store must not be mutated in production');
    } finally {
      process.env.NODE_ENV = previousEnv;
      memoryNotifications.length = 0;
    }
  });

  it('keeps nothing in memory once notifications are persisted', async () => {
    const before = memoryNotifications.length;
    const orderId = trackOrder(new mongoose.Types.ObjectId());

    await dispatchOrderNotification({
      orderId,
      orderNumber: `MTA-NOLEAK-${Date.now()}`,
      customerName: 'No Leak Member',
      total: 500
    });

    assert.equal(memoryNotifications.length, before, 'the persistent path must not touch the memory store');
  });

  it('serves the notification API to admins only', async () => {
    const guestRes = await fetch(`${base}/api/admin/notifications`);
    assert.equal(guestRes.status, 401, 'a signed-out visitor is rejected');

    const memberRes = await fetch(`${base}/api/admin/notifications`, { headers: headers('Member') });
    assert.equal(memberRes.status, 403, 'a signed-in non-admin is rejected');

    const adminRes = await fetch(`${base}/api/admin/notifications`, { headers: adminHeaders });
    assert.equal(adminRes.status, 200);
    assert.equal((await adminRes.json()).success, true);

    // The write endpoints are behind the same guard.
    const memberReadAll = await fetch(`${base}/api/admin/notifications/read-all`, {
      method: 'PATCH',
      headers: headers('Member')
    });
    assert.equal(memberReadAll.status, 403);

    const guestReadAll = await fetch(`${base}/api/admin/notifications/read-all`, { method: 'PATCH' });
    assert.equal(guestReadAll.status, 401);
  });
});
