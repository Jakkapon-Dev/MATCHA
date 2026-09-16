import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(STORE_DIR, 'users.json');

let users = [];

export function load() {
  try {
    users = fs.existsSync(STORE_FILE) ? JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) : [];
  } catch (err) {
    console.error('[userStore] Failed to read users.json, starting with an empty store:', err.message);
    users = [];
  }
}

export function persist() {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(users, null, 2));
}

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

export function findByEmail(email) {
  return users.find((u) => u.email === normalizeEmail(email)) || null;
}

export function findById(id) {
  return users.find((u) => u._id === id || u.id === id) || null;
}

export function createUser({ name, firstName, lastName, email, passwordHash, role = 'Member', tier = 'Regular Member' }) {
  const user = {
    _id: `u_${crypto.randomUUID().replace(/-/g, '')}`,
    id: undefined,
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

export function ensureAdminSeed(adminPassword = 'admin1234') {
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

export function init(opts = {}) {
  load();
  ensureAdminSeed(opts.adminPassword || process.env.SEED_ADMIN_PASSWORD || 'admin1234');
}

export default { init, findByEmail, findById, createUser, ensureAdminSeed, load, persist, normalizeEmail };
