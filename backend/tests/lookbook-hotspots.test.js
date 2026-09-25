/* Lookbook hotspots are data, kept in MongoDB and edited from the admin.
 *
 * These run against the real test database with the real auth middleware:
 * an administrator creates a look, places, moves and removes pins, and each
 * change must survive a fresh read — while a shopper, a stranger and a bad
 * payload are all turned away by the server, not merely by the editor. */
import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';

import { isDatabaseNameSafe, isHostnameSafe, parseMongoDatabaseName, parseMongoHostname } from '../services/mongoSafetyGuard.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const lookbookRoutes = (await import('../routes/lookbookRoutes.js')).default;
const Lookbook = (await import('../models/Lookbook.js')).default;
const Product = (await import('../models/Product.js')).default;
const { createUser, User } = await import('../services/userStore.js');
const { getJwtSecret } = await import('../middleware/auth.js');

const testUri = process.env.TEST_MONGODB_URI || '';
const targetIsSafe = Boolean(testUri)
  && isDatabaseNameSafe(parseMongoDatabaseName(testUri)).safe
  && isHostnameSafe(parseMongoHostname(testUri)).safe;

async function canReachTestDatabase() {
  if (!targetIsSafe) return false;
  try {
    await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5_000 });
    return true;
  } catch {
    await mongoose.disconnect().catch(() => {});
    return false;
  }
}

const databaseAvailable = await canReachTestDatabase();
const dbDescribe = databaseAvailable ? describe : describe.skip;

const TAG = `lbtest-${process.pid}-${Date.now().toString(36)}`;
const LOOK_ID = `LOOK-${TAG}`.toUpperCase();
const LEGACY_ID = `LEGACY-${TAG}`.toUpperCase();
const P1 = `${TAG}-JACKET`.toUpperCase();
const P2 = `${TAG}-TROUSER`.toUpperCase();
const HERO = '/images/location_lifestyle/urban_street/autumn/location_urban_street_autumn_standing_on_skyscraper_roo_001.jpeg';

let server;
let base;
let adminHeaders;
let memberHeaders;
const userIds = [];

const call = (method, path, headers = {}, body) => fetch(`${base}${path}`, {
  method,
  headers: { 'Content-Type': 'application/json', ...headers },
  ...(body ? { body: JSON.stringify(body) } : {})
});

async function tokenFor(role) {
  const user = await createUser({
    name: `${role} ${TAG}`,
    email: `${role.toLowerCase()}-${TAG}@matcha-test.internal`,
    passwordHash: crypto.randomBytes(16).toString('hex'),
    role,
    emailVerified: true
  });
  userIds.push(user._id);
  return { Authorization: `Bearer ${jwt.sign({ id: user._id, role }, getJwtSecret())}` };
}

const product = (id, name, extra = {}) => ({
  id, sku: id, name, description: 'Lookbook hotspot test garment.', price: 80, image: '/images/p.jpg',
  category: 'Outerwear', color: 'Black', sizes: ['M'], sizeStock: [{ size: 'M', stock: 3 }], ...extra
});

const lookBody = (items, revision) => ({ title: 'Hotspot test look', heroImage: HERO, published: true, revision, items });
const adminLook = async () => (await (await call('GET', '/api/admin/lookbooks', adminHeaders)).json()).data.find(l => l.id === LOOK_ID);
const publicLook = async () => (await (await call('GET', '/api/lookbooks')).json()).data.find(l => l.id === LOOK_ID);

