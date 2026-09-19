import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import userStore from '../services/userStore.js';
import { requireAuth, requireRole, getJwtSecret } from '../middleware/auth.js';

const router = express.Router();

// Rate limiter for authentication attempts to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'มีการพยายามเข้าสู่ระบบถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง'
  }
});

export const safeUser = (u) => {
  if (!u) return null;
  return {
    _id: u._id,
    id: u._id,
    name: u.name,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
    tier: u.tier,
  };
};

export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ---- Register ----
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, firstName, lastName, email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide valid email and password format.' });
    }
    const fullName = (typeof name === 'string' ? name : `${firstName || ''} ${lastName || ''}`).trim();
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Please provide email, password and name.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email address format' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // 1. ใส่ await ป้องกัน Promise Truthy Bug
    const existing = await userStore.findByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // 2. ใส่ await ป้องกัน Promise ในการสร้าง User
    const user = await userStore.createUser({ 
      name: fullName, 
      firstName, 
      lastName, 
      email: cleanEmail, 
      passwordHash 
    });

    res.status(201).json({ success: true, data: safeUser(user), token: signToken(user) });
  } catch (err) {
    /* The driver's own message can carry index names, collection names or
       connection detail, and these are the two endpoints most worth probing.
       It is logged where it is useful and not returned. */
    console.error('[auth]', err);
    res.status(500).json({ success: false, message: 'การยืนยันตัวตนขัดข้อง กรุณาลองใหม่อีกครั้ง' });
  }
});

// ---- Login ----
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid credentials format' });
    }
    const cleanEmail = email.toLowerCase().trim();

    // 3. ใส่ await ในการค้นหา User
    const user = await userStore.findByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password || '', user.passwordHash || '');
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({ success: true, data: safeUser(user), token: signToken(user) });
  } catch (err) {
    /* The driver's own message can carry index names, collection names or
       connection detail, and these are the two endpoints most worth probing.
       It is logged where it is useful and not returned. */
    console.error('[auth]', err);
    res.status(500).json({ success: false, message: 'การยืนยันตัวตนขัดข้อง กรุณาลองใหม่อีกครั้ง' });
  }
});

// ---- Who am I? ----
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: safeUser(req.user) });
});

// ---- Admin Check Example ----
router.get('/admin/check', requireAuth, requireRole('Admin'), (req, res) => {
  res.json({ success: true, data: { id: req.user._id, role: req.user.role, message: 'Admin access granted' } });
});

export default router;
export { router };
