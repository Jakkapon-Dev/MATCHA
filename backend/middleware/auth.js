// Auth middleware: verify the JWT and attach the matching user to the request.
// Authorization: Bearer <token>  →  jwt.verify  →  req.user
const jwt = require('jsonwebtoken');
const { findById } = require('../services/userStore');

const getJwtSecret = () => process.env.JWT_SECRET || 'matcha-dev-secret-change-me';

// 1. ใส่ async และ await ป้องกัน Promise Bug
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const payload = jwt.verify(token, getJwtSecret());
    
    // ดักให้รองรับทั้ง id, userId, _id
    const userId = payload.id || payload.userId || payload._id;
    const user = await findById(userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Use after requireAuth: block anyone who is not the given role.
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// 2. กำหนด Alias ให้เข้ากับ Route อื่นๆ ในโปรเจกต์
const authRequired = requireAuth;
const adminOnly = requireRole('admin');

// 3. Export ทั้งแบบของเพื่อน และแบบที่ระบบเดิมใช้
module.exports = { 
  requireAuth, 
  requireRole, 
  getJwtSecret,
  authRequired, // <-- เพิ่มตัวนี้
  adminOnly     // <-- เพิ่มตัวนี้
};
