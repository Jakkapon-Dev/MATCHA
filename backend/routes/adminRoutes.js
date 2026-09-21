import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const databaseRequired = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'Database unavailable' });
  next();
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /admin/products with server-side pagination, search, and category/status filtering
router.get('/products', authRequired, adminOnly, databaseRequired, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
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
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const term = escapeRegex(req.query.search.trim());
      const regex = new RegExp(term, 'i');
      filter.$or = [
        { orderNumber: regex },
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
        totalPages
      }
    });
  } catch {
    res.status(503).json({ success: false, message: 'Could not load orders' });
  }
});

export default router;
