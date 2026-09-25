/* scripts/migrateLookbookInventory.mjs must change only what it says it will,
   add or lose no stock, and do nothing on a second run. The planner is tested
   on its own; the write path runs against the test database with ids no real
   product uses. */
import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns';
import mongoose from 'mongoose';

import { isDatabaseNameSafe, isHostnameSafe, parseMongoDatabaseName, parseMongoHostname } from '../services/mongoSafetyGuard.js';
import { planLookbookInventory, categorySizeRuns, split, runMigration, COLOUR_MAPPINGS, CANONICAL_RECORDS } from '../scripts/migrateLookbookInventory.mjs';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const APPAREL = ['S', 'M', 'L', 'XL', 'XXL'];
const ref = (id, category, sizes = APPAREL) => ({ id, category, sizes, sizeStock: sizes.map((size) => ({ size, stock: 10 })) });
const sizeless = (id, category, stock = 50) => ({ id, category, color: 'Ivory', sizes: [], sizeStock: [{ size: 'ONE', stock }], stock });

describe('lookbook inventory plan', () => {
  it('splits a total the way migrateSizeStock.mjs does, losing nothing', () => {
    assert.deepEqual(split(50, 5), [10, 10, 10, 10, 10]);
    assert.deepEqual(split(12, 5), [3, 3, 2, 2, 2]);
    assert.equal(split(60, 5).reduce((a, b) => a + b, 0), 60);
  });

  it('takes the size run from the rest of the category and refuses one the category disagrees on', () => {
    const { runs, disagreements } = categorySizeRuns([ref('A', 'Tops'), ref('B', 'Tops'), ref('C', 'Bottoms'), ref('D', 'Bottoms', ['28', '30'])]);
    assert.deepEqual(runs.Tops, APPAREL);
    assert.equal(runs.Bottoms, undefined);
    assert.ok(disagreements.Bottoms);
  });

  it('gives a one-bucket LOOK garment its category run and keeps its total', () => {
    const { actions } = planLookbookInventory({
      products: [sizeless('LOOK-06-SHIRT', 'Tops', 60)],
      referenceProducts: [ref('SPR-TOP-1', 'Tops')],
      lookbooks: [],
      canonicalRecords: []
    });
    const [update] = actions.filter((a) => a.kind === 'UPDATE');
    assert.equal(update.id, 'LOOK-06-SHIRT');
    assert.deepEqual(update.set.sizes, APPAREL);
    assert.equal(update.set.sizeStock.reduce((s, b) => s + b.stock, 0), 60);
    assert.equal(update.set.stock, 60);
  });

  it('reports a category with no agreed run as a conflict instead of guessing', () => {
    const { actions } = planLookbookInventory({
      products: [sizeless('LOOK-X', 'Capes')],
      referenceProducts: [ref('SPR-TOP-1', 'Tops')],
      lookbooks: [],
      canonicalRecords: []
    });
    assert.equal(actions[0].kind, 'CONFLICT');
  });

  it('leaves a garment that already has matching sizes alone, and flags one whose buckets disagree', () => {
    const { actions } = planLookbookInventory({
      products: [ref('LOOK-DONE', 'Tops'), { id: 'LOOK-ODD', category: 'Tops', sizes: ['S', 'M'], sizeStock: [{ size: 'ONE', stock: 5 }] }],
      referenceProducts: [ref('SPR-TOP-1', 'Tops')],
      lookbooks: [],
      canonicalRecords: []
    });
    assert.deepEqual(actions.filter((a) => a.target === 'product').map((a) => [a.id, a.kind]), [['LOOK-DONE', 'NO CHANGE'], ['LOOK-ODD', 'CONFLICT']]);
  });

  it('recreates LOOK-06-SHORTS from its backup record only when it is missing', () => {
    const plan = (products) => planLookbookInventory({ products, referenceProducts: [ref('B1', 'Bottoms')], lookbooks: [], colourMappings: [] });
    const create = plan([]).actions.find((a) => a.kind === 'CREATE');
    assert.equal(create.id, 'LOOK-06-SHORTS');
    assert.equal(create.doc.price, CANONICAL_RECORDS[0].price);
    assert.equal(create.doc.image, CANONICAL_RECORDS[0].image);
    assert.deepEqual(create.doc.sizes, APPAREL);
    assert.equal(create.doc.sizeStock.reduce((s, b) => s + b.stock, 0), 50);

    const again = plan([ref('LOOK-06-SHORTS', 'Bottoms')]).actions.find((a) => a.id === 'LOOK-06-SHORTS' && a.note === 'already present');
    assert.equal(again.kind, 'NO CHANGE');
  });

  it('renames only the listed colours, only from the listed name, and only to one the product is sold in', () => {
    const look = { id: 'SPREAD-02', items: [{ productId: 'LOOK-02-BLAZER', color: 'Warm Ivory' }, { productId: 'LOOK-02-SHIRT', color: 'Cream' }] };
    const { actions } = planLookbookInventory({
      products: [{ ...ref('LOOK-02-BLAZER', 'Outerwear'), color: 'Ivory' }, { ...ref('LOOK-02-SHIRT', 'Tops'), color: 'Ivory' }],
      referenceProducts: [ref('R1', 'Outerwear'), ref('R2', 'Tops')],
      lookbooks: [look],
      canonicalRecords: []
    });
    const byId = Object.fromEntries(actions.filter((a) => a.target === 'lookbook').map((a) => [a.id, a.kind]));
    assert.equal(byId['SPREAD-02/LOOK-02-BLAZER'], 'UPDATE');
    assert.equal(byId['SPREAD-02/LOOK-02-SHIRT'], 'CONFLICT');
    assert.equal(byId['SPREAD-01/LOOK-01-CROP'], 'NO CHANGE'); // not stored
  });

  it('lists every rename explicitly, one product at a time', () => {
    assert.equal(COLOUR_MAPPINGS.length, 9);
    for (const m of COLOUR_MAPPINGS) {
      assert.ok(m.lookbookId && m.productId && m.from && m.to && m.from !== m.to);
    }
  });
});

