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
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});

/* A restock has to reach the database.

   The admin console sends `quantity`; the Product schema stores `stock` and
   declares no `quantity` path, so with strict mode on Mongoose dropped the
   field. updateProduct matched the product, set nothing and answered
   `success: true`. Measured against the running server before the fix: PUT
   {quantity: 53} on a product holding 50 returned success and left it at 50.
   Every restock an administrator did was lost at the next reload.

   Both spellings are asserted because both are in use — the console sends
   quantity, older callers send stock. */
test('PUT /api/products/:id writes a quantity-only restock to stock', async () => {
  mongoose.connection.readyState = 1;
  mock.method(User, 'findById', () => ({ lean: async () => null }));
  const writes = [];
  // Not migrated to per-size stock: its `stock` is the authoritative figure,
  // so a total-only write is exactly right for it.
  mock.method(Product, 'findOne', () => ({ lean: async () => ({ id: 'SKU-1', sizeStock: [] }) }));
  mock.method(Product, 'findOneAndUpdate', async (_filter, update) => {
    writes.push(update.$set);
    return { id: 'SKU-1', stock: update.$set.stock };
  });

  try {
    for (const [sent, label] of [[{ quantity: 53 }, 'quantity'], [{ stock: 41 }, 'stock']]) {
      const res = await fetch(`${baseUrl}/products/SKU-1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(sent)
      });
      assert.equal(res.status, 200, `a ${label} update is accepted`);
    }

    assert.equal(writes.length, 2);
    assert.equal(writes[0].stock, 53, 'quantity is written to the field the schema has');
    assert.equal(writes[0].quantity, undefined, 'and is not passed through to be dropped');
    assert.equal(writes[1].stock, 41, 'a stock update still works unchanged');
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});

/* A product that tracks stock per size has no total you can simply set.

   `stock` is the sum of `sizeStock`, kept in step by a pre-validate hook that
   findOneAndUpdate does not run. Writing a total here set a number no size
   bucket agreed with: the admin table showed it, order placement kept drawing
   on the untouched per-size figures, and the next full save recomputed the
   total straight back down. Four production rows drifted that way, each
   reading 12 against 50 units actually spread across their sizes.

   The units have to land in a named size, which is what the restock endpoint
   below is for. */
test('PUT /api/products/:id refuses a total-only restock on a per-size product', async () => {
  mongoose.connection.readyState = 1;
  mock.method(User, 'findById', () => ({ lean: async () => null }));
  let wrote = false;
  mock.method(Product, 'findOne', () => ({
    lean: async () => ({ id: 'LOOK-06-VEST', sizeStock: [{ size: 'S', stock: 25 }, { size: 'M', stock: 25 }] })
  }));
  mock.method(Product, 'findOneAndUpdate', async () => { wrote = true; return null; });

  try {
    const res = await fetch(`${baseUrl}/products/LOOK-06-VEST`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ quantity: 62 })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, 'SIZE_STOCK_REQUIRED');
    assert.deepEqual(body.sizes, ['S', 'M'], 'the caller is told which sizes it can restock');
    assert.equal(wrote, false, 'nothing was written');
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});

/* The replacement path: a signed delta against one size bucket.

   It is a single conditional findOneAndUpdate, the same shape order placement
   uses, so a restock racing an order cannot drive a bucket below zero. `stock`
   moves by the same amount in the same operation, which is what keeps the
   derived total agreeing with the buckets it sums. */
test('PATCH /api/products/:id/restock adds units to one size and the total together', async () => {
  mongoose.connection.readyState = 1;
  mock.method(User, 'findById', () => ({ lean: async () => null }));
  const calls = [];
  mock.method(Product, 'findOne', () => ({
    lean: async () => ({ id: 'LOOK-06-VEST', stock: 50, sizeStock: [{ size: 'S', stock: 25 }, { size: 'M', stock: 25 }] })
  }));
  mock.method(Product, 'findOneAndUpdate', async (filter, update, options) => {
    calls.push({ filter, update, options });
    return { _id: 'oid-vest', id: 'LOOK-06-VEST', stock: 62, inStock: true, sizeStock: [{ size: 'S', stock: 25 }, { size: 'M', stock: 37 }] };
  });

  try {
    const res = await fetch(`${baseUrl}/products/LOOK-06-VEST/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ delta: 12, size: 'M' })
    });
    assert.equal(res.status, 200);

    assert.equal(calls.length, 1);
    const [{ update, options }] = calls;
    assert.equal(update.$inc['sizeStock.$[bucket].stock'], 12, 'the size bucket moves');
    assert.equal(update.$inc.stock, 12, 'and the derived total moves with it');
    assert.deepEqual(options.arrayFilters, [{ 'bucket.size': 'M' }]);
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});

/* Without a size there is nowhere for the units to go, and guessing one would
   be inventing inventory. */
