import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import couponRoutes from '../routes/couponRoutes.js';
import { extractAuthUser } from '../middleware/auth.js';
import { ownsOrder } from '../services/orderAccess.js';
import { getJwtSecret } from '../middleware/auth.js';

let server;
let baseUrl;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', couponRoutes);

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });
});

after(() => {
  if (server) server.close();
});

test('extractAuthUser: returns null when Authorization header is missing or non-Bearer', () => {
  assert.equal(extractAuthUser({ headers: {} }), null);
  assert.equal(extractAuthUser({ headers: { authorization: '' } }), null);
  assert.equal(extractAuthUser({ headers: { authorization: 'Basic dXNlcjpwYXNz' } }), null);
  assert.equal(extractAuthUser({ headers: { authorization: 'Bearer' } }), null);
  assert.equal(extractAuthUser({ headers: { authorization: 'Bearer ' } }), null);
});

test('extractAuthUser: ignores demo-offline-token (returns null)', () => {
  assert.equal(extractAuthUser({ headers: { authorization: 'Bearer demo-offline-token' } }), null);
});

test('extractAuthUser: swallows invalid or expired token errors and returns null', () => {
  // Malformed token
  assert.equal(extractAuthUser({ headers: { authorization: 'Bearer invalid.token.payload' } }), null);

  // Expired token
  const expired = jwt.sign({ id: 'u_expired', role: 'Member' }, getJwtSecret(), { expiresIn: -60 });
  assert.equal(extractAuthUser({ headers: { authorization: `Bearer ${expired}` } }), null);

  // Wrong secret
  const wrongSecret = jwt.sign({ id: 'u_wrong' }, 'completely-wrong-secret-12345');
  assert.equal(extractAuthUser({ headers: { authorization: `Bearer ${wrongSecret}` } }), null);
});

test('extractAuthUser: returns decoded payload for valid token with id, userId, or _id', () => {
  const tokenWithId = jwt.sign({ id: 'u_101', role: 'Member', email: 'test1@matcha.local' }, getJwtSecret());
  const decoded1 = extractAuthUser({ headers: { authorization: `Bearer ${tokenWithId}` } });
  assert.equal(decoded1?.id, 'u_101');
  assert.equal(decoded1?.role, 'Member');
  assert.equal(decoded1?.email, 'test1@matcha.local');

  const tokenWithUserId = jwt.sign({ userId: 'u_102', role: 'Admin' }, getJwtSecret());
  const decoded2 = extractAuthUser({ headers: { authorization: `Bearer ${tokenWithUserId}` } });
  assert.equal(decoded2?.userId, 'u_102');
  assert.equal(decoded2?.role, 'Admin');

  const tokenWithUnderscoreId = jwt.sign({ _id: 'u_103' }, getJwtSecret());
  const decoded3 = extractAuthUser({ headers: { authorization: `Bearer ${tokenWithUnderscoreId}` } });
  assert.equal(decoded3?._id, 'u_103');
});

test('POST /api/coupons/quote: works for guest without token', async () => {
  const res = await fetch(`${baseUrl}/coupons/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'MATCHA15',
      items: [{ productId: 'AUT-ACC-001', quantity: 1 }]
    })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.code, 'MATCHA15');
  assert.ok(body.data.discountAmount > 0);
});

test('POST /api/coupons/quote: works for signed-in member with valid token', async () => {
  const memberToken = jwt.sign({ id: 'u_member_quote', role: 'Member' }, getJwtSecret());
  const res = await fetch(`${baseUrl}/coupons/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${memberToken}`
    },
    body: JSON.stringify({
      code: 'MATCHA15',
      items: [{ productId: 'AUT-ACC-001', quantity: 1 }]
    })
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.code, 'MATCHA15');
  assert.ok(body.data.discountAmount > 0);
});

test('POST /api/coupons/quote: falls back gracefully to guest on invalid, expired, or demo token', async () => {
  // Invalid token
  const resInvalid = await fetch(`${baseUrl}/coupons/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer malformed.jwt.token'
    },
    body: JSON.stringify({
      code: 'MATCHA15',
      items: [{ productId: 'AUT-ACC-001', quantity: 1 }]
    })
  });
  assert.equal(resInvalid.status, 200, 'Invalid token must not reject quote with 401/500');
  const bodyInvalid = await resInvalid.json();
  assert.equal(bodyInvalid.success, true);

  // Expired token
  const expiredToken = jwt.sign({ id: 'u_expired' }, getJwtSecret(), { expiresIn: -3600 });
  const resExpired = await fetch(`${baseUrl}/coupons/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${expiredToken}`
    },
    body: JSON.stringify({
      code: 'MATCHA15',
      items: [{ productId: 'AUT-ACC-001', quantity: 1 }]
    })
  });
  assert.equal(resExpired.status, 200, 'Expired token must not reject quote');
  const bodyExpired = await resExpired.json();
  assert.equal(bodyExpired.success, true);

  // Demo offline token
  const resDemo = await fetch(`${baseUrl}/coupons/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer demo-offline-token'
    },
    body: JSON.stringify({
      code: 'MATCHA15',
      items: [{ productId: 'AUT-ACC-001', quantity: 1 }]
    })
  });
  assert.equal(resDemo.status, 200, 'demo-offline-token must be ignored and treated as guest');
  const bodyDemo = await resDemo.json();
  assert.equal(bodyDemo.success, true);
});

test('ownsOrder: authorization checks with optional auth', () => {
  const sampleOrder = {
    userId: 'u_buyer_1',
    customer: { email: 'buyer@example.local' },
    guestId: 'guest_cookie_xyz'
  };

  // 1. Admin can view any order
  const adminToken = jwt.sign({ id: 'u_admin', role: 'Admin' }, getJwtSecret());
  assert.equal(ownsOrder({ headers: { authorization: `Bearer ${adminToken}` } }, sampleOrder), true);

  // 2. Owner matching userId
  const ownerToken = jwt.sign({ id: 'u_buyer_1', role: 'Member' }, getJwtSecret());
  assert.equal(ownsOrder({ headers: { authorization: `Bearer ${ownerToken}` } }, sampleOrder), true);

  // 3. Owner matching email
  const emailToken = jwt.sign({ id: 'u_diff_id', email: 'BUYER@example.local' }, getJwtSecret());
  assert.equal(ownsOrder({ headers: { authorization: `Bearer ${emailToken}` } }, sampleOrder), true);

  // 4. Guest matching guestId
  assert.equal(ownsOrder({ headers: { 'x-guest-id': 'guest_cookie_xyz' } }, sampleOrder), true);

  // 5. Stranger cannot view
  const strangerToken = jwt.sign({ id: 'u_stranger', email: 'stranger@example.local', role: 'Member' }, getJwtSecret());
  assert.equal(ownsOrder({ headers: { authorization: `Bearer ${strangerToken}` } }, sampleOrder), false);
  assert.equal(ownsOrder({ headers: { 'x-guest-id': 'different_guest_id' } }, sampleOrder), false);
  assert.equal(ownsOrder({ headers: {} }, sampleOrder), false);

  // 6. Invalid token or demo-offline-token does not grant access
  assert.equal(ownsOrder({ headers: { authorization: 'Bearer invalid.token' } }, sampleOrder), false);
  assert.equal(ownsOrder({ headers: { authorization: 'Bearer demo-offline-token' } }, sampleOrder), false);
});