dbDescribe('lookbook hotspots (MongoDB)', () => {
  before(async () => {
    await Product.create([product(P1, 'Test Jacket'), product(P2, 'Test Trouser', { category: 'Bottoms' })]);
    adminHeaders = await tokenFor('Admin');
    memberHeaders = await tokenFor('Member');
    const app = express();
    app.use(express.json());
    app.use('/api', lookbookRoutes);
    await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    server?.close();
    await Lookbook.deleteMany({ id: { $in: [LOOK_ID, LEGACY_ID] } });
    await Product.deleteMany({ id: { $in: [P1, P2] } });
    await User.deleteMany({ _id: { $in: userIds } });
    await mongoose.disconnect();
  });

  it('refuses hotspot writes from anyone who is not an administrator', async () => {
    const body = lookBody([{ productId: P1, color: '', x: 40, y: 30 }], 0);
    assert.equal((await call('PUT', `/api/admin/lookbooks/${LOOK_ID}`, {}, body)).status, 401);
    assert.equal((await call('PUT', `/api/admin/lookbooks/${LOOK_ID}`, memberHeaders, body)).status, 403);
    assert.equal((await call('GET', '/api/admin/lookbooks', memberHeaders)).status, 403);
    assert.equal(await Lookbook.countDocuments({ id: LOOK_ID }), 0, 'nothing was written');
  });

  it('creates a look with two hotspots that persist and resolve to products', async () => {
    const res = await call('PUT', `/api/admin/lookbooks/${LOOK_ID}`, adminHeaders, lookBody([
      { productId: P1, color: '', x: 40, y: 30 },
      { productId: P2, color: '', x: 52.5, y: 71.2 }
    ], 0));
    assert.equal(res.status, 200);

    const saved = await adminLook();
    assert.equal(saved.revision, 1);
    assert.deepEqual(saved.items.map(i => [i.productId, i.x, i.y]), [[P1, 40, 30], [P2, 52.5, 71.2]]);

    const shown = await publicLook();
    assert.equal(shown.hotspots.length, 2);
    assert.deepEqual(shown.hotspots.map(h => [h.productId, h.x, h.y]), [[P1, '40%', '30%'], [P2, '52.5%', '71.2%']]);
    assert.ok(shown.hotspots.every(h => h.linked && h.inStock), 'each pin resolves to a sellable product');
    assert.equal(shown.hotspots[0].name, 'Test Jacket');
  });

  it('moves a hotspot and keeps the move after a fresh read', async () => {
    const res = await call('PUT', `/api/admin/lookbooks/${LOOK_ID}`, adminHeaders, lookBody([
      { productId: P1, color: '', x: 12.3, y: 45.6 },
      { productId: P2, color: '', x: 52.5, y: 71.2 }
    ], 1));
    assert.equal(res.status, 200);
    const saved = await adminLook();
    assert.equal(saved.revision, 2);
    assert.deepEqual([saved.items[0].x, saved.items[0].y], [12.3, 45.6]);
  });

  it('a stale editor cannot overwrite a newer save', async () => {
    const res = await call('PUT', `/api/admin/lookbooks/${LOOK_ID}`, adminHeaders, lookBody([{ productId: P1, color: '', x: 1, y: 1 }], 1));
    assert.equal(res.status, 409);
    assert.equal((await adminLook()).items.length, 2);
  });

  it('removes a hotspot', async () => {
    const res = await call('PUT', `/api/admin/lookbooks/${LOOK_ID}`, adminHeaders, lookBody([{ productId: P2, color: '', x: 52.5, y: 71.2 }], 2));
    assert.equal(res.status, 200);
    assert.deepEqual((await adminLook()).items.map(i => i.productId), [P2]);
    assert.equal((await publicLook()).hotspots.length, 1);
  });

  it('rejects out-of-range coordinates, unknown products and duplicates on the server', async () => {
    const bad = [
      [{ productId: P1, color: '', x: 101, y: 10 }],
      [{ productId: P1, color: '', x: 10, y: -1 }],
      [{ productId: `${TAG}-NOPE`, color: '', x: 10, y: 10 }],
      [{ productId: P1, color: '', x: 10, y: 10 }, { productId: P1, color: '', x: 20, y: 20 }],
      [{ productId: P1, color: 'Not A Colour', x: 10, y: 10 }]
    ];
    for (const items of bad) {
      const res = await call('PUT', `/api/admin/lookbooks/${LOOK_ID}`, adminHeaders, lookBody(items, 3));
      assert.equal(res.status, 400, JSON.stringify(items));
    }
    assert.equal((await adminLook()).revision, 3, 'no rejected payload changed the look');
  });

  it('a pin whose product was deleted stays visible but unsellable', async () => {
    await Product.deleteOne({ id: P2 });
    const shown = await publicLook();
    assert.equal(shown.hotspots.length, 1);
    assert.equal(shown.hotspots[0].linked, false);
    assert.equal(shown.hotspots[0].inStock, false);
  });

  it('a look stored before hotspots existed still loads', async () => {
    // Written straight to the collection so no schema default fills `items`.
    await Lookbook.collection.insertOne({ id: LEGACY_ID, title: 'Legacy look', heroImage: HERO, published: true, revision: 1, editorial: {} });
    const res = await call('GET', '/api/lookbooks');
    assert.equal(res.status, 200);
    const legacy = (await res.json()).data.find(l => l.id === LEGACY_ID);
    assert.deepEqual(legacy.hotspots, []);
  });
});
