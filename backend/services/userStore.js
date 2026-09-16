// Simple JSON-file user store so the auth demo runs without a database.
// Swap this module for a MongoDB store once the backend grows a real database.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const STORE_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(STORE_DIR, 'users.json');

let users = [];

function load() {
  try {
    users = fs.existsSync(STORE_FILE) ? JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) : [];
  } catch (err) {
    console.error('[userStore] Failed to read users.json, starting with an empty store:', err.message);
    users = [];
  }
}

function persist() {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(users, null, 2));
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function findByEmail(email) {
  return users.find((u) => u.email === normalizeEmail(email)) || null;
}

function findById(id) {
  return users.find((u) => u._id === id) || null;
}

function createUser({ name, firstName, lastName, email, passwordHash, role = 'Member', tier = 'Regular Member' }) {
  const user = {
    _id: `u_${crypto.randomUUID().replace(/-/g, '')}`,
    name,
    firstName: firstName || '',
    lastName: lastName || '',
    email: normalizeEmail(email),
    passwordHash,
    role,
    tier,
    addresses: [],
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  persist();
  return user;
}

function ensureAdminSeed(bcrypt, adminPassword) {
  if (findByEmail('admin@matcha.com')) return null;
  const passwordHash = bcrypt.hashSync(adminPassword, 12);
  const admin = createUser({
    name: 'MatchA Admin',
    firstName: 'MatchA',
    lastName: 'Admin',
    email: 'admin@matcha.com',
    passwordHash,
    role: 'Admin',
    tier: 'VIP Connoisseur',
  });
  console.log('[auth] Seeded admin account: admin@matcha.com');
  return admin;
}

function init(opts = {}) {
  load();
  if (opts.bcrypt) {
    ensureAdminSeed(opts.bcrypt, opts.adminPassword || 'admin1234');
  }
}

module.exports = { init, findByEmail, findById, createUser };