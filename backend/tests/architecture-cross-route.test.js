import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { ownsOrder } from '../services/orderAccess.js';
import { getJwtSecret } from '../middleware/auth.js';
import { allLooks, findLinkedProducts } from '../routes/lookbookRoutes.js';
import { assertActiveUrls, usage } from '../routes/mediaRoutes.js';
import { memoryNotifications } from '../services/notificationStore.js';
import Media from '../models/MediaAsset.js';
import Lookbook from '../models/Lookbook.js';
import DefaultProduct from '../models/Product.js';

let origReadyState;
before(() => {
  origReadyState = mongoose.connection.readyState;
  mongoose.connection.readyState = 1;
});

after(() => {
  mongoose.connection.readyState = origReadyState;
});

test('ownsOrder: validates viewer authorization across roles and identity keys', () => {
  const sampleOrder = {
    userId: 'u_buyer_007',
    customer: { email: 'Buyer007@Matcha.Local' },
    guestId: 'guest_sess_123'
  };

  // 1. Admin with valid token
  const adminToken = jwt.sign({ id: 'u_admin', role: 'admin' }, getJwtSecret());
  assert.equal(ownsOrder({ headers: { authorization: `Bearer ${adminToken}` } }, sampleOrder), true);

  // 2. Owner with matching userId
  const memberToken = jwt.sign({ id: 'u_buyer_007', role: 'Member' }, getJwtSecret());
  assert.equal(ownsOrder({ headers: { authorization: `Bearer ${memberToken}` } }, sampleOrder), true);

  // 2b. Owner with token using userId field
  const memberTokenUserId = jwt.sign({ userId: 'u_buyer_007' }, getJwtSecret());
  assert.equal(ownsOrder({ headers: { authorization: `Bearer ${memberTokenUserId}` } }, sampleOrder), true);

  // 3. Owner with matching email (case-insensitive)
  const emailToken = jwt.sign({ id: 'u_diff', email: 'buyer007@matcha.local' }, getJwtSecret());
  assert.equal(ownsOrder({ headers: { authorization: `Bearer ${emailToken}` } }, sampleOrder), true);

  // 4. Guest with matching x-guest-id
  assert.equal(ownsOrder({ headers: { 'x-guest-id': 'guest_sess_123' } }, sampleOrder), true);

  // 5. Guest with wrong x-guest-id
  assert.equal(ownsOrder({ headers: { 'x-guest-id': 'wrong_guest' } }, sampleOrder), false);

  // 6. Anonymous without headers
  assert.equal(ownsOrder({ headers: {} }, sampleOrder), false);

  // 7. Non-matching member
  const otherMemberToken = jwt.sign({ id: 'u_other', email: 'other@matcha.local' }, getJwtSecret());
  assert.equal(ownsOrder({ headers: { authorization: `Bearer ${otherMemberToken}` } }, sampleOrder), false);

  // 8. Demo offline token does not bypass ownership
  assert.equal(ownsOrder({ headers: { authorization: 'Bearer demo-offline-token' } }, sampleOrder), false);
});

test('lookbook: allLooks returns default lookbooks merged with saved lookbooks', async () => {
  // When DB has no saved lookbooks, returns defaults
  const originalFind = Lookbook.find;
  try {
    Lookbook.find = () => ({
      sort: () => ({
        lean: async () => [
          { id: 'spread-1', title: 'Overridden Spread 1', items: [], published: true, revision: 1 }
        ]
      })
    });
    const looks = await allLooks();
    assert.ok(Array.isArray(looks));
    assert.ok(looks.length > 0);
    const overridden = looks.find(l => l.id === 'spread-1');
    assert.equal(overridden?.title, 'Overridden Spread 1');
  } finally {
    Lookbook.find = originalFind;
  }
});

test('lookbook: findLinkedProducts resolves products by id and ObjectId', async () => {
  const Product = mongoose.models.Product || DefaultProduct;
  const originalFind = Product.find;
  try {
    Product.find = (query) => {
      assert.ok(query.$or);
      return {
        select: () => ({
          lean: async () => [
            { id: 'AUT-TOP-001', name: 'Matcha Knit Sweater' }
          ]
        })
      };
    };
    const products = await findLinkedProducts([{ productId: 'AUT-TOP-001' }]);
    assert.equal(products.length, 1);
    assert.equal(products[0].id, 'AUT-TOP-001');
  } finally {
    Product.find = originalFind;
  }
});

test('media: assertActiveUrls validates managed URLs against non-archived media', async () => {
  try {
    const queryMock = data => ({
      select() { return this; },
      sort() { return this; },
      lean: async () => data
    });

    let currentMedia = [];
    mock.method(Media, 'find', () => queryMock(currentMedia));

    // 1. Non-managed static images pass
    currentMedia = [];
    await assertActiveUrls(['/images/static-sample.webp']);

    // 2. Managed URL existing and active passes
    currentMedia = [{ url: '/api/media/files/active-123.webp' }];
    await assertActiveUrls(['/api/media/files/active-123.webp']);

    // 3. Managed URL missing or archived throws 400
    currentMedia = [];
    await assert.rejects(
      async () => {
        await assertActiveUrls(['/api/media/files/missing-or-archived.webp']);
      },
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /คลัง/);
        return true;
      }
    );
  } finally {
    mock.reset();
  }
});

test('notifications: memoryNotifications provides in-memory fallback list', () => {
  assert.ok(Array.isArray(memoryNotifications));
  const initialLength = memoryNotifications.length;
  const testNotif = {
    _id: `test_${Date.now()}`,
    type: 'new_order',
    orderNumber: 'MTA-TEST-001',
    customerName: 'Test Buyer',
    total: 99.99,
    read: false,
    createdAt: new Date().toISOString()
  };
  memoryNotifications.unshift(testNotif);
  assert.equal(memoryNotifications.length, initialLength + 1);
  assert.equal(memoryNotifications[0].orderNumber, 'MTA-TEST-001');

  // Clean up
  const idx = memoryNotifications.indexOf(testNotif);
  if (idx !== -1) memoryNotifications.splice(idx, 1);
  assert.equal(memoryNotifications.length, initialLength);
});
