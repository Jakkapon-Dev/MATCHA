import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import userRoutes from '../routes/userRoutes.js';
import { User } from '../services/userStore.js';
import { getJwtSecret } from '../middleware/auth.js';

let server, base;
const token = (id, role = 'Member') => jwt.sign({ id, role, email: `${id}@example.test` }, getJwtSecret());
const headers = (id, role = 'Member') => ({
  Authorization: `Bearer ${token(id, role)}`,
  'Content-Type': 'application/json',
});

// Users in-memory store for isolation across tests
const testUsers = new Map();

function createMockUserDoc(userRecord) {
  const doc = {
    _id: userRecord._id,
    id: userRecord._id,
    role: userRecord.role || 'Member',
    addresses: (userRecord.addresses || []).map(a => ({
      _id: a._id || a.id || `addr_${Math.random().toString(36).slice(2, 11)}`,
      id: a._id || a.id || `addr_${Math.random().toString(36).slice(2, 11)}`,
      ...a,
      toObject() {
        return { ...this };
      }
    })),
    lean: async () => ({
      _id: userRecord._id,
      id: userRecord._id,
      role: userRecord.role || 'Member',
      addresses: (userRecord.addresses || []).map(a => ({ ...a }))
    }),
    select(fields) {
      return {
        lean: async () => ({
          _id: this._id,
          id: this.id,
          role: this.role,
          addresses: this.addresses.map(a => ({ ...a }))
        })
      };
    },
    async save() {
      userRecord.addresses = this.addresses.map(a => {
        const id = a._id || a.id || `addr_${Math.random().toString(36).slice(2, 11)}`;
        return {
          ...a,
          _id: id,
          id: id,
        };
      });
      return this;
    }
  };
  return doc;
}

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/users', userRoutes);
  server = await new Promise(resolve => {
    const running = app.listen(0, '127.0.0.1', () => resolve(running));
  });
  base = `http://127.0.0.1:${server.address().port}/api/users`;
});

after(() => new Promise(resolve => server.close(resolve)));

function setupDbMock(t) {
  const state = mongoose.connection.readyState;
  mongoose.connection.readyState = 1;
  t.after(() => {
    mongoose.connection.readyState = state;
    testUsers.clear();
  });

  t.mock.method(User, 'findById', (id) => {
    const found = testUsers.get(String(id));
    if (!found) return null;
    return createMockUserDoc(found);
  });
}

const sampleAddress = () => ({
  recipientName: 'Somchai Jaidee',
  phone: '0812345678',
  addressLine1: '123/45 Sukhumvit Road',
  addressLine2: 'Soi 11',
  subdistrict: 'Khlong Toei Nuea',
  district: 'Watthana',
  province: 'Bangkok',
  postalCode: '10110',
  country: 'Thailand',
  label: 'Home',
  isDefault: false
});

test('Address endpoints require authentication (401 without token)', async () => {
  for (const [path, method, body] of [
    ['/me/addresses', 'GET'],
    ['/me/addresses', 'POST', sampleAddress()],
    ['/me/addresses/addr_123', 'PATCH', { label: 'Work' }],
    ['/me/addresses/addr_123', 'DELETE']
  ]) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    assert.equal(res.status, 401, `${method} ${path} should return 401`);
  }
});

