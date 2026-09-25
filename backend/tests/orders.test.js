process.env.NODE_ENV = 'test';

import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import orderRoutes, { stockKeyFor, reserveStock } from '../routes/orderRoutes.js';
import Product from '../models/Product.js';

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
    /* A Stripe order opens at `pending_payment` — holding stock, owing money,
       carrying a deadline. Cash on delivery opens at `unpaid`, because it has
       no online step to abandon and nothing to expire. Neither is `paid`:
       only a webhook whose signature has been checked may write that. */
    const expected = ['visa', 'mastercard', 'qr'].includes(paymentMethod) ? 'pending_payment' : 'unpaid';
    assert.equal(
      data.paymentStatus,
      expected,
      `an order paid by ${paymentMethod} must start ${expected}, not ${data.paymentStatus}`
    );
    assert.notEqual(data.paymentStatus, 'paid');
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
      items: [{ productId: 'AUT-ACC-001', name: 'Item', price: 20, quantity: 1, size: 'OS' }],
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
      items: [{ productId: 'AUT-ACC-001', name: 'Item', price: 20, quantity: 1, size: 'OS' }],
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

/* Contact details the courier has to be able to use.
 *
 * The address book has refused a malformed phone or postal code since it was
 * built, in routes/userRoutes.js. Checkout never used those rules: POST
 * /api/orders took whatever the browser sent, so an order could be written
 * with a phone of "abcdefg" and a postal code of "!!!". Measured on
 * production: that form advanced straight to the payment step.
 */
const orderWith = (customerOverrides) => ({
  items: [{ productId: 'AUT-ACC-001', name: 'Item', price: 20, quantity: 1, size: 'OS' }],
  customer: {
    firstName: 'QA', lastName: 'Tester', email: 'qa@example.com',
    phone: '0812345678', address: '1 Road', city: 'Bangkok',
    zipCode: '10110', country: 'Thailand',
    ...customerOverrides
  },
  paymentMethod: 'visa', subtotal: 20, shipping: 0, total: 20
});

const post = (payload) => fetch(baseUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

test('an order cannot carry a phone number nobody can call', async () => {
  const res = await post(orderWith({ phone: 'abcdefg' }));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.field, 'phone');
});

test('an order cannot carry a postal code nobody can deliver to', async () => {
  const res = await post(orderWith({ zipCode: '!!!' }));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.field, 'zipCode');
});

test('a phone number written with dashes is the same number', async () => {
  // People type 081-000-0000; refusing it would be a new bug, not a fix.
  const res = await post(orderWith({ phone: '081-000-0000' }));
  assert.notEqual(res.status, 400, 'a human-formatted number is still a valid one');
  const body = await res.json();
  assert.equal(
    body.data?.customer?.phone,
    '0810000000',
    'and it is stored in one form, digits only'
  );
});

test('C1. an order cannot carry an email nobody can write to', async () => {
  for (const email of ['not-an-email', 'a@b', '@example.com', 'two words@example.com', 'x@y.', { $ne: null }]) {
    const res = await post(orderWith({ email }));
    assert.equal(res.status, 400, `refused: ${JSON.stringify(email)}`);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.field, 'email');
  }
});

test('C1. a valid email is kept, lower-cased and trimmed', async () => {
  const res = await post(orderWith({ email: '  Buyer.One@Example.COM ' }));
  assert.equal(res.status, 201);
  const { data } = await res.json();
  assert.equal(data.customer.email, 'buyer.one@example.com');
});

test('a postal code of the wrong length is refused', async () => {
  for (const zip of ['1011', '101100', '1011a']) {
    const res = await post(orderWith({ zipCode: zip }));
    assert.equal(res.status, 400, `${zip} is not a Thai postal code`);
  }
});

/* ------------------------------------------------------------------ *
 * Server-side bundle discount eligibility
 * ------------------------------------------------------------------ */

