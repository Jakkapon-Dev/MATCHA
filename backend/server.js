import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is resolved regardless of working directory
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

import dns from 'node:dns';

// Windows / Node.js c-ares DNS SRV lookup fix for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';

import {
  parseMongoDatabaseName,
  parseMongoHostname,
  isDatabaseNameSafe,
  isHostnameSafe
} from './services/mongoSafetyGuard.js';

import { isDemo } from './config/storeMode.js';
import { init as initUserStore } from './services/userStore.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import productRoutes from './routes/productRoutes.js';
import lookbookRoutes from './routes/lookbookRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
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

/* Who may call this API from a browser.

   `origin: true` echoed back whatever Origin arrived and allowed credentials
   with it, so any site could make credentialed cross-origin calls. The token
   lives in localStorage rather than a cookie, so it is not attached
   automatically and the exposure was narrower than it looks — but the setting
   was wider than anything here needs.

   Development allows any localhost port rather than a fixed list: Vite picks
   the next free port when its default is taken, and this project has already
   run on both 5173 and 5178, so a hardcoded list locks the developer out of
   their own API. Production takes an explicit list from the environment.

   A request with no Origin — curl, a server-to-server call, a health check —
   is not a browser cross-origin request and is left alone. */
const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const originEntries = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

/* An entry may carry a `*`, which stands for one label of the hostname and
   never crosses a dot. Vercel gives every preview deployment a fresh hostname
   — matcha-<hash>-<account>.vercel.app — so a preview can never be listed in
   advance, and without this the whole preview flow loses the API.

   `*` deliberately does not match a dot. `https://*-acme.vercel.app` admits
   matcha-abc123-acme.vercel.app and refuses evil.com-acme.vercel.app, which a
   looser pattern would wave through. Scope each entry to the account or
   project that owns the deployments; a bare `https://*.vercel.app` would hand
   the API to anyone who can deploy on Vercel, which is everyone. */
/* Matched without a regular expression, so there is no escaping to get wrong
   and the rule can be read off the code: the origin must begin with the part
   before the `*`, end with the part after it, and whatever the `*` stands for
   must not contain a dot.

   That last condition is the load-bearing one. Without it
   `https://*-acme.vercel.app` would also admit
   https://evil.com-acme.vercel.app. */
const wildcardMatcher = (entry) => {
  const [prefix, suffix] = entry.split('*');
  return (origin) => {
    if (origin.length < prefix.length + suffix.length) return false;
    if (!origin.startsWith(prefix) || !origin.endsWith(suffix)) return false;
    const middle = origin.slice(prefix.length, origin.length - suffix.length);
    return !middle.includes('.');
  };
};

const originMatchers = originEntries.map((entry) => (
  entry.includes('*') ? wildcardMatcher(entry) : (origin) => origin === entry
));

const allowedOrigins = originEntries;

/* An empty allowlist means nobody configured one, not that nobody is allowed.

   Refusing every browser origin in that case does not harden the deployment,
   it switches the product off: this shipped to production with neither
   CORS_ORIGINS nor FRONTEND_URL set on the host, and every request from the
   live storefront came back 403 with no Access-Control-Allow-Origin. The site
   rendered and could not load a single thing.

   So the allowlist applies when there is one, and when there is not the server
   says so loudly at boot and keeps serving. Configure CORS_ORIGINS to turn the
   restriction on. */
const originsConfigured = allowedOrigins.length > 0;

if (!originsConfigured && process.env.NODE_ENV === 'production') {
  console.warn(
    '[cors] No CORS_ORIGINS or FRONTEND_URL set. Every origin is being allowed. ' +
    'Set CORS_ORIGINS to a comma-separated list of storefront URLs to restrict it.'
  );
}

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (!originsConfigured) return true;
  if (originMatchers.some((matches) => matches(origin))) return true;
  return process.env.NODE_ENV !== 'production' && LOCALHOST.test(origin);
};

// Middleware

/* Response headers the browser enforces on our behalf: nosniff, a referrer
   policy, frame denial, HSTS in production.

   Two of helmet's defaults are turned off rather than accepted.

   `contentSecurityPolicy` describes what an HTML document may load. This
   process serves JSON and image files and renders no markup, so the default
   policy protects nothing here while being one more thing that can surprise
   somebody later.

   `crossOriginResourcePolicy` defaults to same-origin, which would stop the
   catalogue images under /api/media/files from rendering on the shop's own
   origin. routes/mediaRoutes.js already sets that header to cross-origin
   deliberately, and says why; leaving it off here keeps that decision in one
   place instead of depending on which middleware runs last. */