test('GET /me/addresses returns empty list for user without addresses', async (t) => {
  setupDbMock(t);
  testUsers.set('user_1', { _id: 'user_1', addresses: [] });

  const res = await fetch(`${base}/me/addresses`, {
    headers: headers('user_1')
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.deepEqual(json.data, []);
});

test('POST /me/addresses creates first address and sets it as default automatically', async (t) => {
  setupDbMock(t);
  testUsers.set('user_1', { _id: 'user_1', addresses: [] });

  const res = await fetch(`${base}/me/addresses`, {
    method: 'POST',
    headers: headers('user_1'),
    body: JSON.stringify(sampleAddress())
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.id, 'Address must have id');
  assert.ok(json.data._id, 'Address must have _id');
  assert.equal(json.data.recipientName, 'Somchai Jaidee');
  assert.equal(json.data.isDefault, true, 'First address should be default');

  // Verify in GET
  const getRes = await fetch(`${base}/me/addresses`, { headers: headers('user_1') });
  const getJson = await getRes.json();
  assert.equal(getJson.data.length, 1);
  assert.equal(getJson.data[0].isDefault, true);
});

test('POST /me/addresses setting new default unsets previous default', async (t) => {
  setupDbMock(t);
  testUsers.set('user_1', { _id: 'user_1', addresses: [] });

  // 1. Add first address
  await fetch(`${base}/me/addresses`, {
    method: 'POST',
    headers: headers('user_1'),
    body: JSON.stringify(sampleAddress())
  });

  // 2. Add second address with isDefault: true
  const second = { ...sampleAddress(), recipientName: 'Second Address', isDefault: true };
  const res = await fetch(`${base}/me/addresses`, {
    method: 'POST',
    headers: headers('user_1'),
    body: JSON.stringify(second)
  });
  assert.equal(res.status, 201);

  // 3. Verify that only second address is default
  const getRes = await fetch(`${base}/me/addresses`, { headers: headers('user_1') });
  const list = (await getRes.json()).data;
  assert.equal(list.length, 2);
  const defaultItems = list.filter(a => a.isDefault);
  assert.equal(defaultItems.length, 1, 'Only one address can be default');
  assert.equal(defaultItems[0].recipientName, 'Second Address');
});

test('POST /me/addresses rejects invalid postal codes and Thai phone numbers', async (t) => {
  setupDbMock(t);
  testUsers.set('user_1', { _id: 'user_1', addresses: [] });

  // Invalid postal codes (not 5 digits)
  for (const badPostal of ['1011', '101100', '1011A', 'abcde', '']) {
    const res = await fetch(`${base}/me/addresses`, {
      method: 'POST',
      headers: headers('user_1'),
      body: JSON.stringify({ ...sampleAddress(), postalCode: badPostal })
    });
    assert.equal(res.status, 400, `Postal code ${badPostal} should be rejected`);
  }

  // Invalid phone numbers (must be 9-10 digits starting with 0)
  for (const badPhone of ['12345678', '081234567890', '081234', 'phone12345', '']) {
    const res = await fetch(`${base}/me/addresses`, {
      method: 'POST',
      headers: headers('user_1'),
      body: JSON.stringify({ ...sampleAddress(), phone: badPhone })
    });
    assert.equal(res.status, 400, `Phone ${badPhone} should be rejected`);
  }
});

test('POST /me/addresses rejects NoSQL operator payloads and unexpected keys', async (t) => {
  setupDbMock(t);
  testUsers.set('user_1', { _id: 'user_1', addresses: [] });

  // 1. Operator object in place of string
  const resOperator = await fetch(`${base}/me/addresses`, {
    method: 'POST',
    headers: headers('user_1'),
    body: JSON.stringify({
      ...sampleAddress(),
      recipientName: { $ne: 'Somchai' }
    })
  });
  assert.equal(resOperator.status, 400, 'Object operator payload should be rejected');

  // 2. Extra unexpected operator key
  const resExtra = await fetch(`${base}/me/addresses`, {
    method: 'POST',
    headers: headers('user_1'),
    body: JSON.stringify({
      ...sampleAddress(),
      $gt: ''
    })
  });
  assert.equal(resExtra.status, 400, 'Unknown operator key should be rejected by strict schema');
});

test('POST /me/addresses enforces maximum 20 addresses limit', async (t) => {
  setupDbMock(t);
  const twentyAddresses = Array.from({ length: 20 }, (_, i) => ({
    _id: `addr_${i + 1}`,
    id: `addr_${i + 1}`,
    ...sampleAddress(),
    recipientName: `Address ${i + 1}`,
    isDefault: i === 0
  }));
  testUsers.set('user_1', { _id: 'user_1', addresses: twentyAddresses });

  // Attempt to add 21st address
  const res = await fetch(`${base}/me/addresses`, {
    method: 'POST',
    headers: headers('user_1'),
    body: JSON.stringify(sampleAddress())
  });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.match(json.message, /limit/i);
});

test('PATCH /me/addresses/:id updates fields and returns 404 for another user address', async (t) => {
  setupDbMock(t);
  testUsers.set('user_A', {
    _id: 'user_A',
    addresses: [{ _id: 'addr_A', id: 'addr_A', ...sampleAddress(), recipientName: 'User A' }]
  });
  testUsers.set('user_B', {
    _id: 'user_B',
    addresses: [{ _id: 'addr_B', id: 'addr_B', ...sampleAddress(), recipientName: 'User B' }]
  });

  // 1. User A tries to edit User B's address -> 404 (not 403, do not leak existence)
  const crossRes = await fetch(`${base}/me/addresses/addr_B`, {
    method: 'PATCH',
    headers: headers('user_A'),
    body: JSON.stringify({ recipientName: 'Hacked Name' })
  });
  assert.equal(crossRes.status, 404, 'Must return 404 when targeting another user address');

  // 2. User A successfully edits their own address
  const ownRes = await fetch(`${base}/me/addresses/addr_A`, {
    method: 'PATCH',
    headers: headers('user_A'),
    body: JSON.stringify({ recipientName: 'Updated Somchai', label: 'Office' })
  });
  assert.equal(ownRes.status, 200);
  const ownJson = await ownRes.json();
  assert.equal(ownJson.data.recipientName, 'Updated Somchai');
  assert.equal(ownJson.data.label, 'Office');
});

test('DELETE /me/addresses/:id deletes address, returns 404 for other user, and promotes new default', async (t) => {
  setupDbMock(t);
  testUsers.set('user_A', {
    _id: 'user_A',
    addresses: [
      { _id: 'addr_A1', id: 'addr_A1', ...sampleAddress(), recipientName: 'Primary', isDefault: true },
      { _id: 'addr_A2', id: 'addr_A2', ...sampleAddress(), recipientName: 'Secondary', isDefault: false }
    ]
  });
  testUsers.set('user_B', {
    _id: 'user_B',
    addresses: [{ _id: 'addr_B1', id: 'addr_B1', ...sampleAddress() }]
  });

  // 1. User A tries to delete User B's address -> 404
  const crossDel = await fetch(`${base}/me/addresses/addr_B1`, {
    method: 'DELETE',
    headers: headers('user_A')
  });
  assert.equal(crossDel.status, 404, 'Cross-user delete must return 404');

  // 2. User A deletes their default address (addr_A1)
  const delRes = await fetch(`${base}/me/addresses/addr_A1`, {
    method: 'DELETE',
    headers: headers('user_A')
  });
  assert.equal(delRes.status, 200);

  // 3. Verify addr_A2 was promoted to isDefault: true
  const listRes = await fetch(`${base}/me/addresses`, { headers: headers('user_A') });
  const remaining = (await listRes.json()).data;
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, 'addr_A2');
  assert.equal(remaining[0].isDefault, true, 'First remaining address should be promoted to default');
});
