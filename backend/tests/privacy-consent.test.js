import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import userRoutes from '../routes/userRoutes.js';
import { User } from '../services/userStore.js';
import DeletionRequest from '../models/DeletionRequest.js';
import AuditLog from '../models/AuditLog.js';
import { getJwtSecret } from '../middleware/auth.js';

let server, base;
const token = (id, role = 'Member', email = 'user@example.test') =>
  jwt.sign({ id, role, email }, getJwtSecret());
const headers = (id, role) => ({ Authorization: `Bearer ${token(id, role)}`, 'Content-Type': 'application/json' });

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/users', userRoutes);
  server = await new Promise(resolve => { const running = app.listen(0, '127.0.0.1', () => resolve(running)); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise(resolve => server.close(resolve)));

function connected(t) {
  const state = mongoose.connection.readyState;
  mongoose.connection.readyState = 1;
  t.after(() => { mongoose.connection.readyState = state; });
}

test('consent and deletion endpoints require authentication (401)', async () => {
  const r1 = await fetch(`${base}/users/me/consent`);
  assert.equal(r1.status, 401);

  const r2 = await fetch(`${base}/users/me/deletion-request`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  assert.equal(r2.status, 401);
});

test('member can update and fetch marketing consent', async t => {
  connected(t);
  let savedConsent = null;

  t.mock.method(User, 'findById', () => ({
    select: () => ({
      lean: async () => ({
        _id: 'u_consent_1',
        marketingConsent: savedConsent
      })
    })
  }));

  t.mock.method(User, 'findByIdAndUpdate', (id, update) => {
    savedConsent = update.$set.marketingConsent;
    return {
      select: () => ({
        lean: async () => ({ _id: id, marketingConsent: savedConsent })
      })
    };
  });

  // Invalid payload (non-boolean)
  const invalid = await fetch(`${base}/users/me/consent`, {
    method: 'PATCH',
    headers: headers('u_consent_1'),
    body: JSON.stringify({ optedIn: 'yes' })
  });
  assert.equal(invalid.status, 400);

  // Valid opt-in
  const optIn = await fetch(`${base}/users/me/consent`, {
    method: 'PATCH',
    headers: headers('u_consent_1'),
    body: JSON.stringify({ optedIn: true, version: '1.1' })
  });
  assert.equal(optIn.status, 200);
  const body = await optIn.json();
  assert.equal(body.success, true);
  assert.equal(body.data.optedIn, true);
  assert.equal(body.data.version, '1.1');

  // Fetch consent
  const fetchRes = await fetch(`${base}/users/me/consent`, { headers: headers('u_consent_1') });
  assert.equal(fetchRes.status, 200);
  const fetchBody = await fetchRes.json();
  assert.equal(fetchBody.data.optedIn, true);
});

test('member can submit a data deletion request and duplicate pending request is rejected', async t => {
  connected(t);
  let existing = null;

  t.mock.method(DeletionRequest, 'findOne', filter => {
    if (filter && filter.status === 'pending') {
      return existing && existing.status === 'pending' ? existing : null;
    }
    return {
      sort: () => ({
        lean: async () => existing
      })
    };
  });

  t.mock.method(DeletionRequest, 'create', async doc => {
    existing = { _id: 'del_1', ...doc, createdAt: new Date() };
    return existing;
  });

  t.mock.method(AuditLog, 'create', async () => ({}));

  // Submit deletion request
  const submitRes = await fetch(`${base}/users/me/deletion-request`, {
    method: 'POST',
    headers: headers('u_del_1'),
    body: JSON.stringify({ reason: 'No longer using this shop' })
  });
  assert.equal(submitRes.status, 201);
  const body = await submitRes.json();
  assert.equal(body.success, true);
  assert.equal(body.data.status, 'pending');

  // Second submission while pending returns 409 Conflict
  const dupRes = await fetch(`${base}/users/me/deletion-request`, {
    method: 'POST',
    headers: headers('u_del_1'),
    body: JSON.stringify({ reason: 'Duplicate' })
  });
  assert.equal(dupRes.status, 409);
});
