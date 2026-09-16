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
app.use(cors({ origin: '*', credentials: true }));
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

// Modular Feature Routes (Lookbook & Media Management)
app.use('/api', require('./routes/lookbookRoutes'));
app.use('/api', require('./routes/mediaRoutes'));

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
