// MatchA Auth routes — this contract matches what the existing frontend calls:
//   POST /api/auth/register -> { success, data: user, token }
//   POST /api/auth/login    -> { success, data: user, token }
//   GET  /api/auth/me       -> { success, data: user }   (requires Bearer token)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userStore = require('../services/userStore');
const { requireAuth, requireRole, getJwtSecret } = require('../middleware/auth');

const router = express.Router();

// Never leak passwordHash. The frontend reads `_id`, `name`, `email`, `role`, `tier`.
const safeUser = (u) => {
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

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ---- Register ----
router.post('/register', async (req, res) => {
  try {
    const { name, firstName, lastName, email, password } = req.body || {};
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Please provide email, password and name.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }
    if (userStore.findByEmail(email)) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = userStore.createUser({ name: fullName, firstName, lastName, email, passwordHash });
    res.status(201).json({ success: true, data: safeUser(user), token: signToken(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Login ----
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = userStore.findByEmail(email || '');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password || '', user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.json({ success: true, data: safeUser(user), token: signToken(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Who am I? (used by RequireRole on the frontend) ----
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: safeUser(req.user) });
});

// ---- Example of an authorization-protected endpoint ----
// Copy this pattern when you add real admin routes:
//   router.get('/some/admin/path', requireAuth, requireRole('Admin'), handler)
router.get('/admin/check', requireAuth, requireRole('Admin'), (req, res) => {
  res.json({ success: true, data: { id: req.user._id, role: req.user.role, message: 'Admin access granted' } });
});

module.exports = router;