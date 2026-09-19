// Auth middleware: verify the JWT and attach the matching user to the request.
// Authorization: Bearer <token>  →  jwt.verify  →  req.user
import jwt from 'jsonwebtoken';
import { findById } from '../services/userStore.js';

import { isDemo } from '../config/storeMode.js';

export const getJwtSecret = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable must be explicitly configured in production environment.');
  }
  return process.env.JWT_SECRET || 'matcha-dev-secret-change-me';
};

// 1. ใส่ async และ await ป้องกัน Promise Bug
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  // รองรับ 1-Click Demo Admin ในโหมด Demo โดยไม่ลดความปลอดภัยบน Production
  if (isDemo && token === 'demo-offline-token') {
    req.user = {
      _id: 'demo-admin',
      id: 'demo-admin',
      name: 'Demo Admin',
      email: 'admin@matcha.com',
      role: 'Admin',
      tier: 'System Admin',
      isDemoSession: true
    };
    return next();
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    
    // ดักให้รองรับทั้ง id, userId, _id
    const userId = payload.id || payload.userId || payload._id;

    /* One lookup, one store. This used to try models/User.js first and fall
       back to the JSON store, with the Mongo attempt wrapped in an empty catch
       — and the ids in these tokens are `u_…` strings, which findById could
       only reject, silently, on every single request. The two stores disagreed
       on what a user id was, and that disagreement is what detached carts,
       orders and uploaded media from their owners. There is one store now. */
    let user = await findById(userId);

    // 1.3 ถ้ายังไม่พบแต่ Token ผ่านการยืนยันลายเซ็นแล้ว ให้ใช้ identity จาก Payload
    if (!user && (payload.role || payload.email)) {
      user = { _id: userId, id: userId, email: payload.email, role: payload.role };
    }
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Use after requireAuth: block anyone who is not the given role (case-insensitive)
export function requireRole(...roles) {
  const expected = roles.flat().map(r => String(r).toLowerCase());
  return (req, res, next) => {
    const userRole = String(req.user?.role || '').toLowerCase();
    if (!req.user || !expected.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// 2. กำหนด Alias ให้เข้ากับ Route อื่นๆ ในโปรเจกต์
export const authRequired = requireAuth;
export const adminOnly = requireRole('Admin', 'admin');

export default { 
  requireAuth, 
  requireRole, 
  getJwtSecret,
  authRequired,
  adminOnly 
};
