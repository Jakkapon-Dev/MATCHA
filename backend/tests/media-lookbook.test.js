import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// No .env is loaded. All database calls below are replaced in memory.
process.env.JWT_SECRET = 'isolated-media-test-key-not-for-production';
process.env.MEDIA_STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'matcha-media-test-'));

import sharp from 'sharp';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

import { prepareImage, isManagedUrl, storeImage, deleteImage } from '../services/mediaStorage.js';
import { defaultLookbooks, resolveLookbooks } from '../services/lookbook.js';
import { findLinkedProducts } from '../routes/lookbookRoutes.js';
import router from '../routes/mediaLookbook.js';
import { setAuthGuards } from '../routes/mediaRoutes.js';
import Media from '../models/MediaAsset.js';
import Lookbook from '../models/Lookbook.js';

const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ email: String, role: String }));
const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({ id: String, name: String, image: String, price: Number, color: String, quantity: Number, sizes: Array, variants: Array, gallery: Array, mediaRevision: Number }, { strict: false }));

const issueToken = u => jwt.sign({ _id: u._id, email: u.email, role: u.role }, process.env.JWT_SECRET);
const admin = { _id: new mongoose.Types.ObjectId(), email: 'media-test@example.invalid', role: 'Admin' };
const user = { _id: new mongoose.Types.ObjectId(), email: 'viewer-test@example.invalid', role: 'User' };
let server, base, image;
const query = data => ({ sort() { return this; }, skip() { return this; }, limit() { return this; }, select() { return this; }, lean: async () => data });
const headers = { Authorization: `Bearer ${issueToken(admin)}`, 'Content-Type': 'application/json' };

before(async () => {
  setAuthGuards({
    authRequired: (req, res, next) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
      try {
        req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        next();
      } catch {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
    },
    adminOnly: (req, res, next) => {
      if (req.user?.role !== 'Admin') return res.status(403).json({ success: false, message: 'Forbidden' });
      next();
    }
  });
  image = await sharp({ create: { width: 1800, height: 900, channels: 3, background: '#aa88cc' } }).png().toBuffer();
  mongoose.connection.readyState = 1;
  mock.method(User, 'findById', id => ({ select: async () => String(id) === String(admin._id) ? admin : user }));
  const app = express(); app.use(express.json()); app.use('/api', router);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => { mock.restoreAll(); mongoose.connection.readyState = 0; await new Promise(resolve => server.close(resolve)); });

test('decode actual bytes, reject disguised files, limit dimensions and produce WebP', async () => {
  const prepared = await prepareImage(image);
  assert.equal(prepared.width, 1600); assert.equal(prepared.height, 800);
  assert.equal((await sharp(prepared.main).metadata()).format, 'webp');
  assert.equal((await sharp(prepared.thumbnail).metadata()).width, 360);
  await assert.rejects(prepareImage(Buffer.from('<svg onload="alert(1)"></svg>')), { status: 400 });
  await assert.rejects(prepareImage(Buffer.alloc(8 * 1024 * 1024 + 1)), { status: 400 });
});
test('an image is recognised as ours whichever backend stored it', async (t) => {
  assert.ok(isManagedUrl('/api/media/files/123.webp'));
  assert.ok(isManagedUrl('https://res.cloudinary.com/matcha/image/upload/v1/matcha/media/abc.webp'));
  // Seed art and anything a look-alike host serves is not ours to vouch for.
  assert.ok(!isManagedUrl('/images/hero.png'));
  assert.ok(!isManagedUrl('https://res.cloudinary.com.evil.test/x.webp'));
  assert.ok(!isManagedUrl(undefined));

  // With no CLOUDINARY_URL the disk backend still runs, unchanged.
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'matcha-media-'));
  t.after(() => fs.promises.rm(root, { recursive: true, force: true }));
  const stored = await storeImage(image, root);
  assert.match(stored.url, /^\/api\/media\/files\/[\w-]+\.webp$/);
  assert.equal(stored.publicId, null);
  assert.equal(fs.readdirSync(root).length, 2);
});

