import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';

process.env.JWT_SECRET = 'profile-avatar-test-key-not-for-production';
const mediaRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'matcha-avatar-test-'));
process.env.MEDIA_STORAGE_DIR = mediaRoot;

const { default: userRoutes } = await import('../routes/userRoutes.js');
const { User } = await import('../services/userStore.js');
const { default: errorHandler } = await import('../middleware/errorHandler.js');

let server;
let base;
const member = {
  _id: 'test-avatar-member',
  email: 'avatar@example.test',
  role: 'Member',
  firstName: 'Mali',
  lastName: 'Dee'
};
const token = jwt.sign({ id: member._id, email: member.email, role: member.role }, process.env.JWT_SECRET);
const auth = { Authorization: `Bearer ${token}` };

before(async () => {
  mongoose.connection.readyState = 1;
  const app = express();
  app.use(express.json());
  app.use('/users', userRoutes);
  app.use(errorHandler);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/users`;
});

after(async () => {
  mongoose.connection.readyState = 0;
  await new Promise(resolve => server.close(resolve));
  await fs.promises.rm(mediaRoot, { recursive: true, force: true });
});

function authenticate(t, overrides = {}) {
  t.mock.method(User, 'findById', () => ({ lean: async () => ({ ...member, ...overrides }) }));
}

test('profile avatar upload requires authentication and an image', async t => {
  assert.equal((await fetch(`${base}/me/avatar`, { method: 'POST' })).status, 401);
  authenticate(t);
  assert.equal((await fetch(`${base}/me/avatar`, { method: 'POST', headers: auth })).status, 400);
});

test('member can upload a validated avatar and remove it', async t => {
  authenticate(t);
  let savedAvatar;
  t.mock.method(User, 'findByIdAndUpdate', (id, update) => {
    assert.equal(id, member._id);
    savedAvatar = update.$set;
    return { lean: async () => ({ ...member, ...update.$set }) };
  });

  const bytes = await sharp({ create: { width: 640, height: 480, channels: 3, background: '#5f8f62' } }).png().toBuffer();
  const form = new FormData();
  form.append('image', new Blob([bytes], { type: 'image/png' }), 'profile.png');
  const uploaded = await fetch(`${base}/me/avatar`, { method: 'POST', headers: auth, body: form });
  assert.equal(uploaded.status, 201);
  assert.match((await uploaded.json()).data.avatarUrl, /^\/api\/media\/files\/[\w-]+\.webp$/);
  assert.match(savedAvatar.avatarThumbnailUrl, /^\/api\/media\/files\/[\w-]+-thumb\.webp$/);

  const removed = await fetch(`${base}/me/avatar`, { method: 'DELETE', headers: auth });
  assert.equal(removed.status, 200);
  assert.equal((await removed.json()).data.avatarUrl, '');
});

test('corrupt avatar bytes are rejected before the profile is changed', async t => {
  authenticate(t);
  let changed = false;
  t.mock.method(User, 'findByIdAndUpdate', () => { changed = true; });
  const form = new FormData();
  form.append('image', new Blob(['not an image'], { type: 'image/png' }), 'fake.png');
  const response = await fetch(`${base}/me/avatar`, { method: 'POST', headers: auth, body: form });
  assert.equal(response.status, 400);
  assert.equal(changed, false);
});
