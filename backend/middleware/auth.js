// Auth middleware: verify the JWT and attach the matching user to the request.
// Authorization: Bearer <token>  →  jwt.verify  →  req.user
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { findById } from '../services/userStore.js';
import User from '../models/User.js';

export const getJwtSecret = () => process.env.JWT_SECRET || 'matcha-dev-secret-change-me';

// 1. ใส่ async และ await ป้องกัน Promise Bug
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const payload = jwt.verify(token, getJwtSecret());
    
    // ดักให้รองรับทั้ง id, userId, _id
    const userId = payload.id || payload.userId || payload._id;
    let user = null;

    // 1.1 ลองค้นหาจาก Mongoose User model ก่อน (ถ้ามี)
    try {
      const UserModel = mongoose.models.User || User;
      if (UserModel?.findById) {
        const doc = await UserModel.findById(userId);
        if (doc) user = typeof doc.select === 'function' ? await doc.select('+role') : doc;
      }
    } catch {}

    // 1.2 ถ้าไม่พบ ลองค้นหาจาก JSON userStore
    if (!user) {
      user = await findById(userId);
    }

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