test('missing products remain visible as editorial but never become sellable', () => {
  const result = resolveLookbooks(defaultLookbooks(), []);
  assert.equal(result.length, 6);
  assert.equal(result.flatMap(l => l.shoppableItems).length, 16);
  assert.ok(result.every(l => l.shoppableItems.every(i => !i.inStock && !i.linked)));
});

test('fresh host serves every bundled demo image without runtime uploads', async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../demo-media/manifest.json'), 'utf8'));
  for (const file of manifest) {
    const response = await fetch(`${base}/media/files/${file.name}`);
    assert.equal(response.status, 200, file.name);
    assert.match(response.headers.get('content-type'), /image\/webp/);
    assert.equal(response.headers.get('cross-origin-resource-policy'), 'cross-origin');
    assert.equal((await response.arrayBuffer()).byteLength, file.bytes);
  }
  assert.equal((await fetch(`${base}/media/files/manifest.json`)).status, 404);
});
test('Lookbook resolves live price, image, stock and sizes; invalid colors are unavailable', () => {
  const looks = defaultLookbooks();
  const product = { id: 'LOOK-01-JACKET', name: 'Live jacket', image: '/api/media/files/new.webp', price: 137, color: 'Iridescent Lilac', quantity: 3, sizes: ['S', 'M'] };
  const item = resolveLookbooks(looks, [product])[0].shoppableItems[0];
  assert.equal(item.price, 137); assert.equal(item.name, 'Live jacket'); assert.equal(item.image, product.image); assert.equal(item.inStock, true);
  product.color = 'Different'; assert.equal(resolveLookbooks(looks, [product])[0].shoppableItems[0].inStock, false);
  looks[0].published = false; assert.equal(resolveLookbooks(looks, []).length, 5);
});

test('Lookbook inventory resolution handles sizeStock, fallback stock, out of stock, missing sizes, and variants', () => {
  const looks = defaultLookbooks();

  // 1. Product has sizeStock
  const withSizeStock = {
    id: 'LOOK-01-JACKET',
    name: 'Jacket',
    price: 100,
    color: 'Iridescent Lilac',
    sizes: ['S', 'M'],
    sizeStock: [{ size: 'S', stock: 3 }, { size: 'M', stock: 2 }]
  };
  const item1 = resolveLookbooks(looks, [withSizeStock])[0].shoppableItems[0];
  assert.equal(item1.quantity, 5);
  assert.equal(item1.inStock, true);

  // 2. Product has stock but no sizeStock (fallback compatibility)
  const withStockOnly = {
    id: 'LOOK-01-JACKET',
    name: 'Jacket',
    price: 100,
    color: 'Iridescent Lilac',
    sizes: ['S', 'M'],
    stock: 8
  };
  const item2 = resolveLookbooks(looks, [withStockOnly])[0].shoppableItems[0];
  assert.equal(item2.quantity, 8);
  assert.equal(item2.inStock, true);

  // 3. Product stock = 0
  const outOfStock = {
    id: 'LOOK-01-JACKET',
    name: 'Jacket',
    price: 100,
    color: 'Iridescent Lilac',
    sizes: ['S', 'M'],
    stock: 0,
    sizeStock: [{ size: 'S', stock: 0 }, { size: 'M', stock: 0 }]
  };
  const item3 = resolveLookbooks(looks, [outOfStock])[0].shoppableItems[0];
  assert.equal(item3.quantity, 0);
  assert.equal(item3.inStock, false);

  // 4. Product has no sizes
  const withoutSizes = {
    id: 'LOOK-01-JACKET',
    name: 'Jacket',
    price: 100,
    color: 'Iridescent Lilac',
    sizes: [],
    sizeStock: [{ size: 'ONE', stock: 10 }]
  };
  const item4 = resolveLookbooks(looks, [withoutSizes])[0].shoppableItems[0];
  assert.equal(item4.inStock, false);

  // 5. Color mismatch
  const colorMismatch = {
    id: 'LOOK-01-JACKET',
    name: 'Jacket',
    price: 100,
    color: 'Wrong Color',
    sizes: ['S'],
    stock: 5,
    variants: []
  };
  const item5 = resolveLookbooks(looks, [colorMismatch])[0].shoppableItems[0];
  assert.equal(item5.inStock, false);

  // 6. Color match via variant
  const variantMatch = {
    id: 'LOOK-01-JACKET',
    name: 'Jacket',
    price: 100,
    color: 'Black',
    sizes: ['S'],
    stock: 5,
    variants: [{ color: 'Iridescent Lilac', image: '/images/variant.png' }]
  };
  const item6 = resolveLookbooks(looks, [variantMatch])[0].shoppableItems[0];
  assert.equal(item6.inStock, true);
  assert.equal(item6.image, '/images/variant.png');
});

