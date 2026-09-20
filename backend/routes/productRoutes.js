import express from 'express';
import rateLimit from 'express-rate-limit';
import * as productController from '../controllers/productController.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = express.Router();

/* The catalogue is the heaviest thing this API hands out and the only heavy
   thing it hands to anyone who asks: a full listing is around 96 KB before
   compression, and nothing else on these three routes asks the caller who they
   are.

   The ceiling is set well above a person browsing. Opening the catalogue,
   filtering it a few times and reading a dozen garments is a handful of
   requests a minute; 300 in five minutes leaves that untouched while stopping
   a script from sitting on the endpoint. Orders are limited far harder (20 a
   quarter of an hour) because placing one is a write — reads only need to stop
   the shop being used as someone else's bandwidth. */
const catalogLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'เปิดดูสินค้าถี่เกินไป กรุณารอสักครู่แล้วลองใหม่' },
});

// Public Catalog Endpoints
router.get('/categories', catalogLimiter, productController.getCategories);
router.get('/products', catalogLimiter, productController.getProducts);
router.get('/products/:id', catalogLimiter, productController.getProductById);

// Protected Admin Garment Management Endpoints
router.post('/products', authRequired, adminOnly, productController.createProduct);
router.put('/products/:id', authRequired, adminOnly, productController.updateProduct);
router.delete('/products/:id', authRequired, adminOnly, productController.deleteProduct);

export default router;
