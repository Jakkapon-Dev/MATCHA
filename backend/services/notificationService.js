import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import NotificationOutbox from '../models/NotificationOutbox.js';
import Order from '../models/Order.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* Where the outbox spills when Mongo itself is the thing that is down.

   Overridable so a test run never writes into the file a live server is
   draining. */
const DISK_OUTBOX_PATH = process.env.NOTIFICATION_OUTBOX_PATH
  ? path.resolve(process.env.NOTIFICATION_OUTBOX_PATH)
  : path.resolve(__dirname, '../data/notification-outbox.json');

const DUPLICATE_KEY = 11000;
const MAX_ATTEMPTS = 5;
const RECONCILE_LOOKBACK_MS = 24 * 60 * 60 * 1000;

export function getDiskOutboxPath() {
  return DISK_OUTBOX_PATH;
}

/**
 * The canonical idempotency key for an order's notification.
 *
 * Every writer — the checkout path, the outbox worker, the reconciliation
 * sweep — must derive the key this way, or the unique index has nothing
 * stable to compare and the same order picks up a second notification.
 */
export function notificationKey(orderId) {
  return String(orderId ?? '').trim();
}

/**
 * Logs a notification failure without putting a customer in the log.
 *
 * The payload carries a name and an order total. Neither belongs in an
 * operations log, so only the order key and the error text come out; the key
 * is enough to find the order again when someone needs to.
 */
function logNotificationError(stage, orderId, error) {
  const key = notificationKey(orderId) || 'unknown';
  console.warn(`[notification] ${stage} failed for order ${key}: ${error?.message || error}`);
}

function isDbReady() {
  return mongoose.connection.readyState === 1 && Boolean(mongoose.connection.db);
}

function isDuplicate(err) {
  return err?.code === DUPLICATE_KEY;
}

/** Normalises caller input into exactly the shape the Notification collection stores. */
function buildPayload(orderData) {
  return {
    type: orderData.type || 'new_order',
    orderId: notificationKey(orderData.orderId),
    orderNumber: String(orderData.orderNumber),
    customerName: orderData.customerName || 'Customer',
    total: Number(orderData.total) || 0,
    read: false
  };
}

/**
 * Writes one notification, treating "already there" as success.
 *
 * This is the only place that inserts into the collection, so the duplicate
 * rule lives here once rather than at each of the three call sites.
 */
async function insertNotification(payload) {
  try {
    const created = await Notification.create(payload);
    return { created: true, notification: created };
  } catch (err) {
    if (isDuplicate(err)) return { created: false, duplicate: true };
    throw err;
  }
}

