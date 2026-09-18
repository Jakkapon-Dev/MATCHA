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

import { isDemo } from './config/storeMode.js';
import { init as initUserStore } from './services/userStore.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/productRoutes.js';
import lookbookRoutes from './routes/lookbookRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import errorHandler from './middleware/errorHandler.js';

// Process-level Safety Guards to prevent unexpected crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 [Process] Uncaught Exception:', err.message);
});

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
    endpoints: [
      '/api/health',
      '/api/products',
      '/api/categories',
      '/api/lookbooks',
      '/api/admin/lookbooks',
      '/api/admin/media'
    ]
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

// Store Configuration Endpoint
app.get('/api/store-config', (req, res) => {
  res.json({
    success: true,
    data: {
      mode: isDemo ? 'demo' : 'live',
      realPayments: false
    }
  });
});

// Auth system: JSON-file user store (seeds admin@matcha.com on first start)
initUserStore({ bcrypt, adminPassword: process.env.ADMIN_SEED_PASSWORD });

// Modular Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api', productRoutes);
app.use('/api', lookbookRoutes);
app.use('/api', mediaRoutes);

// 404 Route Handler for unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}. Route not found on API server.`,
    availableRoutes: [
      '/api/health',
      '/api/products',
      '/api/categories',
      '/api/lookbooks',
      '/api/admin/lookbooks',
      '/api/admin/media'
    ]
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

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
