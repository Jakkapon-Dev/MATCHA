import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import productRoutes from '../routes/productRoutes.js';
import productsData from '../data/products.js';
import { filterInMemoryProducts } from '../utils/productFilters.js';

let server;
let baseUrl;

before(async () => {
  // Ensure connection is offline so productController uses in-memory fallback
  mongoose.connection.readyState = 0;
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

test('in-memory: GET /api/products returns all products with default pagination and filter stats', async () => {
  const res = await fetch(`${baseUrl}/products`);
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.success, true);
  assert.equal(body.pagination.total, productsData.length);
  assert.equal(body.pagination.page, 1);
  assert.equal(body.pagination.limit, 24);
  assert.equal(body.pagination.totalPages, Math.ceil(productsData.length / 24) || 1);
  assert.equal(body.pagination.hasNextPage, productsData.length > 24);
  assert.equal(body.pagination.hasPrevPage, false);
  assert.equal(body.data.length, Math.min(24, productsData.length));

  // Available filters metadata
  assert.equal(body.availableFilters.totalAll, productsData.length);
  assert.equal(body.availableFilters.priceMin, Math.min(...productsData.map(p => p.price)));
  assert.equal(body.availableFilters.priceMax, Math.max(...productsData.map(p => p.price)));

  // Each item should be presented with canonical stock and inStock
  for (const item of body.data) {
    assert.equal(typeof item.stock, 'number');
    assert.equal(typeof item.quantity, 'number');
    assert.equal(typeof item.inStock, 'boolean');
  }
});

test('in-memory: GET /api/products?category=... filters by category case-insensitively and respects ALL', async () => {
  const resTops = await fetch(`${baseUrl}/products?category=Tops&limit=100`);
  const bodyTops = await resTops.json();
  assert.equal(bodyTops.success, true);
  assert.ok(bodyTops.data.length > 0);
  for (const item of bodyTops.data) {
    assert.equal(item.category.toLowerCase(), 'tops');
  }

  // Case-insensitivity check
  const resLower = await fetch(`${baseUrl}/products?category=tops&limit=100`);
  const bodyLower = await resLower.json();
  assert.equal(bodyLower.pagination.total, bodyTops.pagination.total);

  // 'ALL' should not filter
  const resAll = await fetch(`${baseUrl}/products?category=ALL&limit=100`);
  const bodyAll = await resAll.json();
  assert.equal(bodyAll.pagination.total, productsData.length);
});

test('in-memory: GET /api/products?season=... filters by season and respects ALL', async () => {
  const resAutumn = await fetch(`${baseUrl}/products?season=Autumn&limit=100`);
  const bodyAutumn = await resAutumn.json();
  assert.equal(bodyAutumn.success, true);
  assert.ok(bodyAutumn.data.length > 0);
  for (const item of bodyAutumn.data) {
    assert.equal(item.season.toLowerCase(), 'autumn');
  }

  // ALL should return unfiltered
  const resAll = await fetch(`${baseUrl}/products?season=ALL&limit=100`);
  const bodyAll = await resAll.json();
  assert.equal(bodyAll.pagination.total, productsData.length);
});

test('in-memory: GET /api/products?search=... performs case-insensitive substring match and trims input', async () => {
  const res = await fetch(`${baseUrl}/products?search=%20scarves%20&limit=100`);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data.length > 0);
  for (const item of body.data) {
    const q = 'scarves';
    const matches =
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.color.toLowerCase().includes(q) ||
      (item.tag && item.tag.toLowerCase().includes(q));
    assert.ok(matches, `Item ${item.id} should match query "${q}"`);
  }
});

test('in-memory: GET /api/products?color=... filters by color and respects ALL', async () => {
  const res = await fetch(`${baseUrl}/products?color=Burnt%20Orange&limit=100`);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data.length > 0);
  for (const item of body.data) {
    assert.equal(item.color.toLowerCase(), 'burnt orange');
  }

  const resAll = await fetch(`${baseUrl}/products?color=ALL&limit=100`);
  const bodyAll = await resAll.json();
  assert.equal(bodyAll.pagination.total, productsData.length);
});