test('findLinkedProducts projects authoritative sizeStock and stock fields', async () => {
  let capturedSelect = null;
  const originalFind = Product.find;
  Product.find = () => ({
    select(fields) {
      capturedSelect = fields;
      return this;
    },
    lean: async () => [{ id: 'LOOK-01-JACKET', stock: 10, sizeStock: [{ size: 'S', stock: 10 }] }]
  });

  try {
    const products = await findLinkedProducts([{ productId: 'LOOK-01-JACKET' }]);
    assert.ok(capturedSelect.includes('stock'), 'projection should include stock');
    assert.ok(capturedSelect.includes('sizeStock'), 'projection should include sizeStock');
    assert.equal(products[0].stock, 10);
    assert.equal(products[0].sizeStock[0].stock, 10);
  } finally {
    Product.find = originalFind;
  }
});
test('media mutation requires a real administrator', async () => {
  assert.equal((await fetch(`${base}/admin/media`, { method: 'POST' })).status, 401);
  assert.equal((await fetch(`${base}/admin/media`, { method: 'POST', headers: { Authorization: `Bearer ${issueToken(user)}` } })).status, 403);
});
test('multipart upload produces accessible transformed image; corrupt bytes are rejected', async () => {
  const saved = [];
  mock.method(Media, 'create', async data => { saved.push(data); return data; });
  const body = new FormData(); body.append('alt', 'Purple jacket'); body.append('image', new Blob([image]), '../../jacket.png');
  const res = await fetch(`${base}/admin/media`, { method: 'POST', headers: { Authorization: headers.Authorization }, body });
  assert.equal(res.status, 201); assert.equal(saved.length, 1);
  const asset = (await res.json()).data;
  assert.match(asset.url, /^\/api\/media\/files\/[a-f\d-]+\.webp$/);
  const served = await fetch(base.replace('/api', '') + asset.url);
  assert.equal(served.status, 200); assert.match(served.headers.get('content-type'), /image\/webp/);
  const bad = new FormData(); bad.append('alt', 'Bad file'); bad.append('image', new Blob(['not an image']), 'fake.png');
  assert.equal((await fetch(`${base}/admin/media`, { method: 'POST', headers: { Authorization: headers.Authorization }, body: bad })).status, 400);
});
test('in-use images cannot be archived and return the referencing product', async () => {
  const id = new mongoose.Types.ObjectId();
  mock.method(Media, 'findById', async () => ({ _id: id, url: '/api/media/files/123.webp' }));
  mock.method(Product, 'find', () => query([{ id: 'LOOK-01-JACKET', name: 'Jacket' }]));
  mock.method(Lookbook, 'find', () => query([]));
  const res = await fetch(`${base}/admin/media/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ archived: true }) });
  assert.equal(res.status, 409); assert.equal((await res.json()).usage[0].name, 'Jacket');
});
test('stale gallery writes conflict instead of overwriting another editor', async () => {
  const id = new mongoose.Types.ObjectId();
  mock.method(Media, 'find', () => query([{ _id: id, url: '/api/media/files/123.webp', alt: 'A jacket' }]));
  mock.method(Product, 'findById', () => query({ _id: id, color: 'Purple', variants: [] }));
  mock.method(Product, 'findOneAndUpdate', async () => null);
  const res = await fetch(`${base}/admin/media/products/${id}/gallery`, { method: 'PUT', headers, body: JSON.stringify({ revision: 9, images: [{ mediaId: String(id), color: 'Purple' }] }) });
  assert.equal(res.status, 409);
});
test('Lookbook rejects invalid coordinates before touching database', async () => {
  const res = await fetch(`${base}/admin/lookbooks/SPREAD-01`, { method: 'PUT', headers, body: JSON.stringify({ title: 'Look', heroImage: '/images/hero.png', published: true, revision: 0, items: [{ productId: 'x', color: '', x: 101, y: 30 }] }) });
  assert.equal(res.status, 400);
});

test('gallery save uses managed image URLs and updates the matching color', async () => {
  const id = new mongoose.Types.ObjectId();
  const assetId = new mongoose.Types.ObjectId();
  const url = '/api/media/files/123.webp';
  mock.method(Media, 'find', () => query([{ _id: assetId, url, alt: 'Purple jacket' }]));
  mock.method(Product, 'findById', () => query({ _id: id, color: 'Purple', variants: [{ color: 'Purple', image: '/images/old.png' }, { color: 'Black', image: '/images/black.png' }] }));
  let saved;
  mock.method(Product, 'findOneAndUpdate', async (filter, update) => { saved = update; return { _id: id, ...update.$set, mediaRevision: 1 }; });
  const res = await fetch(`${base}/admin/media/products/${id}/gallery`, { method: 'PUT', headers, body: JSON.stringify({ revision: 0, images: [{ mediaId: String(assetId), color: 'Purple' }] }) });
  assert.equal(res.status, 200);
  assert.equal(saved.$set.image, url);
  assert.equal(saved.$set.variants[0].image, url);
  assert.equal(saved.$set.variants[1].image, '/images/black.png');
  assert.equal(saved.$inc.mediaRevision, 1);
});

test('Lookbook preserves sample specification labels from the catalog', () => {
  const specs = { isSampleData: true, fabricComposition: 'Sample fabric' };
  const product = { id: 'LOOK-01-JACKET', specs, sizes: [] };
  assert.deepEqual(resolveLookbooks(defaultLookbooks(), [product])[0].shoppableItems[0].specs, specs);
});

test('Lookbook rejects duplicate products in hotspot links', async () => {
  const link = { productId: 'LOOK-01-JACKET', color: '', x: 40, y: 30 };
  const res = await fetch(`${base}/admin/lookbooks/SPREAD-01`, { method: 'PUT', headers, body: JSON.stringify({ title: 'Look', heroImage: '/images/hero.png', published: true, revision: 0, items: [link, link] }) });
  assert.equal(res.status, 400);
});

test('deleteImage removes local disk files without throwing if missing', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'matcha-del-test-'));
  const mainFile = path.join(root, 'del-1.webp');
  const thumbFile = path.join(root, 'del-1-thumb.webp');
  await fs.promises.writeFile(mainFile, 'fake image data');
  await fs.promises.writeFile(thumbFile, 'fake thumb data');

  const asset = {
    url: '/api/media/files/del-1.webp',
    thumbnailUrl: '/api/media/files/del-1-thumb.webp',
    publicId: null,
  };

  const res = await deleteImage(asset, root);
  assert.equal(res.success, true);
  assert.equal(res.backend, 'disk');
  assert.equal(fs.existsSync(mainFile), false);
  assert.equal(fs.existsSync(thumbFile), false);

  // Calling again on missing files does not crash
  const res2 = await deleteImage(asset, root);
  assert.equal(res2.success, true);
});

test('deleteImage destroys asset on Cloudinary when publicId is present', async () => {
  let destroyedPublicId = null;
  let destroyOptions = null;
  mock.method(cloudinary.uploader, 'destroy', (publicId, options, callback) => {
    destroyedPublicId = publicId;
    destroyOptions = options;
    callback(null, { result: 'ok' });
  });

  const asset = {
    url: 'https://res.cloudinary.com/matcha/image/upload/v1/matcha/media/test_123.webp',
    publicId: 'matcha/media/test_123',
  };

  const res = await deleteImage(asset);
  assert.equal(res.success, true);
  assert.equal(res.backend, 'cloudinary');
  assert.equal(destroyedPublicId, 'matcha/media/test_123');
  assert.equal(destroyOptions.invalidate, true);
});

test('archiving media asset destroys Cloudinary file and marks archived', async () => {
  const id = new mongoose.Types.ObjectId();
  let destroyedId = null;
  mock.method(cloudinary.uploader, 'destroy', (publicId, options, callback) => {
    destroyedId = publicId;
    callback(null, { result: 'ok' });
  });

  const assetDoc = {
    _id: id,
    url: 'https://res.cloudinary.com/matcha/image/upload/v1/matcha/media/abc_456.webp',
    publicId: 'matcha/media/abc_456',
    archived: false,
    save: async function() { this.saved = true; return this; },
  };

  mock.method(Media, 'findById', async () => assetDoc);
  mock.method(Product, 'find', () => query([]));
  mock.method(Lookbook, 'find', () => query([]));

  const res = await fetch(`${base}/admin/media/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ archived: true })
  });

  assert.equal(res.status, 200);
  assert.equal(destroyedId, 'matcha/media/abc_456');
  assert.equal(assetDoc.archived, true);
});

