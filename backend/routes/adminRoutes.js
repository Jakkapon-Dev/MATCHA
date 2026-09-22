import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import DeletionRequest from '../models/DeletionRequest.js';
import AuditLog from '../models/AuditLog.js';
import { anonymizeUserData } from '../services/anonymizationService.js';
import { User } from '../services/userStore.js';
import { collectDashboardStats } from '../services/dashboardStats.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const databaseRequired = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'Database unavailable' });
  next();
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* GET /admin/stats — the dashboard's numbers, counted by the database.
 *
 * The dashboard used to add up whatever the inventory, orders and members
 * tables happened to be holding. Those tables are paginated at 25 rows, so
 * with 75 garments in the catalogue "Active Stock Units", "Low Stock",
 * "garment lines", the category split and the revenue chart were all
 * reporting on the first page and nothing else — understating every one of
 * them, and changing whenever an administrator turned a page.
 *
 * The aggregation itself lives in services/dashboardStats.js, where the rules
 * it encodes can be asserted directly. `databaseRequired` above means a
 * database that is down answers 503: there is no cached or estimated figure
 * to fall back on, and a made-up KPI is worse than an absent one.
 */
router.get('/stats', authRequired, adminOnly, databaseRequired, async (req, res) => {
  try {
    const data = await collectDashboardStats({ Product, Order, User });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error building admin stats:', error);
    res.status(503).json({ success: false, message: 'Could not load dashboard statistics' });
  }
});

// GET /admin/products with server-side pagination, search, and category/status filtering
router.get('/products', authRequired, adminOnly, databaseRequired, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.pageSize || req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const term = escapeRegex(req.query.search.trim());
      const regex = new RegExp(term, 'i');
      filter.$or = [
        { name: regex },
        { id: regex },
        { sku: regex },
        { color: regex }
      ];
    }

    if (req.query.category && typeof req.query.category === 'string' && req.query.category.trim() && req.query.category !== 'ALL') {
      filter.category = new RegExp(`^${escapeRegex(req.query.category.trim())}$`, 'i');
    }

    if (req.query.status && typeof req.query.status === 'string' && req.query.status.trim() && req.query.status !== 'ALL') {
      const status = req.query.status.trim();
      if (status === 'In Stock') {
        filter.stock = { $gt: 10 };
      } else if (status === 'Low Stock') {
        filter.stock = { $gt: 0, $lte: 10 };
      } else if (status === 'Out of Stock') {
        filter.stock = { $lte: 0 };
      }
    }

    let query = Product.find(filter).sort({ createdAt: -1 });
    if (typeof query.skip === 'function') query = query.skip(skip);
    if (typeof query.limit === 'function') query = query.limit(limit);

    let total = 0;
    if (mongoose.connection.db && typeof Product.countDocuments === 'function') {
      try {
        total = await Product.countDocuments(filter);
      } catch {
        total = 0;
      }
    }

    const data = await query.lean();
    if (!total && Array.isArray(data)) {
      total = data.length;
    }

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        pageSize: limit,
        totalPages
      }
    });
  } catch {
    res.status(503).json({ success: false, message: 'Could not load products' });
  }
});

// GET /admin/orders with server-side pagination, search, and status filtering
router.get('/orders', authRequired, adminOnly, databaseRequired, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.pageSize || req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const term = escapeRegex(req.query.search.trim());
      const regex = new RegExp(term, 'i');
      filter.$or = [
        { orderNumber: regex },
        { orderId: regex },
        { 'customer.firstName': regex },
        { 'customer.lastName': regex },
        { 'customer.email': regex }
      ];
    }

    if (req.query.status && typeof req.query.status === 'string' && req.query.status.trim() && req.query.status !== 'ALL') {
      filter.status = new RegExp(`^${escapeRegex(req.query.status.trim())}$`, 'i');
    }

    let query = Order.find(filter).sort({ createdAt: -1 });
    if (typeof query.skip === 'function') query = query.skip(skip);
    if (typeof query.limit === 'function') query = query.limit(limit);

    let total = 0;
    if (mongoose.connection.db && typeof Order.countDocuments === 'function') {
      try {
        total = await Order.countDocuments(filter);
      } catch {
        total = 0;
      }
    }

    const data = await query.lean();
    if (!total && Array.isArray(data)) {
      total = data.length;
    }

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        pageSize: limit,
        totalPages
      }
    });
  } catch {
    res.status(503).json({ success: false, message: 'Could not load orders' });
  }
});