test('in-memory: GET /api/products?fit=... filters by fit and respects ALL', async () => {
  const res = await fetch(`${baseUrl}/products?fit=Relaxed&limit=100`);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data.length > 0);
  for (const item of body.data) {
    assert.equal(item.fit.toLowerCase(), 'relaxed');
  }

  const resAll = await fetch(`${baseUrl}/products?fit=ALL&limit=100`);
  const bodyAll = await resAll.json();
  assert.equal(bodyAll.pagination.total, productsData.length);
});

test('in-memory: GET /api/products?inStockOnly=true filters by raw inStock field', async () => {
  const res = await fetch(`${baseUrl}/products?inStockOnly=true&limit=100`);
  const body = await res.json();
  assert.equal(body.success, true);
  const expectedTotal = productsData.filter(p => p.inStock).length;
  assert.equal(body.pagination.total, expectedTotal);
  // Ensure none of the products whose raw data has inStock === false are returned
  const rawOutOfStockIds = new Set(productsData.filter(p => !p.inStock).map(p => p.id));
  for (const item of body.data) {
    assert.equal(rawOutOfStockIds.has(item.id), false, `Out-of-stock item ${item.id} should not be included`);
  }
});

test('in-memory: GET /api/products with minPrice and maxPrice restricts price range', async () => {
  const res = await fetch(`${baseUrl}/products?minPrice=45&maxPrice=70&limit=100`);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data.length > 0);
  for (const item of body.data) {
    assert.ok(item.price >= 45 && item.price <= 70, `Item price ${item.price} should be between 45 and 70`);
  }

  // Invalid min/max fallback to 0 and 1000
  const resFallback = await fetch(`${baseUrl}/products?minPrice=invalid&maxPrice=invalid&limit=100`);
  const bodyFallback = await resFallback.json();
  assert.equal(bodyFallback.pagination.total, productsData.length);
});

test('in-memory: GET /api/products sorting options', async () => {
  // 1. price-asc
  const resAsc = await fetch(`${baseUrl}/products?sort=price-asc&limit=100`);
  const bodyAsc = await resAsc.json();
  for (let i = 0; i < bodyAsc.data.length - 1; i++) {
    assert.ok(bodyAsc.data[i].price <= bodyAsc.data[i + 1].price, `Price should be ascending at index ${i}`);
  }

  // 2. price-desc
  const resDesc = await fetch(`${baseUrl}/products?sort=price-desc&limit=100`);
  const bodyDesc = await resDesc.json();
  for (let i = 0; i < bodyDesc.data.length - 1; i++) {
    assert.ok(bodyDesc.data[i].price >= bodyDesc.data[i + 1].price, `Price should be descending at index ${i}`);
  }

  // 3. rating
  const resRating = await fetch(`${baseUrl}/products?sort=rating&limit=100`);
  const bodyRating = await resRating.json();
  for (let i = 0; i < bodyRating.data.length - 1; i++) {
    assert.ok(bodyRating.data[i].rating >= bodyRating.data[i + 1].rating, `Rating should be descending at index ${i}`);
  }

  // 4. newest
  const resNewest = await fetch(`${baseUrl}/products?sort=newest&limit=100`);
  const bodyNewest = await resNewest.json();
  for (let i = 0; i < bodyNewest.data.length - 1; i++) {
    assert.ok(new Date(bodyNewest.data[i].createdAt) >= new Date(bodyNewest.data[i + 1].createdAt), `Date should be descending at index ${i}`);
  }

  // 5. featured (default): featured items first
  const resFeatured = await fetch(`${baseUrl}/products?sort=featured&limit=100`);
  const bodyFeatured = await resFeatured.json();
  let seenNonFeatured = false;
  for (const item of bodyFeatured.data) {
    if (seenNonFeatured && item.isFeatured) {
      assert.fail('Featured item found after non-featured item');
    }
    if (!item.isFeatured) seenNonFeatured = true;
  }
});

