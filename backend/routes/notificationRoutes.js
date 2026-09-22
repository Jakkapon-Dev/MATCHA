import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { authRequired, adminOnly } from '../middleware/auth.js';
import { isDemo } from '../config/storeMode.js';
import { processNotificationOutbox } from '../services/notificationService.js';

const router = express.Router();

/* The offline demo store's notification list.

   It exists only so the demo build has something to show without a database
   behind it. A live shop must never read from it: an admin looking at a stale
   in-memory list during an outage sees an empty badge and concludes no orders
   came in, which is worse than being told the list is unavailable. */
export const memoryNotifications = [];

function isDbConnected() {
  return mongoose.connection.readyState === 1 && Boolean(mongoose.connection.db);
}

/** True only for the offline demo build, never for a live or production shop. */
export function isMemoryFallbackAllowed() {
  return isDemo && process.env.NODE_ENV !== 'production';
}

/** A dead database is the caller's cue to retry, not a bug in the request. */
function databaseUnavailable(res) {
  return res.status(503).json({ success: false, message: 'Notification database unavailable' });
}

/* An error thrown mid-query is still an outage if the connection has since
   dropped — report it as one so the client retries rather than giving up. */
function failed(res, message) {
  const status = isDbConnected() ? 500 : 503;
  return res.status(status).json({ success: false, message });
}

// All notification routes require Admin authentication
router.use(authRequired, adminOnly);

// GET /api/admin/notifications - List recent notifications & unread count
router.get('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      if (!isMemoryFallbackAllowed()) return databaseUnavailable(res);

      const sorted = [...memoryNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 30);
      return res.json({
        success: true,
        data: sorted,
        unreadCount: memoryNotifications.filter(n => !n.read).length
      });
    }

    /* An admin opening the bell is the best moment to catch up on anything the
       worker has not reached yet. Deliberately not awaited: recovery must not
       hold the list open, and the worker will get to it regardless. */
    processNotificationOutbox().catch(() => {});

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({}).sort({ createdAt: -1 }).limit(30).lean(),
      Notification.countDocuments({ read: false })
    ]);

    return res.json({
      success: true,
      data: notifications.map(n => ({ ...n, id: n._id })),
      unreadCount
    });
  } catch {
    return failed(res, 'Could not load notifications');
  }
});

// PATCH /api/admin/notifications/read-all - Mark all as read
router.patch('/read-all', async (req, res) => {
  try {
    if (!isDbConnected()) {
      if (!isMemoryFallbackAllowed()) return databaseUnavailable(res);

      memoryNotifications.forEach(n => { n.read = true; });
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    await Notification.updateMany({ read: false }, { $set: { read: true } });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch {
    return failed(res, 'Could not mark all notifications as read');
  }
});

// PATCH /api/admin/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    if (!isDbConnected()) {
      if (!isMemoryFallbackAllowed()) return databaseUnavailable(res);

      const item = memoryNotifications.find(n => String(n._id || n.id) === String(id));
      if (!item) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      item.read = true;
      return res.json({ success: true, data: item });
    }

    const updated = await Notification.findByIdAndUpdate(id, { $set: { read: true } }, { new: true }).lean();
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return res.json({ success: true, data: { ...updated, id: updated._id } });
  } catch {
    return failed(res, 'Could not update notification');
  }
});

export default router;