// Helper for operator email/id
const getOperator = (req) => req.user?.email || req.user?._id || req.user?.id || 'admin';

// GET /admin/deletion-requests with server-side pagination, search, and status filtering
router.get('/deletion-requests', authRequired, adminOnly, databaseRequired, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const term = escapeRegex(req.query.search.trim());
      const regex = new RegExp(term, 'i');
      filter.$or = [
        { email: regex },
        { userId: regex }
      ];
    }

    if (req.query.status && typeof req.query.status === 'string' && req.query.status.trim() && req.query.status !== 'ALL') {
      filter.status = req.query.status.trim();
    }

    let query = DeletionRequest.find(filter).sort({ createdAt: -1 });
    if (typeof query.skip === 'function') query = query.skip(skip);
    if (typeof query.limit === 'function') query = query.limit(limit);

    let total = 0;
    if (mongoose.connection.db && typeof DeletionRequest.countDocuments === 'function') {
      try {
        total = await DeletionRequest.countDocuments(filter);
      } catch {
        total = 0;
      }
    }

    const data = await query.lean();
    if (!total && Array.isArray(data)) {
      total = data.length;
    }

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch {
    res.status(503).json({ success: false, message: 'Could not load deletion requests' });
  }
});

// GET /admin/deletion-requests/:id
router.get('/deletion-requests/:id', authRequired, adminOnly, databaseRequired, async (req, res) => {
  try {
    const item = await DeletionRequest.findById(req.params.id).lean();
    if (!item) {
      return res.status(404).json({ success: false, message: 'Deletion request not found' });
    }
    res.json({ success: true, data: item });
  } catch {
    res.status(503).json({ success: false, message: 'Could not load deletion request' });
  }
});

// PATCH /admin/deletion-requests/:id/review
router.patch('/deletion-requests/:id/review', authRequired, adminOnly, databaseRequired, async (req, res) => {
  try {
    const item = await DeletionRequest.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Deletion request not found' });
    }
    if (item.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot move to reviewed from status "${item.status}". Only pending requests can be reviewed.`
      });
    }

    const operator = getOperator(req);
    item.status = 'reviewed';
    item.reviewedBy = operator;
    item.reviewedAt = new Date();
    if (typeof req.body.notes === 'string') {
      item.notes = req.body.notes.trim();
    }
    await item.save();

    try {
      if (typeof AuditLog.create === 'function') {
        await AuditLog.create({
          action: 'DELETION_REQUEST_REVIEWED',
          performedBy: operator,
          performedByRole: req.user?.role || 'Admin',
          targetUserId: item.userId,
          targetEmail: item.email,
          targetEntity: 'DeletionRequest',
          targetEntityId: String(item._id),
          details: { notes: item.notes },
          ip: req.ip
        });
      }
    } catch {
      // Non-blocking log failure
    }

    res.json({ success: true, message: 'Deletion request marked as reviewed', data: item });
  } catch {
    res.status(503).json({ success: false, message: 'Could not review deletion request' });
  }
});

// PATCH /admin/deletion-requests/:id/approve
router.patch('/deletion-requests/:id/approve', authRequired, adminOnly, databaseRequired, async (req, res) => {
  try {
    const item = await DeletionRequest.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Deletion request not found' });
    }
    if (!['pending', 'reviewed'].includes(item.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve request with status "${item.status}". Only pending or reviewed requests can be approved.`
      });
    }

    const operator = getOperator(req);
    item.status = 'approved';
    item.approvedBy = operator;
    item.approvedAt = new Date();
    if (typeof req.body.notes === 'string') {
      item.notes = req.body.notes.trim();
    }
    await item.save();

    try {
      if (typeof AuditLog.create === 'function') {
        await AuditLog.create({
          action: 'DELETION_REQUEST_APPROVED',
          performedBy: operator,
          performedByRole: req.user?.role || 'Admin',
          targetUserId: item.userId,
          targetEmail: item.email,
          targetEntity: 'DeletionRequest',
          targetEntityId: String(item._id),
          details: { notes: item.notes },
          ip: req.ip
        });
      }
    } catch {
      // Non-blocking log failure
    }

    res.json({ success: true, message: 'Deletion request approved', data: item });
  } catch {
    res.status(503).json({ success: false, message: 'Could not approve deletion request' });
  }
});