/* Render terminates TLS at its own proxy and forwards the request over the
   loopback, so without this every request looks like it came from that proxy:
   req.ip is the same address for everybody. express-rate-limit keys on req.ip,
   which turns all five limiters in this codebase from per-visitor into
   per-deployment -- authLimiter's 30 attempts per 15 minutes would be 30 for
   the entire shop, and the 31st person to sign in gets a 429 for something
   somebody else did. It also logs ERR_ERL_UNEXPECTED_X_FORWARDED_FOR to say so.

   The value is 1, not true. `true` trusts the leftmost hop named in
   X-Forwarded-For, and that entry is whatever the client wrote, so anyone
   could rotate the header and never meet a limit. `1` counts one proxy in
   from the connection -- Render's -- and ignores what the client claims.
   Behind a second proxy this number has to go up with it. */
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));

// Product listings are the largest thing this API returns and they are almost
// all repeated text, so they compress well.
app.use(compression());

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    // A refused origin is a policy decision, not a server fault. errorHandler
    // honours error.status, so say 403 rather than letting it fall through
    // to a 500 that reads as something broken here.
    const denied = new Error(`Origin not allowed by CORS: ${origin}`);
    denied.status = 403;
    return callback(denied);
  },
  credentials: true,
}));
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

// Health check endpoint (verifies API and active MongoDB connectivity without leaking secrets)
app.get(['/api/health', '/health'], async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  let dbHealthy = false;

  if (isDbConnected && mongoose.connection.db) {
    try {
      await mongoose.connection.db.admin().ping();
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }
  }

  const isHealthy = isDbConnected && dbHealthy;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'degraded',
    state: isHealthy ? 'online' : 'unhealthy',
    message: isHealthy
      ? 'Backend API and database are operating normally'
      : 'Service degraded: Database connection unavailable',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    checks: {
      api: 'healthy',
      database: dbHealthy ? 'connected' : 'disconnected'
    }
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


// Modular Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/notifications', notificationRoutes);
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

// MongoDB Connection with strict Test Environment Guard
let mongoUriToConnect = null;
const isTestMode = process.env.NODE_ENV === 'test' || process.env.IS_E2E === 'true';

if (isTestMode) {
  const testUri = process.env.TEST_MONGODB_URI;
  if (!testUri || !testUri.trim()) {
    const errMsg = '❌ [MongoDB] TEST_MONGODB_URI is required when running in test mode (NODE_ENV=test or IS_E2E=true). Fallback to MONGODB_URI is strictly blocked to protect production/development data.';
    console.error(errMsg);
    throw new Error('TEST_MONGODB_URI must be provided when running in test mode');
  }

  const dbName = parseMongoDatabaseName(testUri);
  const hostname = parseMongoHostname(testUri);
  const dbCheck = isDatabaseNameSafe(dbName);
  const hostCheck = isHostnameSafe(hostname);

  if (!hostCheck.safe) {
    const errMsg = `❌ [MongoDB] Target hostname "${hostname}" is unsafe: ${hostCheck.reason}`;
    console.error(errMsg);
    throw new Error(hostCheck.reason);
  }
  if (!dbCheck.safe) {
    const errMsg = `❌ [MongoDB] Target database "${dbName}" is unsafe: ${dbCheck.reason}`;
    console.error(errMsg);
    throw new Error(dbCheck.reason);
  }

  mongoUriToConnect = testUri.trim();
  console.log(`🧪 [MongoDB] Operating in TEST mode. Target Database: "${dbName}"`);
} else {
  mongoUriToConnect = process.env.MONGODB_URI;
}

if (isMain && mongoUriToConnect) {
  mongoose.connect(mongoUriToConnect)
    .then(async () => {
      console.log(`🍃 [MongoDB] Connected successfully to database: "${mongoose.connection.name}"`);
      /* Seeding moved here from above the route registration. Accounts live in
         Mongo now, so seeding before the connection opened would have had
         nothing to write to. */
      try {
        await initUserStore({ adminPassword: process.env.ADMIN_SEED_PASSWORD });
      } catch (err) {
        console.error('[auth] Admin seed skipped:', err.message);
      }
    })
    .catch(err => console.error('❌ [MongoDB] Connection error:', err.message));
}

if (isMain) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  });
}

export default app;
export { app };
