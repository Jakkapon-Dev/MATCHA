import express from 'express';
import * as productController from '../controllers/productController.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public Catalog Endpoints
router.get('/categories', productController.getCategories);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);

// Protected Admin Garment Management Endpoints
router.post('/products', authRequired, adminOnly, productController.createProduct);
router.put('/products/:id', authRequired, adminOnly, productController.updateProduct);
router.delete('/products/:id', authRequired, adminOnly, productController.deleteProduct);

export default router;
