import express from 'express';
import { authRequired, adminOnly } from '../middleware/auth.js';
import { requireDbReady } from '../middleware/dbGuard.js';
import * as couponController from '../controllers/couponController.js';

const router = express.Router();
const databaseRequired = requireDbReady;

export { couponStatus } from '../controllers/couponController.js';

// Public Quote Endpoint
router.post('/coupons/quote', couponController.quoteLimiter, couponController.quoteCouponHandler);

// Admin Coupon Management Endpoints
router.get('/admin/coupons', authRequired, adminOnly, databaseRequired, couponController.getAdminCoupons);
router.post('/admin/coupons', authRequired, adminOnly, databaseRequired, couponController.createAdminCoupon);
router.put('/admin/coupons/:id', authRequired, adminOnly, databaseRequired, couponController.updateAdminCoupon);
router.patch('/admin/coupons/:id/status', authRequired, adminOnly, databaseRequired, couponController.updateAdminCouponStatus);

export default router;
