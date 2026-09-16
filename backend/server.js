require('dotenv').config();
const dns = require('dns');
// Windows / Node.js c-ares DNS SRV lookup fix for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { isDemo, demoProduct } = require('./config/storeMode');

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
    frontendUrl: 'http://localhost:5173',
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

const productsData = require('./data/products');

// Auth system: JSON-file user store (seeds admin@matcha.com on first start)
// + JWT routes mounted at /api/auth. See routes/auth.js and middleware/auth.js.
const bcrypt = require('bcryptjs');
const { init: initUserStore } = require('./services/userStore');
initUserStore({ bcrypt, adminPassword: process.env.ADMIN_SEED_PASSWORD });

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Modular Feature Routes (Lookbook & Media Management)
app.use('/api', require('./routes/lookbookRoutes'));
app.use('/api', require('./routes/mediaRoutes'));

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

// Categories list with counts
app.get('/api/categories', (req, res) => {
  const categoryCounts = productsData.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const categories = [
    { id: 'ALL', name: 'All Products', count: productsData.length },
    { id: 'Tops', name: 'Tops & Knitwear', count: categoryCounts['Tops'] || 0 },
    { id: 'Bottoms', name: 'Bottoms & Denim', count: categoryCounts['Bottoms'] || 0 },
    { id: 'Outerwear', name: 'Outerwear & Coats', count: categoryCounts['Outerwear'] || 0 },
    { id: 'Accessories', name: 'Accessories & Bags', count: categoryCounts['Accessories'] || 0 }
  ];

  res.json({ success: true, data: categories });
});

// Full Catalog API with search, category, sort, price, inStock, and pagination
app.get('/api/products', (req, res) => {
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
    if (inStockOnly === 'true') {
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
    const totalPages = Math.ceil(totalItems / limitNum);
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

// 404 Route Handler for unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot GET ${req.originalUrl}. Route not found on API server.`,
    availableRoutes: ['/api/health', '/api/lookbooks', '/api/admin/lookbooks', '/api/admin/media']
  });
});

// Centralized Error Handling Middleware
app.use(require('./middleware/errorHandler'));

// Error handling fallback
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// MongoDB Non-blocking Connection
if (require.main === module && process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🍃 [MongoDB] Connected successfully!'))
    .catch(err => console.error('❌ [MongoDB] Connection error:', err.message));
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
