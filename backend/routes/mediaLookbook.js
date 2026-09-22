import express from 'express';
import lookbookRoutes from './lookbookRoutes.js';
import mediaRoutes from './mediaRoutes.js';
import errorHandler from '../middleware/errorHandler.js';

const router = express.Router();

router.use(lookbookRoutes);
router.use(mediaRoutes);
router.use(errorHandler);

export default router;