test('PATCH /api/products/:id/restock requires a size on a per-size product', async () => {
  mongoose.connection.readyState = 1;
  mock.method(User, 'findById', () => ({ lean: async () => null }));
  let wrote = false;
  mock.method(Product, 'findOne', () => ({
    lean: async () => ({ id: 'LOOK-06-VEST', stock: 50, sizeStock: [{ size: 'S', stock: 25 }, { size: 'M', stock: 25 }] })
  }));
  mock.method(Product, 'findOneAndUpdate', async () => { wrote = true; return null; });

  try {
    const res = await fetch(`${baseUrl}/products/LOOK-06-VEST/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ delta: 12 })
    });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).code, 'SIZE_REQUIRED');
    assert.equal(wrote, false);
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});

/* A garment the migration has not reached still keeps its stock in one place,
   and must stay restockable without a size. */
test('PATCH /api/products/:id/restock adjusts the total on a product with no size buckets', async () => {
  mongoose.connection.readyState = 1;
  mock.method(User, 'findById', () => ({ lean: async () => null }));
  const calls = [];
  mock.method(Product, 'findOne', () => ({ lean: async () => ({ id: 'SKU-1', stock: 50, sizeStock: [] }) }));
  mock.method(Product, 'findOneAndUpdate', async (filter, update) => {
    calls.push({ filter, update });
    return { id: 'SKU-1', stock: 55, inStock: true };
  });

  try {
    const res = await fetch(`${baseUrl}/products/SKU-1/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ delta: 5 })
    });
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].update.$inc.stock, 5);
    assert.equal(calls[0].update.$inc['sizeStock.$[bucket].stock'], undefined);
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});

/* A garment restocked from zero has to come back on sale.

   `inStock` is derived from the total, and it is set from the figure the write
   actually landed on rather than the one read a moment before it — an order
   placed in between would make a guess from the stale total wrong, and a
   product wrongly left marked out of stock vanishes from the shop. */
test('PATCH /api/products/:id/restock brings a sold-out size back on sale', async () => {
  mongoose.connection.readyState = 1;
  mock.method(User, 'findById', () => ({ lean: async () => null }));
  const corrections = [];
  mock.method(Product, 'findOne', () => ({
    lean: async () => ({ _id: 'oid-1', id: 'SKU-1', stock: 0, inStock: false, sizeStock: [] })
  }));
  mock.method(Product, 'findOneAndUpdate', async () => ({ _id: 'oid-1', id: 'SKU-1', stock: 8, inStock: false }));
  mock.method(Product, 'updateOne', async (filter, update) => {
    corrections.push(update.$set);
    return { modifiedCount: 1 };
  });

  try {
    const res = await fetch(`${baseUrl}/products/SKU-1/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ delta: 8 })
    });
    assert.equal(res.status, 200);
    assert.deepEqual(corrections, [{ stock: 8, inStock: true }]);
    assert.equal((await res.json()).data.inStock, true, 'the caller is told the corrected value');
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});

/* A garment sold without sizes keeps everything in the single ONE bucket.
   There is nothing to choose, so the console does not ask and the endpoint
   does not demand it — but the units still have to land in the bucket, not on
   the total, or the two go out of step exactly as before. */
test('PATCH /api/products/:id/restock targets the ONE bucket without being told to', async () => {
  mongoose.connection.readyState = 1;
  mock.method(User, 'findById', () => ({ lean: async () => null }));
  const calls = [];
  mock.method(Product, 'findOne', () => ({
    lean: async () => ({ _id: 'oid-look', id: 'LOOK-01-CARGO', stock: 50, sizeStock: [{ size: 'ONE', stock: 50 }] })
  }));
  mock.method(Product, 'findOneAndUpdate', async (filter, update, options) => {
    calls.push({ filter, update, options });
    return { _id: 'oid-look', id: 'LOOK-01-CARGO', stock: 62, inStock: true, sizeStock: [{ size: 'ONE', stock: 62 }] };
  });

  try {
    const res = await fetch(`${baseUrl}/products/LOOK-01-CARGO/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ delta: 12 })
    });
    assert.equal(res.status, 200);

    const [{ update, options }] = calls;
    assert.equal(update.$inc['sizeStock.$[bucket].stock'], 12, 'the ONE bucket moves');
    assert.equal(update.$inc.stock, 12, 'and the derived total moves with it');
    assert.deepEqual(options.arrayFilters, [{ 'bucket.size': 'ONE' }]);

    const body = await res.json();
    assert.equal(body.data.stock, 62, 'the persisted product comes back');
    assert.equal(body.data.sizeStock[0].stock, 62);
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});

/* Removing more than a bucket holds must fail rather than go negative.

   The guard is the condition on the update itself, not a check this code runs
   first: a read-then-write would let an order slip in between and take the
   bucket below zero anyway. */
