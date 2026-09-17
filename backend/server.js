import 'dotenv/config';
import dns from 'node:dns';

// Windows / Node.js c-ares DNS SRV lookup fix for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isDemo, demoProduct } from './config/storeMode.js';
import productsData from './data/products.js';
import Product from './models/Product.js';
import { init as initUserStore } from './services/userStore.js';
import authRoutes from './routes/auth.js';
import lookbookRoutes from './routes/lookbookRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Request Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'direct'}`);
  next();
});

// Root endpoint info
app.get('/', (req, res) => {
  res.json({
    app: 'MatchA API Server',
    status: 'online',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    message: 'Backend API is running.',
    endpoints: ['/api/health', '/api/lookbooks', '/api/admin/lookbooks', '/api/admin/media']
  });
});

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    state: 'online',
    message: 'Backend server is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Store Config
app.get('/api/store-config', (req, res) => res.json({ success: true, data: { mode: isDemo ? 'demo' : 'live', realPayments: false } }));

// Auth system: JSON-file user store (seeds admin@matcha.com on first start)
// + JWT routes mounted at /api/auth. See routes/auth.js and middleware/auth.js.
initUserStore({ bcrypt, adminPassword: process.env.ADMIN_SEED_PASSWORD });

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Modular Feature Routes (Lookbook & Media Management)
app.use('/api', lookbookRoutes);
app.use('/api', mediaRoutes);

// Sample Starter API endpoint
app.get('/api/items', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Starter Item 1', description: 'Sample data item 1' },
      { id: 2, name: 'Starter Item 2', description: 'Sample data item 2' }
    ]
  });
});

// Standard Display Names for Categories
const CATEGORY_NAMES = {
  ALL: 'All Products',
  Tops: 'Tops & Knitwear',
  Bottoms: 'Bottoms & Denim',
  Outerwear: 'Outerwear & Coats',
  Shoes: 'Shoes & Footwear',
  Accessories: 'Accessories & Bags'
};

// Categories list with counts (Atlas Connected + Fallback)
app.get('/api/categories', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const counts = await Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);
      const totalCount = await Product.countDocuments();
      const countMap = {};
      counts.forEach(c => {
        if (c._id) countMap[c._id] = c.count;
      });

      const categoryOrder = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];
      const categories = [
        { id: 'ALL', name: 'All Products', count: totalCount }
      ];

      for (const id of categoryOrder) {
        if (countMap[id] !== undefined) {
          categories.push({
            id,
            name: CATEGORY_NAMES[id] || id,
            count: countMap[id]
          });
        }
      }

      for (const [catId, count] of Object.entries(countMap)) {
        if (!categoryOrder.includes(catId) && catId !== 'ALL') {
          categories.push({
            id: catId,
            name: CATEGORY_NAMES[catId] || catId,
            count
          });
        }
      }

      return res.json({ success: true, data: categories });
    }
  } catch (err) {
    console.warn('MongoDB categories query error, using static fallback:', err.message);
  }

  // Safe fallback to static productsData
  const categoryCounts = productsData.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const categories = [
    { id: 'ALL', name: 'All Products', count: productsData.length },
    { id: 'Tops', name: 'Tops & Knitwear', count: categoryCounts['Tops'] || 0 },
    { id: 'Bottoms', name: 'Bottoms & Denim', count: categoryCounts['Bottoms'] || 0 },
    { id: 'Outerwear', name: 'Outerwear & Coats', count: categoryCounts['Outerwear'] || 0 },
    { id: 'Shoes', name: 'Shoes & Footwear', count: categoryCounts['Shoes'] || 0 },
    { id: 'Accessories', name: 'Accessories & Bags', count: categoryCounts['Accessories'] || 0 }
  ];

  res.json({ success: true, data: categories });
});