test('A. complete bundle receives 12% discount calculated server-side', async () => {
  const payload = {
    customer: {
      firstName: 'Test', lastName: 'Bundle', email: 'bundle.a@matcha.test',
      phone: '0899999999', address: '100 Road', city: 'Bangkok', zipCode: '10110'
    },
    items: [
      { productId: 'AUT-TOP-009', quantity: 1, size: 'M' },
      { productId: 'AUT-BOT-003', quantity: 1, size: 'M' },
      { productId: 'AUT-ACC-007', quantity: 1, size: 'OS' },
      { productId: 'AUT-ACC-001', quantity: 1, size: 'OS' }
    ],
    paymentMethod: 'demo',
    shippingOption: 'standard'
  };

  const res = await post(payload);
  assert.equal(res.status, 201);
  const { data } = await res.json();

  const expectedSubtotal = 65.99 + 81.99 + 102.99 + 43.99; // 294.96
  const expectedDiscount = Math.round(expectedSubtotal * 0.12 * 100) / 100; // 35.40
  const expectedTotal = Math.round((expectedSubtotal - expectedDiscount) * 100) / 100; // 259.56

  assert.equal(data.subtotal, expectedSubtotal);
  assert.equal(data.discount, expectedDiscount);
  assert.equal(data.total, expectedTotal);
});

test('B. single item with isBundleItem: true does not get 12% discount', async () => {
  const payload = {
    customer: {
      firstName: 'Test', lastName: 'Bundle', email: 'bundle.b@matcha.test',
      phone: '0899999999', address: '100 Road', city: 'Bangkok', zipCode: '10110'
    },
    items: [
      { productId: 'AUT-TOP-009', quantity: 1, size: 'M', isBundleItem: true }
    ],
    paymentMethod: 'demo',
    shippingOption: 'standard'
  };

  const res = await post(payload);
  assert.equal(res.status, 201);
  const { data } = await res.json();

  assert.equal(data.subtotal, 65.99);
  assert.equal(data.discount, 0, 'server must ignore client isBundleItem flag on incomplete bundle');
});

test('C. 4 items not fulfilling required bundle categories do not get bundle discount', async () => {
  const payload = {
    customer: {
      firstName: 'Test', lastName: 'Bundle', email: 'bundle.c@matcha.test',
      phone: '0899999999', address: '100 Road', city: 'Bangkok', zipCode: '10110'
    },
    items: [
      { productId: 'AUT-TOP-009', quantity: 2, size: 'M', isBundleItem: true },
      { productId: 'AUT-BOT-003', quantity: 2, size: 'M', isBundleItem: true }
    ],
    paymentMethod: 'demo',
    shippingOption: 'standard'
  };

  const res = await post(payload);
  assert.equal(res.status, 201);
  const { data } = await res.json();

  assert.equal(data.discount, 0, 'no bundle discount if shoes or accessories are missing');
});

test('D. client sends isBundleItem: false but products satisfy bundle criteria -> server applies discount', async () => {
  const payload = {
    customer: {
      firstName: 'Test', lastName: 'Bundle', email: 'bundle.d@matcha.test',
      phone: '0899999999', address: '100 Road', city: 'Bangkok', zipCode: '10110'
    },
    items: [
      { productId: 'AUT-TOP-009', quantity: 1, size: 'M', isBundleItem: false },
      { productId: 'AUT-BOT-003', quantity: 1, size: 'M', isBundleItem: false },
      { productId: 'AUT-ACC-007', quantity: 1, size: 'OS', isBundleItem: false },
      { productId: 'AUT-ACC-001', quantity: 1, size: 'OS', isBundleItem: false }
    ],
    paymentMethod: 'demo',
    shippingOption: 'standard'
  };

  const res = await post(payload);
  assert.equal(res.status, 201);
  const { data } = await res.json();

  const expectedSubtotal = 65.99 + 81.99 + 102.99 + 43.99;
  const expectedDiscount = Math.round(expectedSubtotal * 0.12 * 100) / 100;
  assert.equal(data.discount, expectedDiscount, 'server is source of truth even when client sent false');
});