test('Cloudinary destroy failure aborts archive and preserves DB record', async () => {
  const id = new mongoose.Types.ObjectId();
  mock.method(cloudinary.uploader, 'destroy', (publicId, options, callback) => {
    callback(new Error('Cloudinary error'));
  });

  let saved = false;
  const assetDoc = {
    _id: id,
    url: 'https://res.cloudinary.com/matcha/image/upload/v1/matcha/media/fail_789.webp',
    publicId: 'matcha/media/fail_789',
    archived: false,
    save: async function() { saved = true; return this; },
  };

  mock.method(Media, 'findById', async () => assetDoc);
  mock.method(Product, 'find', () => query([]));
  mock.method(Lookbook, 'find', () => query([]));

  const res = await fetch(`${base}/admin/media/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ archived: true })
  });

  assert.notEqual(res.status, 200);
  assert.equal(saved, false);
  assert.equal(assetDoc.archived, false);
});

test('DELETE /admin/media/:id hard-deletes unreferenced asset', async () => {
  const id = new mongoose.Types.ObjectId();
  let deletedFromDb = false;
  let destroyedId = null;

  mock.method(cloudinary.uploader, 'destroy', (publicId, options, callback) => {
    destroyedId = publicId;
    callback(null, { result: 'ok' });
  });

  const assetDoc = {
    _id: id,
    url: 'https://res.cloudinary.com/matcha/image/upload/v1/matcha/media/to_del.webp',
    publicId: 'matcha/media/to_del',
  };

  mock.method(Media, 'findById', async () => assetDoc);
  mock.method(Media, 'findByIdAndDelete', async () => { deletedFromDb = true; return assetDoc; });
  mock.method(Product, 'find', () => query([]));
  mock.method(Lookbook, 'find', () => query([]));

  const res = await fetch(`${base}/admin/media/${id}`, {
    method: 'DELETE',
    headers
  });

  assert.equal(res.status, 200);
  assert.equal(destroyedId, 'matcha/media/to_del');
  assert.equal(deletedFromDb, true);
});
