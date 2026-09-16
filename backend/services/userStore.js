const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs'); // require เข้ามาโดยตรงเพื่อ auto-seed ได้เอง

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
  return users.find((u) => u._id === id || u.id === id) || null;
}

function createUser({ name, firstName, lastName, email, passwordHash, role = 'Member', tier = 'Regular Member' }) {
  const user = {
    _id: `u_${crypto.randomUUID().replace(/-/g, '')}`,
    id: undefined, // ให้ fallback ใช้ _id
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
  user.id = user._id;
  users.push(user);
  persist();
  return user;
}

function ensureAdminSeed(adminPassword = 'admin1234') {
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
  console.log('[auth] Seeded admin account: admin@matcha.com (pass: ' + adminPassword + ')');
  return admin;
}

// 1. เรียก load() ทันทีที่ไฟล์นี้ถูก import
load();

// 2. ถ้ายังไม่มี admin ให้ seed ทันทีโดยไม่ต้องรอสั่ง init
ensureAdminSeed(process.env.SEED_ADMIN_PASSWORD || 'admin1234');

function init(opts = {}) {
  load();
  ensureAdminSeed(opts.adminPassword || process.env.SEED_ADMIN_PASSWORD || 'admin1234');
}

module.exports = { init, findByEmail, findById, createUser, ensureAdminSeed };
