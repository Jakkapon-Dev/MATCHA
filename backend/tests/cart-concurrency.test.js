/* Cart writes that overlap must all land.

   Add The Whole Look sends one POST per garment at once, and rapid presses on
   + / − send one PUT per press. The routes used to read the cart, change it in
   memory and save it back, so overlapping requests raced: against an empty
   cart all but the first failed with E11000 and a 500, and against an existing
   cart the last save overwrote the rest. These tests fire the requests
   concurrently against a real MongoDB and require every one of them to count. */
import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';

import { isDatabaseNameSafe, isHostnameSafe, parseMongoDatabaseName, parseMongoHostname } from '../services/mongoSafetyGuard.js';

// Windows resolves the Atlas SRV record unreliably through the system servers.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const Cart = (await import('../models/Cart.js')).default;
const cartRoutes = (await import('../routes/cartRoutes.js')).default;
const { getJwtSecret } = await import('../middleware/auth.js');

const testUri = process.env.TEST_MONGODB_URI || '';
const ITERATIONS = 25;
const PREFIX = `cart-test-${process.pid}-`;

// Only ever write to a database that is plainly a test database.
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

let server;
let base;
let ownerSeq = 0;

const newUser = () => `${PREFIX}u${(ownerSeq += 1)}`;
const newGuest = () => `${PREFIX}g${(ownerSeq += 1)}`;
const memberHeaders = (userId, guestId) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${jwt.sign({ id: userId, role: 'Member' }, getJwtSecret())}`,
  ...(guestId ? { 'X-Guest-Id': guestId } : {})
});
const guestHeaders = (guestId) => ({ 'Content-Type': 'application/json', 'X-Guest-Id': guestId });

const line = (n, quantity = 1) => ({
  itemId: `SKU-${n}-M-Black`,
  productId: `SKU-${n}`,
  name: `Garment ${n}`,
  price: 10 + n,
  quantity,
  size: 'M',
  color: 'Black'
});

const call = (method, path, headers, body) => fetch(`${base}${path}`, {
  method,
  headers,
  ...(body ? { body: JSON.stringify(body) } : {})
});
const add = (headers, item) => call('POST', '/api/cart', headers, { item });
const setQty = (headers, itemId, quantity) => call('PUT', `/api/cart/${encodeURIComponent(itemId)}`, headers, { quantity });
const remove = (headers, itemId) => call('DELETE', `/api/cart/${encodeURIComponent(itemId)}`, headers);
const readCart = async (headers) => (await (await call('GET', '/api/cart', headers)).json()).data.items;

dbDescribe('Cart mutations under concurrency', () => {
  before(async () => {
    // The race only shows with the unique owner indexes in place.
    await Cart.createIndexes();
    const app = express();
    app.use(express.json());
    app.use('/api/cart', cartRoutes);
    server = await new Promise((resolve) => {
      const running = app.listen(0, '127.0.0.1', () => resolve(running));
    });
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await Cart.deleteMany({
      $or: [{ userId: { $regex: `^${PREFIX}` } }, { guestId: { $regex: `^${PREFIX}` } }]
    });
    if (server) server.close();
    await mongoose.disconnect();
  });

  it('keeps every line when three POSTs create the cart at once', async () => {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const headers = memberHeaders(newUser());
      const responses = await Promise.all([1, 2, 3].map((n) => add(headers, line(n))));
      assert.deepEqual(responses.map((r) => r.status), [201, 201, 201], `iteration ${i}`);
      const items = await readCart(headers);
      assert.equal(items.length, 3, `iteration ${i}: expected 3 lines, got ${items.length}`);
    }
  });

  it('keeps every line when POSTs overlap on an existing cart', async () => {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const headers = memberHeaders(newUser());
      assert.equal((await add(headers, line(0))).status, 201);
      const responses = await Promise.all([1, 2, 3, 4, 5, 6].map((n) => add(headers, line(n))));
      assert.ok(responses.every((r) => r.status === 201), `iteration ${i}`);
      assert.equal((await readCart(headers)).length, 7, `iteration ${i}`);
    }
  });

  it('counts every concurrent add of the same item exactly once, in one line', async () => {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const headers = memberHeaders(newUser());
      const responses = await Promise.all(Array.from({ length: 8 }, () => add(headers, line(1))));
      assert.ok(responses.every((r) => r.status === 201), `iteration ${i}`);
      const items = await readCart(headers);
      assert.equal(items.length, 1, `iteration ${i}: the line was duplicated`);
      assert.equal(items[0].quantity, 8, `iteration ${i}: expected 8, got ${items[0].quantity}`);
    }
  });

  it('applies concurrent PUTs on different lines without overwriting each other', async () => {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const headers = memberHeaders(newUser());
      for (const n of [1, 2, 3, 4]) await add(headers, line(n));
      const targets = { 1: 5, 2: 7, 3: 2, 4: 9 };
      const responses = await Promise.all(
        Object.entries(targets).map(([n, qty]) => setQty(headers, line(n).itemId, qty))
      );
      assert.ok(responses.every((r) => r.status === 200), `iteration ${i}`);
      const byId = Object.fromEntries((await readCart(headers)).map((it) => [it.itemId, it.quantity]));
      for (const [n, qty] of Object.entries(targets)) {
        assert.equal(byId[line(n).itemId], qty, `iteration ${i}: line ${n}`);
      }
    }
  });

  it('never fails or corrupts a line under a burst of PUTs to it, and settles on the last one sent in order', async () => {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const headers = memberHeaders(newUser());
      await add(headers, line(1));
      const burst = [4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1];
      const responses = await Promise.all(burst.map((qty) => setQty(headers, line(1).itemId, qty)));
      assert.ok(responses.every((r) => r.status === 200), `iteration ${i}`);
      const items = await readCart(headers);
      assert.equal(items.length, 1);
      assert.ok(burst.includes(items[0].quantity), `iteration ${i}: stored ${items[0].quantity}`);

      // Sent one after another, the server ends on exactly the last value.
      for (const qty of [3, 9, 2]) assert.equal((await setQty(headers, line(1).itemId, qty)).status, 200);
      assert.equal((await readCart(headers))[0].quantity, 2);
    }
  });

  it('removes lines deleted at the same time and leaves the others alone', async () => {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const headers = memberHeaders(newUser());
      for (const n of [1, 2, 3, 4, 5, 6]) await add(headers, line(n));
      const responses = await Promise.all([
        remove(headers, line(1).itemId),
        remove(headers, line(2).itemId),
        remove(headers, line(3).itemId),
        setQty(headers, line(4).itemId, 6),
        add(headers, line(5, 2))
      ]);
      assert.ok(responses.every((r) => r.ok), `iteration ${i}`);
      const byId = Object.fromEntries((await readCart(headers)).map((it) => [it.itemId, it.quantity]));
      assert.deepEqual(Object.keys(byId).sort(), [line(4).itemId, line(5).itemId, line(6).itemId].sort());
      assert.equal(byId[line(4).itemId], 6);
      assert.equal(byId[line(5).itemId], 3);
      assert.equal(byId[line(6).itemId], 1);
    }
  });

  it('gives a guest cart an expiry and a member cart none', async () => {
    const guestId = newGuest();
    await Promise.all([1, 2, 3].map((n) => add(guestHeaders(guestId), line(n))));
    const guestCart = await Cart.findOne({ guestId }).lean();
    assert.equal(guestCart.items.length, 3);
    assert.ok(guestCart.expiresAt instanceof Date && guestCart.expiresAt > new Date());

    const userId = newUser();
    await add(memberHeaders(userId), line(1));
    const memberCart = await Cart.findOne({ userId }).lean();
    assert.equal(memberCart.expiresAt, null);
    assert.equal(memberCart.guestId, null);
  });

  it('keeps owners apart', async () => {
    const userA = memberHeaders(newUser());
    const userB = memberHeaders(newUser());
    const guest = guestHeaders(newGuest());
    await Promise.all([add(userA, line(1)), add(userB, line(2)), add(guest, line(3))]);

    assert.deepEqual((await readCart(userA)).map((it) => it.itemId), [line(1).itemId]);
    assert.deepEqual((await readCart(userB)).map((it) => it.itemId), [line(2).itemId]);
    assert.deepEqual((await readCart(guest)).map((it) => it.itemId), [line(3).itemId]);

    // B cannot change or remove A's line by naming it.
    assert.equal((await setQty(userB, line(1).itemId, 9)).status, 404);
    await remove(userB, line(1).itemId);
    assert.equal((await readCart(userA))[0].quantity, 1);
  });

  it('merges a guest cart into the account once, even when two merges overlap', async () => {
    for (let i = 0; i < ITERATIONS; i += 1) {
      const userId = newUser();
      const guestId = newGuest();
      await add(memberHeaders(userId), line(1, 2));
      await add(guestHeaders(guestId), line(1, 3));
      await add(guestHeaders(guestId), line(2, 1));

      const responses = await Promise.all([
        call('POST', '/api/cart/merge', memberHeaders(userId, guestId)),
        call('POST', '/api/cart/merge', memberHeaders(userId, guestId))
      ]);
      assert.ok(responses.every((r) => r.status === 200), `iteration ${i}`);

      const byId = Object.fromEntries((await readCart(memberHeaders(userId))).map((it) => [it.itemId, it.quantity]));
      assert.equal(byId[line(1).itemId], 5, `iteration ${i}: guest quantity counted ${byId[line(1).itemId] - 2} times`);
      assert.equal(byId[line(2).itemId], 1, `iteration ${i}`);
      assert.equal(await Cart.countDocuments({ guestId }), 0);
    }
  });
});
