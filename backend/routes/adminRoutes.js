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
for (const [path, Model] of [['products', Product], ['orders', Order]]) {
  router.get(`/${path}`, authRequired, adminOnly, databaseRequired, async (req, res) => {
    try {
      const data = await Model.find({}).sort({ createdAt: -1 }).lean();
      res.json({ success: true, data });
    } catch {
      res.status(503).json({ success: false, message: `Could not load ${path}` });
    }
  });
}
export default router;
