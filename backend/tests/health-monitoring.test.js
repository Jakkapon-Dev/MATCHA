import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { app } from '../server.js';

let server;
let base;

before(async () => {
  await new Promise(resolve => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(() => {
  server?.close();
});

test('GET /api/health returns 200 and healthy checks when database is active', async t => {
  const origState = mongoose.connection.readyState;
  const origDb = mongoose.connection.db;

  mongoose.connection.readyState = 1;
  mongoose.connection.db = {
    admin: () => ({
      ping: async () => ({ ok: 1 })
    })
  };

  t.after(() => {
    mongoose.connection.readyState = origState;
    mongoose.connection.db = origDb;
  });

  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.status, 'healthy');
  assert.equal(body.state, 'online');
  assert.equal(body.checks.api, 'healthy');
  assert.equal(body.checks.database, 'connected');
  assert.ok(typeof body.uptime === 'number');
  assert.ok(body.timestamp);
});

test('GET /api/health returns 503 and degraded checks when database is disconnected', async t => {
  const origState = mongoose.connection.readyState;
  const origDb = mongoose.connection.db;

  mongoose.connection.readyState = 0;
  mongoose.connection.db = undefined;

  t.after(() => {
    mongoose.connection.readyState = origState;
    mongoose.connection.db = origDb;
  });

  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 503);

  const body = await res.json();
  assert.equal(body.status, 'degraded');
  assert.equal(body.state, 'unhealthy');
  assert.equal(body.checks.api, 'healthy');
  assert.equal(body.checks.database, 'disconnected');
});

test('GET /api/health never exposes database credentials or internal connection strings', async t => {
  const origState = mongoose.connection.readyState;
  const origDb = mongoose.connection.db;

  mongoose.connection.readyState = 1;
  mongoose.connection.db = {
    admin: () => ({
      ping: async () => ({ ok: 1 })
    })
  };

  t.after(() => {
    mongoose.connection.readyState = origState;
    mongoose.connection.db = origDb;
  });

  const res = await fetch(`${base}/api/health`);
  const rawText = await res.text();

  // Ensure no sensitive connection details or secrets are leaked
  assert.ok(!rawText.includes('mongodb+srv://'));
  assert.ok(!rawText.includes('password'));
  assert.ok(!rawText.includes('secret'));
  assert.ok(!rawText.includes('@cluster'));
});
