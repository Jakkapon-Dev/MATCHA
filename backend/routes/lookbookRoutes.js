import express from 'express';
import { requireDbReady } from '../middleware/dbGuard.js';
import { getAuthGuards } from '../middleware/auth.js';
import errorHandler from '../middleware/errorHandler.js';
import * as lookbookController from '../controllers/lookbookController.js';

export { allLooks, findLinkedProducts } from '../services/lookbook.js';

const authRequired = (req, res, next) => getAuthGuards().authRequired(req, res, next);
const adminOnly = (req, res, next) => getAuthGuards().adminOnly(req, res, next);

const router = express.Router();
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

// ฐานข้อมูลต้องพร้อมใช้งาน
router.use(['/lookbooks', '/admin/lookbooks'], requireDbReady);

// Public Lookbooks API
router.get('/lookbooks', asyncRoute(lookbookController.getLookbooks));

// Admin Lookbooks API
router.get('/admin/lookbooks', authRequired, adminOnly, asyncRoute(lookbookController.getAdminLookbooks));
router.put('/admin/lookbooks/:id', authRequired, adminOnly, asyncRoute(lookbookController.updateAdminLookbook));

router.use(errorHandler);

export default router;