// PATCH /admin/deletion-requests/:id/reject
router.patch('/deletion-requests/:id/reject', authRequired, adminOnly, databaseRequired, async (req, res) => {
  try {
    const item = await DeletionRequest.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Deletion request not found' });
    }
    if (!['pending', 'reviewed'].includes(item.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status "${item.status}". Only pending or reviewed requests can be rejected.`
      });
    }

    const operator = getOperator(req);
    const rejectionReason = typeof req.body.reason === 'string' ? req.body.reason.trim() : (req.body.rejectionReason || '');
    item.status = 'rejected';
    item.rejectedBy = operator;
    item.rejectedAt = new Date();
    item.rejectionReason = rejectionReason;
    if (typeof req.body.notes === 'string') {
      item.notes = req.body.notes.trim();
    }
    await item.save();

    try {
      if (typeof AuditLog.create === 'function') {
        await AuditLog.create({
          action: 'DELETION_REQUEST_REJECTED',
          performedBy: operator,
          performedByRole: req.user?.role || 'Admin',
          targetUserId: item.userId,
          targetEmail: item.email,
          targetEntity: 'DeletionRequest',
          targetEntityId: String(item._id),
          details: { rejectionReason, notes: item.notes },
          ip: req.ip
        });
      }
    } catch {
      // Non-blocking log failure
    }

    res.json({ success: true, message: 'Deletion request rejected', data: item });
  } catch {
    res.status(503).json({ success: false, message: 'Could not reject deletion request' });
  }
});

// Handler for completing a deletion request (executing anonymization)
const handleCompleteDeletion = async (req, res) => {
  try {
    const item = await DeletionRequest.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Deletion request not found' });
    }
    if (!['approved', 'reviewed'].includes(item.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete request with status "${item.status}". Request must be approved first.`
      });
    }

    const operator = getOperator(req);

    // Execute the anonymization process
    const anonymizeResult = await anonymizeUserData(item.userId, {
      performedBy: operator,
      targetEmail: item.email,
      requestId: item._id,
      ip: req.ip
    });

    item.status = 'completed';
    item.completedBy = operator;
    item.completedAt = new Date();
    item.anonymizedSummary = anonymizeResult;
    if (typeof req.body.notes === 'string') {
      item.notes = req.body.notes.trim();
    }
    await item.save();

    res.json({
      success: true,
      message: 'Deletion request completed: user data anonymized and legal order records sanitized.',
      data: item
    });
  } catch (err) {
    console.error('Error completing deletion request:', err);
    res.status(503).json({ success: false, message: 'Could not complete deletion request' });
  }
};

router.post('/deletion-requests/:id/complete', authRequired, adminOnly, databaseRequired, handleCompleteDeletion);
router.patch('/deletion-requests/:id/complete', authRequired, adminOnly, databaseRequired, handleCompleteDeletion);

// GET /admin/audit-logs - List audit logs
router.get('/audit-logs', authRequired, adminOnly, databaseRequired, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action && typeof req.query.action === 'string' && req.query.action.trim() && req.query.action !== 'ALL') {
      filter.action = req.query.action.trim();
    }
    if (req.query.targetUserId) {
      filter.targetUserId = req.query.targetUserId;
    }

    let query = AuditLog.find(filter).sort({ createdAt: -1 });
    if (typeof query.skip === 'function') query = query.skip(skip);
    if (typeof query.limit === 'function') query = query.limit(limit);

    let total = 0;
    if (mongoose.connection.db && typeof AuditLog.countDocuments === 'function') {
      try {
        total = await AuditLog.countDocuments(filter);
      } catch {
        total = 0;
      }
    }

    const data = await query.lean();
    if (!total && Array.isArray(data)) {
      total = data.length;
    }

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch {
    res.status(503).json({ success: false, message: 'Could not load audit logs' });
  }
});

export default router;