test('PATCH /api/products/:id/restock cannot drive a size below zero', async () => {
  mongoose.connection.readyState = 1;
  mock.method(User, 'findById', () => ({ lean: async () => null }));
  let filterUsed = null;
  mock.method(Product, 'findOne', () => ({
    lean: async () => ({ _id: 'oid-vest', id: 'LOOK-06-VEST', stock: 8, sizeStock: [{ size: 'S', stock: 3 }, { size: 'M', stock: 5 }] })
  }));
  // The condition does not match, which is what the database would do.
  mock.method(Product, 'findOneAndUpdate', async (filter) => { filterUsed = filter; return null; });

  try {
    const res = await fetch(`${baseUrl}/products/LOOK-06-VEST/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ delta: -9, size: 'M' })
    });
    assert.equal(res.status, 409, 'the shortfall is refused, not clamped');
    assert.deepEqual(
      filterUsed.sizeStock,
      { $elemMatch: { size: 'M', stock: { $gte: 9 } } },
      'the floor is enforced by the update condition, not by a prior read'
    );
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});

test('PATCH /api/products/:id/restock cannot drive an unsized product below zero', async () => {
  mongoose.connection.readyState = 1;
  mock.method(User, 'findById', () => ({ lean: async () => null }));
  let filterUsed = null;
  mock.method(Product, 'findOne', () => ({ lean: async () => ({ _id: 'oid-1', id: 'SKU-1', stock: 4, sizeStock: [] }) }));
  mock.method(Product, 'findOneAndUpdate', async (filter) => { filterUsed = filter; return null; });

  try {
    const res = await fetch(`${baseUrl}/products/SKU-1/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ delta: -10 })
    });
    assert.equal(res.status, 409);
    assert.deepEqual(filterUsed.stock, { $gte: 10 });
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});

/* Two administrators restocking the same size at the same moment.
 *
 * This is the failure the old route had by construction: it read `stock`,
 * added the amount in JavaScript and wrote the result back, so the second
 * write overwrote the first and one of the two restocks disappeared. The
 * replacement sends the change itself, so the database applies both.
 *
 * The mock stands in for the bucket: every call applies its own $inc to one
 * shared figure, exactly as a single-document update would.
 */
test('concurrent restocks of the same size both land', async () => {
  mongoose.connection.readyState = 1;
  mock.method(User, 'findById', () => ({ lean: async () => null }));

  let bucket = 25;
  mock.method(Product, 'findOne', () => ({
    lean: async () => ({ _id: 'oid-vest', id: 'LOOK-06-VEST', stock: bucket, sizeStock: [{ size: 'M', stock: bucket }] })
  }));
  mock.method(Product, 'findOneAndUpdate', async (_filter, update) => {
    // Yield first, so both requests have read before either writes — the
    // interleaving that lost a restock before.
    await new Promise(resolve => setImmediate(resolve));
    bucket += update.$inc['sizeStock.$[bucket].stock'];
    return { _id: 'oid-vest', id: 'LOOK-06-VEST', stock: bucket, inStock: true, sizeStock: [{ size: 'M', stock: bucket }] };
  });

  try {
    const restock = (delta) => fetch(`${baseUrl}/products/LOOK-06-VEST/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ delta, size: 'M' })
    });

    const [a, b] = await Promise.all([restock(10), restock(7)]);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(bucket, 42, '25 + 10 + 7 — neither restock was overwritten by the other');
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});

/* The four production rows reading 12 against 50 units spread across their
   sizes came from writes that set the total without touching the buckets.
   Restocking such a row must not carry the drift forward: the buckets are
   what order placement decrements, so they are what the total is rebuilt
   from. */
test('PATCH /api/products/:id/restock rebuilds a total that drifted from its buckets', async () => {
  mongoose.connection.readyState = 1;
  mock.method(User, 'findById', () => ({ lean: async () => null }));
  const corrections = [];
  mock.method(Product, 'findOne', () => ({
    lean: async () => ({ _id: 'oid-shirt', id: 'LOOK-06-SHIRT', stock: 12, sizeStock: [{ size: 'M', stock: 25 }, { size: 'L', stock: 25 }] })
  }));
  // The drifted total moves by the delta and still disagrees with the buckets.
  mock.method(Product, 'findOneAndUpdate', async () => ({
    _id: 'oid-shirt', id: 'LOOK-06-SHIRT', stock: 17, inStock: true,
    sizeStock: [{ size: 'M', stock: 30 }, { size: 'L', stock: 25 }]
  }));
  mock.method(Product, 'updateOne', async (_filter, update) => {
    corrections.push(update.$set);
    return { modifiedCount: 1 };
  });

  try {
    const res = await fetch(`${baseUrl}/products/LOOK-06-SHIRT/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ delta: 5, size: 'M' })
    });
    assert.equal(res.status, 200);
    assert.deepEqual(corrections, [{ stock: 55, inStock: true }], 'the total is rebuilt from the buckets');
    assert.equal((await res.json()).data.stock, 55, 'and the caller is given the corrected product');
  } finally {
    mock.restoreAll();
    mongoose.connection.readyState = 0;
  }
});