export async function readDiskOutbox() {
  try {
    const raw = await fs.readFile(DISK_OUTBOX_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeDiskOutbox(items) {
  await fs.mkdir(path.dirname(DISK_OUTBOX_PATH), { recursive: true });
  await fs.writeFile(DISK_OUTBOX_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

/**
 * Buffers a payload on disk — the last resort, used when the database that
 * would normally hold the queue is the thing that is unreachable.
 */
async function appendToDiskOutbox(payload, errorReason = '') {
  try {
    const items = await readDiskOutbox();
    const alreadyQueued = items.some(
      it => notificationKey(it.orderId) === payload.orderId && it.type === payload.type
    );
    if (!alreadyQueued) {
      items.push({ ...payload, queuedAt: new Date().toISOString(), errorReason });
      await writeDiskOutbox(items);
    }
    return { success: true, queued: true, channel: 'disk_outbox' };
  } catch (diskErr) {
    logNotificationError('disk outbox write', payload.orderId, diskErr);
    return { success: false, channel: 'disk_outbox', error: diskErr.message };
  }
}

/**
 * Parks a payload for retry: in the Mongo outbox when the database is up, on
 * disk when it is not.
 */
export async function queueNotificationInOutbox(payload, errorReason = '') {
  if (isDbReady()) {
    try {
      await NotificationOutbox.create({
        type: payload.type,
        orderId: payload.orderId,
        payload,
        status: 'pending',
        lastError: errorReason,
        nextRetryAt: new Date()
      });
      return { success: true, queued: true, channel: 'mongo_outbox' };
    } catch (mongoErr) {
      logNotificationError('outbox enqueue', payload.orderId, mongoErr);
      return appendToDiskOutbox(payload, mongoErr.message);
    }
  }

  return appendToDiskOutbox(payload, errorReason || 'database_unavailable');
}

/**
 * Records the "new order" notification for an order that has already been
 * committed.
 *
 * Writes straight to the collection when it can, and parks the payload for
 * retry when it cannot, so a database hiccup during checkout delays the
 * admin's badge instead of losing it. Idempotent on orderId: a retry for an
 * order that already has its notification reports success and writes nothing.
 */
export async function dispatchOrderNotification(orderData) {
  if (!orderData || !orderData.orderId || !orderData.orderNumber) {
    throw new Error('Order notification requires orderId and orderNumber');
  }

  const payload = buildPayload(orderData);

  if (isDbReady()) {
    try {
      const result = await insertNotification(payload);
      if (result.duplicate) {
        return { success: true, duplicate: true, channel: 'idempotent_dedup' };
      }
      return { success: true, channel: 'direct', notification: result.notification };
    } catch (err) {
      logNotificationError('direct insert', payload.orderId, err);
      return queueNotificationInOutbox(payload, err.message);
    }
  }

  return queueNotificationInOutbox(payload, 'database_unavailable');
}

/** Replays whatever the disk buffer holds, keeping only the entries that still fail. */
async function flushDiskOutbox() {
  let succeeded = 0;
  let failed = 0;

  const diskItems = await readDiskOutbox();
  if (diskItems.length === 0) return { succeeded, failed };

  const remaining = [];
  for (const item of diskItems) {
    try {
      await insertNotification(buildPayload(item));
      succeeded++;
    } catch (err) {
      logNotificationError('disk outbox flush', item.orderId, err);
      remaining.push(item);
      failed++;
    }
  }

  await writeDiskOutbox(remaining);
  return { succeeded, failed };
}

/** Replays the Mongo outbox rows whose backoff has elapsed. */
async function flushMongoOutbox() {
  let succeeded = 0;
  let failed = 0;

  const pendingItems = await NotificationOutbox.find({
    status: 'pending',
    nextRetryAt: { $lte: new Date() }
  }).limit(50);

  for (const item of pendingItems) {
    try {
      await insertNotification(buildPayload(item.payload || {}));
      item.status = 'completed';
      item.processedAt = new Date();
      await item.save();
      succeeded++;
    } catch (err) {
      logNotificationError('outbox replay', item.orderId, err);
      item.attempts += 1;
      item.lastError = err.message;
      if (item.attempts >= MAX_ATTEMPTS) {
        item.status = 'failed';
      } else {
        item.nextRetryAt = new Date(Date.now() + Math.min(60000, 2 ** item.attempts * 1000));
      }
      await item.save();
      failed++;
    }
  }

  return { succeeded, failed };
}

/**
 * Catches the orders nothing ever queued for.
 *
 * The outbox only helps when the process lived long enough to write to it. A
 * crash between committing the order and reaching the notification leaves no
 * trace at all, so the order collection itself is the source of truth: any
 * recent order without a notification gets one. Orders are only ever read
 * here, so a retry can never produce a second order.
 */
export async function reconcileMissingOrderNotifications({ lookbackMs = RECONCILE_LOOKBACK_MS, limit = 200 } = {}) {
  if (!isDbReady()) return { checked: 0, created: 0, skipped: 'database_unavailable' };

  let created = 0;
  try {
    const since = new Date(Date.now() - lookbackMs);
    const orders = await Order.find({ createdAt: { $gte: since } })
      .select('_id orderNumber customer total')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (orders.length === 0) return { checked: 0, created: 0 };

    const keys = orders.map(order => notificationKey(order._id));
    const existing = await Notification.find({ type: 'new_order', orderId: { $in: keys } })
      .select('orderId')
      .lean();
    const covered = new Set(existing.map(n => n.orderId));

    for (const order of orders) {
      if (covered.has(notificationKey(order._id))) continue;
      try {
        const result = await insertNotification(buildPayload({
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerName: `${order.customer?.firstName || 'Guest'} ${order.customer?.lastName || ''}`.trim(),
          total: order.total
        }));
        if (result.created) created++;
      } catch (err) {
        logNotificationError('reconciliation insert', order._id, err);
      }
    }

    return { checked: orders.length, created };
  } catch (err) {
    console.warn(`[notification] reconciliation sweep failed: ${err.message}`);
    return { checked: 0, created, error: err.message };
  }
}

/**
 * One recovery cycle: drain the disk buffer, replay the Mongo outbox, then
 * sweep for orders that never reached either.
 */
export async function processNotificationOutbox({ reconcile = true } = {}) {
  if (!isDbReady()) {
    return { processed: 0, succeeded: 0, failed: 0, skipped: 'database_unavailable' };
  }

  let succeeded = 0;
  let failed = 0;

  try {
    const disk = await flushDiskOutbox();
    succeeded += disk.succeeded;
    failed += disk.failed;
  } catch (err) {
    console.warn(`[notification] disk outbox flush failed: ${err.message}`);
  }

  try {
    const mongo = await flushMongoOutbox();
    succeeded += mongo.succeeded;
    failed += mongo.failed;
  } catch (err) {
    console.warn(`[notification] outbox replay failed: ${err.message}`);
  }

  let reconciled = 0;
  if (reconcile) {
    const result = await reconcileMissingOrderNotifications();
    reconciled = result.created || 0;
    succeeded += reconciled;
  }

  return { processed: succeeded + failed, succeeded, failed, reconciled };
}

/**
 * Builds the unique index the whole guarantee rests on.
 *
 * Called at startup rather than left to mongoose's autoIndex so the failure is
 * loud: on a collection that already holds duplicate rows for one order the
 * build is rejected, and an operator needs to see that the constraint is not
 * in force rather than discover it from a doubled badge.
 */
export async function ensureNotificationIndexes() {
  if (!isDbReady()) return { ensured: false, reason: 'database_unavailable' };
  try {
    await Notification.syncIndexes();
    await NotificationOutbox.syncIndexes();
    return { ensured: true };
  } catch (err) {
    console.error(`[notification] unique index not in force — duplicates are possible: ${err.message}`);
    return { ensured: false, reason: err.message };
  }
}

let workerTimer = null;

/** Starts the background recovery cycle. Idempotent — a second call is a no-op. */
export function startNotificationWorker(intervalMs = 30000) {
  if (workerTimer) return;
  ensureNotificationIndexes().catch(() => {});
  workerTimer = setInterval(() => {
    processNotificationOutbox().catch(err => {
      console.warn(`[notification] worker cycle failed: ${err.message}`);
    });
  }, intervalMs);
  // The timer must never be the reason the process stays alive.
  workerTimer.unref?.();
}

export function stopNotificationWorker() {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
}
