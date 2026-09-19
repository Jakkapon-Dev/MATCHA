import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import orderRoutes from '../routes/orderRoutes.js';

let server;
let baseUrl;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/orders', orderRoutes);

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/orders`;
      resolve();
    });
  });
});

after(() => {
  if (server) server.close();
});

test('POST /api/orders calculates pricing and creates order for guest', async () => {
  const payload = {
    customer: {
      firstName: 'Test',
      lastName: 'Guest',
      email: 'guest.checkout@matcha.test',
      phone: '0899999999',
      address: '100 Road',
      city: 'Bangkok',
      zipCode: '10110'
    },
    items: [
      { productId: 'AUT-ACC-001', quantity: 1, size: 'OS' }
    ],
    paymentMethod: 'demo',
    shippingOption: 'standard'
  };

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.orderNumber);
  assert.ok(data.data.total > 0);
  assert.equal(data.data.customer.email, 'guest.checkout@matcha.test');
});

test('GET /api/orders returns orders list without requiring authentication', async () => {
  const res = await fetch(baseUrl);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
});

test('POST /api/orders neutralizes NoSQL injection payload in idempotencyKey', async () => {
  const payload = {
    idempotencyKey: { $ne: 'random-key' },
    customer: { email: 'nosql.test@matcha.test' },
    items: [{ productId: 'AUT-ACC-001', quantity: 1, size: 'OS' }]
  };

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  // Should succeed as a new order rather than returning another existing order
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  // Ensure the effectiveKey was safely coerced to string
  assert.ok(typeof data.data.idempotencyKey === 'string');
  assert.ok(!data.data.idempotencyKey.includes('$ne'));
});

