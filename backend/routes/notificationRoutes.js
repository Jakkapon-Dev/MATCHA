import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = express.Router();

export const memoryNotifications = [];

// All notification routes require Admin authentication
router.use(authRequired, adminOnly);

// GET /api/admin/notifications - List recent notifications & unread count
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const [notifications, unreadCount] = await Promise.all([
        Notification.find({}).sort({ createdAt: -1 }).limit(30).lean(),
        Notification.countDocuments({ read: false })
      ]);
      return res.json({
        success: true,
        data: notifications.map(n => ({ ...n, id: n._id })),
        unreadCount
      });
    }

    // Memory fallback
    const sorted = [...memoryNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 30);
    const unread = memoryNotifications.filter(n => !n.read).length;
    res.json({
      success: true,
      data: sorted,
      unreadCount: unread
    });
  } catch {
    res.status(503).json({ success: false, message: 'Could not load notifications' });
  }
});

// PATCH /api/admin/notifications/read-all - Mark all as read
router.patch('/read-all', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await Notification.updateMany({ read: false }, { $set: { read: true } });
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    memoryNotifications.forEach(n => { n.read = true; });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch {
    res.status(503).json({ success: false, message: 'Could not mark all notifications as read' });
  }
});

// PATCH /api/admin/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const updated = await Notification.findByIdAndUpdate(id, { $set: { read: true } }, { new: true }).lean();
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      return res.json({ success: true, data: { ...updated, id: updated._id } });
    }

    const item = memoryNotifications.find(n => String(n._id || n.id) === String(id));
    if (!item) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    item.read = true;
    res.json({ success: true, data: item });
  } catch {
    res.status(503).json({ success: false, message: 'Could not update notification' });
  }
});

export default router;
