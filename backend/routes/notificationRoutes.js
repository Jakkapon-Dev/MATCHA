import express from 'express';
import { authRequired, adminOnly } from '../middleware/auth.js';
import * as notificationController from '../controllers/notificationController.js';

export { memoryNotifications, isMemoryFallbackAllowed } from '../services/notificationStore.js';

const router = express.Router();

// All notification routes require Admin authentication
router.use(authRequired, adminOnly);

// Admin Notifications API
router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markOneRead);

export default router;