test('E. client spoofing price, category, and isBundleItem does not fool server calculation', async () => {
  const payload = {
    customer: {
      firstName: 'Test', lastName: 'Bundle', email: 'bundle.e@matcha.test',
      phone: '0899999999', address: '100 Road', city: 'Bangkok', zipCode: '10110'
    },
    items: [
      { productId: 'AUT-ACC-001', price: 1.00, category: 'Tops', quantity: 1, size: 'OS', isBundleItem: true }
    ],
    paymentMethod: 'demo',
    shippingOption: 'standard'
  };

  const res = await post(payload);
  assert.equal(res.status, 201);
  const { data } = await res.json();

  // AUT-ACC-001 real price is 43.99, not 1.00. Real category is Accessories, not Tops. Single item is not a bundle.
  assert.equal(data.subtotal, 43.99, 'price must come from catalog');
  assert.equal(data.discount, 0, 'must not give bundle discount based on fake category/flag');
});

/* C2 — the price is the server's or there is no order.

   An id the catalogue does not know used to be priced at whatever the browser
   sent, or $45, and only the stock reservation happened to stop it, and only
   with MongoDB connected. Without MongoDB the order was written at that price. */
const c2Customer = {
  firstName: 'Test', lastName: 'Price', email: 'price.check@matcha.test',
  phone: '0899999999', address: '100 Road', city: 'Bangkok', zipCode: '10110'
};

test('C2. an unknown product is refused, whatever price the browser puts on it', async () => {
  for (const item of [
    { productId: 'NOT-A-REAL-SKU', price: 0.01, quantity: 1, size: 'M' },
    { productId: 'NOT-A-REAL-SKU', quantity: 1, size: 'M' },
    { productId: { $ne: null }, price: 1, quantity: 1, size: 'M' },
  ]) {
    const res = await post({ customer: c2Customer, items: [item], paymentMethod: 'demo', shippingOption: 'standard' });
    assert.equal(res.status, 400, `refused: ${JSON.stringify(item.productId)}`);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.data, undefined, 'no order was written');
  }
});

test('C2. one unknown line refuses the whole order, not just that line', async () => {
  const res = await post({
    customer: c2Customer,
    items: [
      { productId: 'AUT-ACC-001', quantity: 1, size: 'OS' },
      { productId: 'GHOST-001', price: 999, quantity: 1, size: 'M' },
    ],
    paymentMethod: 'demo',
    shippingOption: 'standard'
  });
  assert.equal(res.status, 400);
});

test('C2. a tampered price on a real product is replaced by the catalogue price', async () => {
  const res = await post({
    customer: c2Customer,
    items: [{ productId: 'AUT-ACC-001', price: 0.01, priceAtPurchase: 0.01, quantity: 2, size: 'OS' }],
    subtotal: 0.02,
    total: 0.02,
    paymentMethod: 'demo',
    shippingOption: 'standard'
  });
  assert.equal(res.status, 201);
  const { data } = await res.json();
  assert.equal(data.items[0].priceAtPurchase, 43.99);
  assert.equal(data.subtotal, 87.98);
  assert.ok(data.total >= 87.98 - data.discount, 'total is built from the server subtotal');
  assert.notEqual(data.total, 0.02);
});

test('C2. stock reservation refuses a bucket that cannot cover the line', async () => {
  const product = { id: 'AUT-TOP-009', price: 50, sizes: ['S', 'M'], sizeStock: [{ size: 'S', stock: 1 }, { size: 'M', stock: 1 }] };
  let filterUsed = null;
  mock.method(Product, 'updateOne', async (filter) => { filterUsed = filter; return { modifiedCount: 0 }; });
  try {
    await assert.rejects(
      reserveStock([{ productId: 'AUT-TOP-009', size: 'M', quantity: 5, name: 'Hoodie' }], new Map([['AUT-TOP-009', product]]), null),
      (err) => err.shortfall?.productId === 'AUT-TOP-009' && err.shortfall.requested === 5
    );
    assert.deepEqual(filterUsed.sizeStock, { $elemMatch: { size: 'M', stock: { $gte: 5 } } });
  } finally {
    mock.restoreAll();
  }
});
