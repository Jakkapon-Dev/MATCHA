import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import orderRoutes, { stockKeyFor } from '../routes/orderRoutes.js';

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

/* The field used to be decided by the payment method — a card meant 'paid',
   cash on delivery meant 'unpaid' — which recorded an intention as a fact.
   Nothing in this endpoint takes money, so nothing in it may say money
   arrived. The day a gateway is connected, that difference is the goods. */
test('a new order is never born paid, whatever it says it will be paid with', async () => {
  const base = {
    customer: {
      firstName: 'Test',
      lastName: 'Guest',
      email: 'payment.status@matcha.test',
      phone: '0899999999',
      address: '100 Road',
      city: 'Bangkok',
      zipCode: '10110'
    },
    items: [{ productId: 'AUT-ACC-001', quantity: 1, size: 'OS' }],
    shippingOption: 'standard'
  };

  for (const paymentMethod of ['visa', 'mastercard', 'qr', 'cod', 'demo']) {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...base, paymentMethod })
    });

    assert.equal(res.status, 201, `${paymentMethod} should still create an order`);
    const { data } = await res.json();
    assert.equal(
      data.paymentStatus,
      'unpaid',
      `an order paid by ${paymentMethod} must start unpaid, not ${data.paymentStatus}`
    );
  }
});

/* Which bucket an ordered line comes out of.

   This is where a subtle oversell would hide. The browser sends 'M' when no
   size was chosen, and the order route used to write that straight onto the
   line. A garment sold without sizes keeps its stock under ONE, so an order
   carrying the default 'M' would look for a bucket that does not exist —
   and the obvious 'fix', falling back to whichever size has stock, would sell
   an M to someone who never asked for one. */
test('the stock bucket is chosen by what the product actually sells', () => {
  const sized = { sizes: ['S', 'M', 'L'] };
  const shoes = { sizes: ['EU 38', 'EU 39'] };
  const oneSize = { sizes: [] };

  assert.equal(stockKeyFor(sized, 'M'), 'M', 'a declared size is used as given');
  assert.equal(stockKeyFor(shoes, 'EU 39'), 'EU 39', 'shoe sizing is not special-cased');

  // Not declared: left alone so the reservation refuses it, rather than being
  // rounded to a size that happens to be in stock.
  assert.equal(stockKeyFor(sized, 'XXL'), 'XXL', 'an undeclared size is passed through to be refused');

  // No sizes at all: everything lands in the one bucket the migration made,
  // whatever the browser sent.
  assert.equal(stockKeyFor(oneSize, 'M'), 'ONE', "the browser's default size does not invent a bucket");
  assert.equal(stockKeyFor(oneSize, ''), 'ONE');
  assert.equal(stockKeyFor(oneSize, undefined), 'ONE');

  // A product the cache never found is treated as sizeless rather than
  // throwing: the reservation is what decides, and it will find nothing.
  assert.equal(stockKeyFor(undefined, 'M'), 'ONE');
});

test('a declared size is matched on its trimmed text, not loosely', () => {
  const sized = { sizes: [' M ', 'L'] };
  assert.equal(stockKeyFor(sized, ' M '), 'M', 'surrounding space is not part of the size');
  assert.equal(stockKeyFor(sized, 'm'), 'm', 'case is left as sent, so a mismatch is refused rather than guessed');
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

/* A guest can see what they ordered, and only that.

   Before this, an order placed without signing in belonged to nobody the
   server could ask about later, so the only way to show a guest their own
   order was to show everyone every order — which is what the list endpoint
   did. Orders now carry the same guest id the cart is keyed on, taken from
   the X-Guest-Id header the browser already sends.

   It is a bearer value, not proof of identity: whoever holds the id sees
   those orders. The cart already trusts it the same way, and it is generated
   with crypto.randomUUID, so it cannot be guessed. */

const placeGuestOrder = async (guestId, email) => {
  const headers = { 'Content-Type': 'application/json' };
  if (guestId) headers['x-guest-id'] = guestId;
  return fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      items: [{ productId: 'p1', name: 'Item', price: 20, quantity: 1 }],
      customer: {
        firstName: 'Guest', lastName: 'Tester', email,
        phone: '081-000-0000', address: '1 Road', city: 'Bangkok',
        zipCode: '10110', country: 'Thailand'
      },
      paymentMethod: 'visa', subtotal: 20, shipping: 0, total: 20
    })
  }).then((r) => r.json());
};

test('a guest sees the orders placed from their own browser, and no others', async () => {
  const guestA = `guest-test-${Date.now()}-a`;
  const guestB = `guest-test-${Date.now()}-b`;

  const placed = await placeGuestOrder(guestA, 'guest-a@example.com');
  assert.equal(placed.data.guestId, guestA, 'the order records who placed it');

  await placeGuestOrder(guestB, 'guest-b@example.com');

  const mine = await fetch(baseUrl, { headers: { 'x-guest-id': guestA } }).then((r) => r.json());
  assert.equal(mine.data.length, 1, 'one order, not the shop');
  assert.equal(mine.data[0].guestId, guestA, 'and it is this browser\'s');

  const theirs = await fetch(baseUrl, { headers: { 'x-guest-id': guestB } }).then((r) => r.json());
  assert.equal(theirs.data.length, 1);
  assert.equal(theirs.data[0].guestId, guestB, 'the other guest sees only their own');

  const noHeader = await fetch(baseUrl).then((r) => r.json());
  assert.deepEqual(noHeader.data, [], 'no guest id still means no orders');
});

test('a guest cannot open an order placed from another browser', async () => {
  const owner = `guest-test-${Date.now()}-owner`;
  const stranger = `guest-test-${Date.now()}-stranger`;

  const placed = await placeGuestOrder(owner, 'guest-owner@example.com');
  const id = placed.data.orderNumber || placed.data._id;

  const asOwner = await fetch(`${baseUrl}/${id}`, { headers: { 'x-guest-id': owner } });
  assert.equal(asOwner.status, 200, 'the guest who placed it can open it');

  const asStranger = await fetch(`${baseUrl}/${id}`, { headers: { 'x-guest-id': stranger } });
  assert.equal(asStranger.status, 404, 'another browser gets the not-found answer');

  const asNobody = await fetch(`${baseUrl}/${id}`);
  assert.equal(asNobody.status, 404, 'and so does a caller with no id at all');
});
