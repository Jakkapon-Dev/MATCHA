// Auth middleware: verify the JWT and attach the matching user to the request.
// Authorization: Bearer <token>  →  jwt.verify  →  req.user
const jwt = require('jsonwebtoken');
const { findById } = require('../services/userStore');

const getJwtSecret = () => process.env.JWT_SECRET || 'matcha-dev-secret-change-me';

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const payload = jwt.verify(token, getJwtSecret());
    const user = findById(payload.id);
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

module.exports = { requireAuth, requireRole, getJwtSecret };