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


/* These guard an access-control fix, not a feature.

   GET /api/orders answered an anonymous caller with every order in the shop,
   and honoured ?email= without asking whether the caller owned that address.
   GET /api/orders/:id handed over a whole order — customer name, email, phone
   and street address — to anyone holding an order number, and those numbers
   read like MTA-2026-439417-924, which is worth guessing at.

   The tests run with no database, so the route reads its in-memory list. That
   is enough: what is asserted is who the endpoint answers, which is decided
   before any store is consulted. */

test('GET /api/orders tells an anonymous caller nothing', async () => {
  const res = await fetch(baseUrl);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.deepEqual(body.data, [], 'an anonymous list must be empty, never the shop\'s orders');
});

test('GET /api/orders does not honour an email it cannot verify', async () => {
  const res = await fetch(`${baseUrl}?email=somebody@example.com`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.data, [], 'an unverified email filter must not select anyone\'s orders');
});

test('GET /api/orders/:id refuses a caller who does not own the order', async () => {
  const created = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: 'p1', name: 'Item', price: 20, quantity: 1 }],
      customer: {
        firstName: 'Owner', lastName: 'Person', email: 'owner@example.com',
        phone: '081-000-0000', address: '1 Road', city: 'Bangkok',
        zipCode: '10110', country: 'Thailand'
      },
      paymentMethod: 'visa', subtotal: 20, shipping: 0, total: 20
    })
  }).then((r) => r.json());

  const id = created.data?.orderNumber || created.data?._id;
  assert.ok(id, 'the order was created');

  const res = await fetch(`${baseUrl}/${id}`);
  assert.equal(res.status, 404, 'a stranger gets the same answer as for an order that does not exist');
  const body = await res.json();
  assert.equal(body.success, false);
  assert.ok(!JSON.stringify(body).includes('owner@example.com'), 'the refusal must not leak the customer');
});