const testUri = process.env.TEST_MONGODB_URI || '';
const targetIsSafe = Boolean(testUri)
  && isDatabaseNameSafe(parseMongoDatabaseName(testUri)).safe
  && isHostnameSafe(parseMongoHostname(testUri)).safe;
let reachable = false;
if (targetIsSafe) {
  try {
    await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5_000 });
    reachable = true;
  } catch {
    await mongoose.disconnect().catch(() => {});
  }
}
const dbDescribe = reachable ? describe : describe.skip;

dbDescribe('lookbook inventory migration against the test database', () => {
  const P = `MIGTEST-${process.pid}-`;
  const R = `MIGREF-${process.pid}-`;
  const L = `MIGLOOK-${process.pid}`;
  let db;
  const quiet = () => {};

  before(async () => {
    db = mongoose.connection.db;
    await db.collection('products').insertMany([
      { id: `${R}top`, sku: `${R}top`, category: 'Tops', sizes: APPAREL, sizeStock: APPAREL.map((size) => ({ size, stock: 3 })), stock: 15 },
      { id: `${P}shirt`, sku: `${P}shirt`, category: 'Tops', color: 'Ivory', sizes: [], sizeStock: [{ size: 'ONE', stock: 60 }], stock: 60 }
    ]);
    await db.collection('lookbooks').insertOne({ id: L, title: 't', heroImage: '/x.jpg', items: [{ productId: `${P}shirt`, color: 'Warm Ivory' }] });
  });

  after(async () => {
    await db.collection('products').deleteMany({ id: { $regex: `^(${P}|${R})` } });
    await db.collection('lookbooks').deleteMany({ id: L });
    await mongoose.disconnect();
  });

  const run = (apply) => runMigration({
    db, apply, log: quiet,
    targetPrefix: P,
    referenceFilter: { id: { $regex: `^${R}` } },
    canonicalRecords: [],
    colourMappings: [{ lookbookId: L, productId: `${P}shirt`, from: 'Warm Ivory', to: 'Ivory' }]
  });

  it('a dry run writes nothing', async () => {
    const { plan, results } = await run(false);
    assert.ok(plan.actions.some((a) => a.kind === 'UPDATE'));
    assert.deepEqual(results, []);
    const shirt = await db.collection('products').findOne({ id: `${P}shirt` });
    assert.deepEqual(shirt.sizes, []);
    const look = await db.collection('lookbooks').findOne({ id: L });
    assert.equal(look.items[0].color, 'Warm Ivory');
  });

  it('applies once, keeps the total, and a second run changes nothing', async () => {
    const first = await run(true);
    assert.ok(first.results.length > 0 && first.results.every((r) => r.applied));
    const shirt = await db.collection('products').findOne({ id: `${P}shirt` });
    assert.deepEqual(shirt.sizes, APPAREL);
    assert.equal(shirt.sizeStock.reduce((s, b) => s + b.stock, 0), 60);
    assert.equal(shirt.stock, 60);
    assert.equal((await db.collection('lookbooks').findOne({ id: L })).items[0].color, 'Ivory');

    const second = await run(true);
    assert.ok(second.plan.actions.every((a) => a.kind === 'NO CHANGE'), JSON.stringify(second.plan.actions));
    assert.deepEqual(second.results, []);
    const again = await db.collection('products').findOne({ id: `${P}shirt` });
    assert.equal(again.sizeStock.reduce((s, b) => s + b.stock, 0), 60);
  });
});

/* All six spreads are served from editorialSpreads.json (none is stored in the
   database), and a link whose colour is not the product's marks the piece
   unavailable. Nine carried editorial names — "Warm Ivory" for an Ivory
   blazer — and were sold out for that reason alone. */
describe('editorial spreads seed', () => {
  it('names every linked piece in a colour its product is sold in', async () => {
    const { defaults } = await import('../services/lookbook.js');
    const { productsData } = await import('../../frontend/src/data/productsData.js');
    const byId = new Map(productsData.map((p) => [p.id, p]));
    const wrong = [];
    for (const spread of defaults) {
      for (const hotspot of spread.hotspots) {
        const product = byId.get(hotspot.productId);
        if (!product) continue; // LOOK-06-SHORTS: restored by the migration
        const colours = [product.color, ...(product.variants || []).map((v) => v.color)];
        if (hotspot.color && !colours.includes(hotspot.color)) wrong.push(`${spread.id}/${hotspot.productId}: ${hotspot.color}`);
      }
    }
    assert.deepEqual(wrong, []);
  });
});