// Full Catalog API with search, category, sort, price, inStock, and pagination (Atlas Connected + Fallback)
app.get('/api/products', async (req, res) => {
  try {
    let {
      category = 'ALL',
      season = 'ALL',
      search = '',
      sort = 'featured',
      color = '',
      fit = '',
      inStockOnly = 'false',
      minPrice = 0,
      maxPrice = 1000,
      page = 1,
      limit = 24
    } = req.query;

    if (mongoose.connection.readyState === 1) {
      const filter = {};

      if (category && category !== 'ALL') {
        filter.category = new RegExp(`^${category.trim()}$`, 'i');
      }

      if (season && season !== 'ALL') {
        filter.season = new RegExp(`^${season.trim()}$`, 'i');
      }

      if (search && search.trim()) {
        const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escaped, 'i');
        filter.$or = [
          { name: searchRegex },
          { id: searchRegex },
          { sku: searchRegex },
          { description: searchRegex },
          { color: searchRegex },
          { tag: searchRegex }
        ];
      }

      if (color && color !== 'ALL') {
        filter.color = new RegExp(`^${color.trim()}$`, 'i');
      }

      if (fit && fit !== 'ALL') {
        filter.fit = new RegExp(`^${fit.trim()}$`, 'i');
      }

      if (inStockOnly === 'true' || inStockOnly === true) {
        filter.inStock = true;
      }

      const minP = parseFloat(minPrice) || 0;
      const maxP = parseFloat(maxPrice) || 1000;
      filter.price = { $gte: minP, $lte: maxP };

      let sortObj = {};
      switch (sort) {
        case 'price-asc':
          sortObj = { price: 1 };
          break;
        case 'price-desc':
          sortObj = { price: -1 };
          break;
        case 'newest':
          sortObj = { createdAt: -1, _id: -1 };
          break;
        case 'rating':
          sortObj = { rating: -1, _id: -1 };
          break;
        case 'featured':
        default:
          sortObj = { isFeatured: -1, createdAt: -1, _id: -1 };
          break;
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 24);
      const skip = (pageNum - 1) * limitNum;

      const [totalItems, paginatedProducts, stats] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
        Product.aggregate([
          {
            $group: {
              _id: null,
              minPrice: { $min: '$price' },
              maxPrice: { $max: '$price' },
              totalAll: { $sum: 1 }
            }
          }
        ])
      ]);

      const totalPages = Math.ceil(totalItems / limitNum) || 1;
      const priceStats = stats[0] || { minPrice: 0, maxPrice: 1000, totalAll: totalItems };

      return res.json({
        success: true,
        data: paginatedProducts,
        pagination: {
          total: totalItems,
          page: pageNum,
          totalPages,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        availableFilters: {
          totalAll: priceStats.totalAll,
          priceMin: priceStats.minPrice,
          priceMax: priceStats.maxPrice
        }
      });
    }

    // Fallback: Local array filtering when MongoDB is offline
    let filtered = [...productsData];

    // 1. Category Filter
    if (category && category !== 'ALL') {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // 2. Season Filter
    if (season && season !== 'ALL') {
      filtered = filtered.filter(p => p.season && p.season.toLowerCase() === season.toLowerCase());
    }

    // 2. Search Query (Name, ID, Description, Color, Fit)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        (p.tag && p.tag.toLowerCase().includes(q))
      );
    }

    // 3. Color Filter
    if (color && color !== 'ALL') {
      filtered = filtered.filter(p => p.color.toLowerCase().includes(color.toLowerCase()));
    }

    // 4. Fit Filter
    if (fit && fit !== 'ALL') {
      filtered = filtered.filter(p => p.fit && p.fit.toLowerCase().includes(fit.toLowerCase()));
    }

    // 5. In-Stock Only Filter
    if (inStockOnly === 'true' || inStockOnly === true) {
      filtered = filtered.filter(p => p.inStock);
    }

    // 6. Price Range Filter
    const minP = parseFloat(minPrice) || 0;
    const maxP = parseFloat(maxPrice) || 1000;
    filtered = filtered.filter(p => p.price >= minP && p.price <= maxP);

    // 7. Sorting
    switch (sort) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    // 8. Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedProducts = filtered.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        total: totalItems,
        page: pageNum,
        totalPages,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      availableFilters: {
        totalAll: productsData.length,
        priceMin: Math.min(...productsData.map(p => p.price)),
        priceMax: Math.max(...productsData.map(p => p.price))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve products' });
  }
});

// Single Product Detail API
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      const isOid = mongoose.Types.ObjectId.isValid(id);
      const doc = await Product.findOne({
        $or: [
          { id: id },
          { sku: id.toUpperCase() },
          ...(isOid ? [{ _id: id }] : [])
        ]
      }).lean();

      if (doc) {
        return res.json({ success: true, data: doc });
      }
    }

    const localItem = productsData.find(p => p.id === id || p.sku === id);
    if (localItem) {
      return res.json({ success: true, data: localItem });
    }

    res.status(404).json({ success: false, message: `Product ${id} not found` });
  } catch (err) {
    console.error(`Error fetching product ${req.params.id}:`, err);
    res.status(500).json({ success: false, message: 'Failed to retrieve product' });
  }
});

// Create Garment (Admin)
app.post('/api/products', async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.id && !data.sku) {
      data.id = `PROD-${Date.now().toString().slice(-6)}`;
    }
    if (data.stock !== undefined && data.quantity === undefined) {
      data.quantity = data.stock;
    }
    if (mongoose.connection.readyState === 1) {
      const product = new Product(data);
      const saved = await product.save();
      return res.status(201).json({ success: true, data: saved });
    }
    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update Garment (Admin)
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.stock !== undefined && updates.quantity === undefined) {
      updates.quantity = updates.stock;
    }
    if (mongoose.connection.readyState === 1) {
      const isOid = mongoose.Types.ObjectId.isValid(id);
      const updated = await Product.findOneAndUpdate(
        {
          $or: [
            { id: id },
            { sku: id.toUpperCase() },
            ...(isOid ? [{ _id: id }] : [])
          ]
        },
        { $set: updates },
        { new: true }
      );
      if (updated) {
        return res.json({ success: true, data: updated });
      }
    }
    res.json({ success: true, data: { id, ...updates } });
  } catch (err) {
    console.error(`Error updating product ${req.params.id}:`, err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete Garment (Admin)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      const isOid = mongoose.Types.ObjectId.isValid(id);
      await Product.findOneAndDelete({
        $or: [
          { id: id },
          { sku: id.toUpperCase() },
          ...(isOid ? [{ _id: id }] : [])
        ]
      });
    }
    res.json({ success: true, message: `Product ${id} deleted successfully` });
  } catch (err) {
    console.error(`Error deleting product ${req.params.id}:`, err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// 404 Route Handler for unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot GET ${req.originalUrl}. Route not found on API server.`,
    availableRoutes: ['/api/health', '/api/lookbooks', '/api/admin/lookbooks', '/api/admin/media']
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Error handling fallback
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

const isMain = process.argv[1] && path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();

// MongoDB Non-blocking Connection
if (isMain && process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🍃 [MongoDB] Connected successfully!'))
    .catch(err => console.error('❌ [MongoDB] Connection error:', err.message));
}

if (isMain) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  });
}

export default app;
export { app };
