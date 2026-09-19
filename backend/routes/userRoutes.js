import express from 'express';
import mongoose from 'mongoose';
import { User } from '../services/userStore.js';
import Order from '../models/Order.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const fields = '_id name email role tier createdAt';
router.use(authRequired, adminOnly);
router.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'Member database unavailable' });
  next();
});
router.get('/', async (req, res) => {
  try {
    const [users, totals] = await Promise.all([
      User.find({}).select(fields).sort({ createdAt: -1 }).lean(),
      Order.aggregate([
        { $match: { userId: { $ne: null }, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$userId', ordersCount: { $sum: 1 }, totalSpent: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } } } }
      ])
    ]);
    const byUser = new Map(totals.map(({ _id, ...total }) => [_id, total]));
    res.json({ success: true, data: users.map(user => ({ ...user, id: user._id, ordersCount: 0, totalSpent: 0, ...byUser.get(user._id) })) });
  } catch {
    res.status(503).json({ success: false, message: 'Could not load members' });
  }
});
router.put('/:id', async (req, res) => {
  const { tier, ...extra } = req.body;
  if (Object.keys(extra).length || !['Regular Member', 'VIP Connoisseur'].includes(tier)) {
    return res.status(400).json({ success: false, message: 'Only a valid membership tier can be updated' });
  }
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { tier } }, { new: true, runValidators: true }).select(fields).lean();
    if (!user) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: { ...user, id: user._id } });
  } catch {
    res.status(503).json({ success: false, message: 'Could not update member' });
  }
});
export default router;
