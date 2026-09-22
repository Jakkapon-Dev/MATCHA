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

    // A valid signature is not proof that the account still exists. The
    // database lookup is the revocation check, so never authorise from stale
    // role/email claims when the member has been deleted (or is unavailable).
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    /* A token minted before the password changed is spent.

       Resetting a password is usually an attempt to get someone else out, and
       a JWT cannot be recalled. Comparing the token's own issue time against
       the moment the password changed is what actually ends those sessions.
       `iat` is in seconds; the stored moment is a Date. A second of slack
       covers the case where both happen inside the same second, which would
       otherwise sign the customer out of the session they just reset from. */
    if (user.passwordChangedAt && payload.iat) {
      const issuedAt = payload.iat * 1000;
      if (issuedAt + 1000 < new Date(user.passwordChangedAt).getTime()) {
        return res.status(401).json({ success: false, message: 'Session ended by a password change' });
      }
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

// Blocks critical mutations if the user registered with Firebase password but has not verified email
export function requireVerifiedEmail(req, res, next) {
  if (req.user && req.user.emailVerified === false) {
    return res.status(403).json({
      success: false,
      code: 'EMAIL_NOT_VERIFIED',
      message: 'กรุณายืนยันที่อยู่อีเมลของคุณก่อนดำเนินการนี้',
    });
  }
  next();
}

export default { 
  requireAuth, 
  requireRole, 
  getJwtSecret,
  authRequired,
  adminOnly,
  requireVerifiedEmail,
};