test('in-memory: GET /api/products pagination handles page slices and out-of-range pages', async () => {
  const resPage1 = await fetch(`${baseUrl}/products?page=1&limit=5`);
  const body1 = await resPage1.json();
  assert.equal(body1.data.length, 5);
  assert.equal(body1.pagination.page, 1);
  assert.equal(body1.pagination.limit, 5);
  assert.equal(body1.pagination.hasNextPage, true);
  assert.equal(body1.pagination.hasPrevPage, false);

  const resPage2 = await fetch(`${baseUrl}/products?page=2&limit=5`);
  const body2 = await resPage2.json();
  assert.equal(body2.data.length, 5);
  assert.equal(body2.pagination.page, 2);
  assert.equal(body2.pagination.hasNextPage, true);
  assert.equal(body2.pagination.hasPrevPage, true);
  assert.notEqual(body1.data[0].id, body2.data[0].id);

  // Out of range page
  const resOut = await fetch(`${baseUrl}/products?page=999&limit=10`);
  const bodyOut = await resOut.json();
  assert.equal(bodyOut.data.length, 0);
  assert.equal(bodyOut.pagination.page, 999);
  assert.equal(bodyOut.pagination.hasNextPage, false);
  assert.equal(bodyOut.pagination.hasPrevPage, true);
});

test('in-memory: GET /api/products applies combined filters simultaneously', async () => {
  const res = await fetch(`${baseUrl}/products?category=Accessories&season=Autumn&fit=Relaxed&minPrice=40&maxPrice=60&sort=price-asc&limit=50`);
  const body = await res.json();
  assert.equal(body.success, true);
  for (const item of body.data) {
    assert.equal(item.category.toLowerCase(), 'accessories');
    assert.equal(item.season.toLowerCase(), 'autumn');
    assert.equal(item.fit.toLowerCase(), 'relaxed');
    assert.ok(item.price >= 40 && item.price <= 60);
  }
});

test('in-memory: GET /api/products returns empty array with clean pagination when no match is found', async () => {
  const res = await fetch(`${baseUrl}/products?search=NONEXISTENT_QUERY_12345_XYZ`);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.length, 0);
  assert.equal(body.pagination.total, 0);
  assert.equal(body.pagination.page, 1);
  assert.equal(body.pagination.totalPages, 1);
  assert.equal(body.pagination.hasNextPage, false);
  assert.equal(body.pagination.hasPrevPage, false);
});

test('unit: filterInMemoryProducts does not mutate the input products array', () => {
  const original = [
    { id: 'P2', price: 100, isFeatured: false, createdAt: '2026-01-02' },
    { id: 'P1', price: 50, isFeatured: true, createdAt: '2026-01-01' }
  ];
  const snapshot = JSON.stringify(original);

  const res = filterInMemoryProducts(original, { sort: 'price-asc' });
  assert.equal(JSON.stringify(original), snapshot, 'Input array must not be mutated');
  assert.equal(res.products[0].id, 'P1');
  assert.equal(res.products[1].id, 'P2');
});

test('unit: filterInMemoryProducts handles empty array and missing options gracefully', () => {
  const resEmpty = filterInMemoryProducts([]);
  assert.deepEqual(resEmpty.products, []);
  assert.equal(resEmpty.pagination.total, 0);
  assert.equal(resEmpty.pagination.page, 1);
  assert.equal(resEmpty.pagination.totalPages, 1);
  assert.equal(resEmpty.pagination.limit, 24);
  assert.equal(resEmpty.pagination.hasNextPage, false);
  assert.equal(resEmpty.pagination.hasPrevPage, false);

  const resUndefined = filterInMemoryProducts(undefined, undefined);
  assert.deepEqual(resUndefined.products, []);
  assert.equal(resUndefined.pagination.total, 0);
});
