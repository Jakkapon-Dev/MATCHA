import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import productRoutes from '../routes/productRoutes.js';
import Product from '../models/Product.js';
import { User } from '../services/userStore.js';
import { getJwtSecret } from '../middleware/auth.js';

let server;
let baseUrl;

const adminToken = jwt.sign(
  { id: 'test-admin-id', role: 'Admin', email: 'admin@matcha.test' },
  getJwtSecret(),
  { expiresIn: '1h' }
);

const memberToken = jwt.sign(
  { id: 'test-member-id', role: 'Member', email: 'member@matcha.test' },
  getJwtSecret(),
  { expiresIn: '1h' }
);

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', productRoutes);

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

test('GET /api/categories returns formatted categories with counts', async () => {
  const res = await fetch(`${baseUrl}/categories`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.data.length >= 5);

  const allCategory = data.data.find(c => c.id === 'ALL');
  assert.ok(allCategory);
  assert.ok(allCategory.count > 0);
});

test('GET /api/products returns paginated product list and available filters', async () => {
  const res = await fetch(`${baseUrl}/products?page=1&limit=10`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.equal(data.data.length, 10);
  assert.ok(data.pagination);
  assert.equal(data.pagination.page, 1);
  assert.equal(data.pagination.limit, 10);
  assert.ok(data.pagination.total > 0);
});

test('GET /api/products?category=Tops filters products strictly by category', async () => {
  const res = await fetch(`${baseUrl}/products?category=Tops&limit=50`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  for (const item of data.data) {
    assert.equal(item.category.toLowerCase(), 'tops');
  }
});

test('GET /api/products/:id retrieves known product or returns 404', async () => {
  const resValid = await fetch(`${baseUrl}/products/AUT-ACC-001`);
  assert.equal(resValid.status, 200);
  const dataValid = await resValid.json();
  assert.equal(dataValid.success, true);
  assert.equal(dataValid.data.id, 'AUT-ACC-001');

  const resInvalid = await fetch(`${baseUrl}/products/NON-EXISTENT-SKU-999`);
  assert.equal(resInvalid.status, 404);
  const dataInvalid = await resInvalid.json();
  assert.equal(dataInvalid.success, false);
});

test('POST /api/products blocks unauthenticated and non-admin requests', async () => {
  // 1. Guest request (no token) -> 401
  const resGuest = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hacked Product', price: 99 })
  });
  assert.equal(resGuest.status, 401);

  // 2. Member request (non-admin) -> 403
  const resMember = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${memberToken}`
    },
    body: JSON.stringify({ name: 'Member Created Product', price: 99 })
  });
  assert.equal(resMember.status, 403);
});

test('POST /api/products reports unavailable persistence to Admin', async () => {
  const newGarment = {
    name: 'Artisan Linen Robe',
    category: 'Outerwear',
    price: 120,
    stock: 25,
    color: 'Sage'
  };

  const res = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify(newGarment)
  });

  assert.equal(res.status, 503);
  const data = await res.json();
  assert.equal(data.success, false);
});

/* The success path, which went missing when the route stopped pretending.

   There used to be a test called "POST /api/products allows Admin request"
   asserting 201. It passed without a database because createProduct answered
   201 whether or not anything had been stored. Once that was corrected to a
   503, the test was rewritten to assert the 503 — which is right, but it left
   nobody checking that an administrator can actually create a product when
   the database is there, so the route could have started refusing every write
   and the suite would still have been green.

   The connection is faked rather than opened, the way the media tests do it,
   so this stays offline and touches no real data. save() is stubbed to return
   what a stored document would: the route's own generated id included. */
test('POST /api/products stores the garment for an Admin when the database is up', async () => {
  mongoose.connection.readyState = 1;
  /* With the connection reported as up, requireAuth stops short-circuiting and
     looks the account up for real, which without a server means a ten-second
     Mongoose buffer and then a 401. Returning null here is honest — this token
     belongs to no stored account — and requireAuth falls back to the identity
     inside the verified token, which is what the other route tests rely on. */
  mock.method(User, 'findById', () => ({ lean: async () => null }));
  const saved = [];
  mock.method(Product.prototype, 'save', async function save() {
    saved.push(this.toObject ? this.toObject() : { ...this });
    return this;
  });

  try {
    const res = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Artisan Linen Robe',
        category: 'Outerwear',
        price: 120,
        stock: 25,
        color: 'Sage'
      })
    });

    assert.equal(res.status, 201, 'an administrator can create with a live database');
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data, 'the stored document comes back');
    assert.equal(saved.length, 1, 'it was actually written, not echoed');
    assert.equal(saved[0].name, 'Artisan Linen Robe');
    assert.equal(saved[0].stock, 25, 'the stock count is stored');
    assert.ok(saved[0].id, 'an id is generated when none is supplied');
    /* createProduct also copies stock onto a `quantity` field, which the
       Product schema does not declare, so Mongoose drops it before the write.
       Asserted here so the mapping's uselessness is on the record rather than
       looking like it does something. Nothing depends on it: the admin restock
       call sends stock and quantity together, and stock is the one that lands. */
    assert.equal(saved[0].quantity, undefined, 'the quantity copy is discarded by the schema');
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});
