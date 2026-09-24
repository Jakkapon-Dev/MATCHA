/* Give the LOOK-* editorial garments sizes, and restore the one that is missing.
 *
 * Why this exists. The sixteen LOOK-* pieces were imported from the lookbook
 * without sizes. migrateSizeStock.mjs, rather than invent a size run, kept each
 * one's stock in a single ONE bucket and said they "still need real sizes
 * before the shop goes live". Until they have them the catalogue refuses them
 * ("No sizes are recorded for this piece") and the lookbook marks them sold
 * out. LOOK-06-SHORTS is worse: the lookbook links it, but the product record
 * is gone — every product backup from 2026-09-18 still has it.
 *
 * What it does, and the rule behind each part:
 *
 *   UPDATE  a LOOK-* garment whose sizes are [] and whose stock sits in one ONE
 *           bucket gets the size run every other garment in its category is
 *           sold in. That run is read from the database, not written here, and
 *           the script stops if the category does not agree on one. The ONE
 *           total is split across it the way migrateSizeStock.mjs splits a
 *           total — evenly, remainder to the earlier sizes — so no unit is
 *           added or lost.
 *   CREATE  LOOK-06-SHORTS from its last known record (CANONICAL_RECORDS
 *           below, copied from storage/products-backup-2026-09-18T14-45-35-
 *           043Z.json). Nothing about it is made up; it gets its category's
 *           run like the others.
 *   UPDATE  a stored Lookbook document whose link colour is one of the
 *           editorial names in COLOUR_MAPPINGS gets the product's own colour.
 *           Today no spread is stored — all six are served from
 *           frontend/src/data/editorialSpreads.json, which carries the same
 *           correction — so this reports NO CHANGE unless one has been saved
 *           since.
 *   NO CHANGE  anything already in the target state. Re-running is safe.
 *   CONFLICT   anything in a state this script does not expect (sizes set but
 *           buckets disagreeing, a colour that is neither the old nor the new
 *           name). It is reported and left alone.
 *
 * The size run is the catalogue's convention, not a stock count anyone has
 * checked in a warehouse. Confirm it with the shop before applying.
 *
 * Default is a dry run. Nothing is written without --apply, and a database
 * that looks like production also needs --production. It never runs on boot
 * or deploy; nothing imports it except its test.
 *
 *   node scripts/migrateLookbookInventory.mjs                        <- dry run
 *   node scripts/migrateLookbookInventory.mjs --apply                <- write (non-production)
 *   node scripts/migrateLookbookInventory.mjs --apply --production   <- write to production
 *   --uri-env NAME   read the connection string from process.env[NAME]
 *                    (default MONGODB_URI)
 */

import { pathToFileURL } from 'node:url';

export const ONE_SIZE = 'ONE';

/* Divide `total` into `n` buckets as evenly as it goes, giving the remainder
   to the earlier sizes — the rule migrateSizeStock.mjs uses. */
export function split(total, n) {
  const base = Math.floor(total / n);
  const extra = total % n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

/* Editorial colour names on the spreads, and the product colour each one is.
   Listed one by one so a reviewer can see every rename; nothing is matched by
   similarity. */
export const COLOUR_MAPPINGS = [
  { lookbookId: 'SPREAD-01', productId: 'LOOK-01-CROP', from: 'Metallic Silver', to: 'Silver' },
  { lookbookId: 'SPREAD-02', productId: 'LOOK-02-BLAZER', from: 'Warm Ivory', to: 'Ivory' },
  { lookbookId: 'SPREAD-02', productId: 'LOOK-02-SHIRT', from: 'Warm Ivory', to: 'Ivory' },
  { lookbookId: 'SPREAD-02', productId: 'LOOK-02-TROUSERS', from: 'Warm Ivory', to: 'Ivory' },
  { lookbookId: 'SPREAD-03', productId: 'LOOK-03-TROUSERS', from: 'Ivory Cream', to: 'Ivory' },
  { lookbookId: 'SPREAD-04', productId: 'LOOK-04-BLAZER', from: 'Copper Bronze', to: 'Copper' },
  { lookbookId: 'SPREAD-04', productId: 'LOOK-04-TROUSERS', from: 'Copper Bronze', to: 'Copper' },
  { lookbookId: 'SPREAD-05', productId: 'LOOK-05-SWEATER', from: 'Charcoal Marl', to: 'Charcoal' },
  { lookbookId: 'SPREAD-05', productId: 'LOOK-05-CARGO', from: 'Dark Brown Charcoal', to: 'Charcoal' }
];

// Copied from storage/products-backup-2026-09-18T14-45-35-043Z.json.
export const CANONICAL_RECORDS = [
  {
    _id: '6aa024686a224bebc7a18e58',
    id: 'LOOK-06-SHORTS',
    sku: 'LOOK-06-SHORTS',
    name: 'Technical Cargo Shorts',
    description: 'กางเกงขาสั้นคาร์โก้เทคนิคัล ดีไซน์โมเดิร์นแอ็กทีฟ น้ำหนักเบา คล่องตัว ตอบโจทย์ไลฟ์สไตล์คนเมือง',
    price: 84,
    category: 'Bottoms',
    subCategory: '',
    season: 'Spring',
    color: 'Black',
    colorHex: '#1C1B1E',
    fit: 'Regular',
    tag: 'Editorial',
    image: '/api/media/files/e27e580f-3c5b-49e8-a90b-7d7167823d48.webp',
    gallery: [{ mediaId: '6aa024686a224bebc7a18e57', url: '/api/media/files/e27e580f-3c5b-49e8-a90b-7d7167823d48.webp', alt: 'Technical Cargo Shorts', color: 'Black' }],
    variants: [],
    rating: 4.5,
    reviewsCount: 0,
    isFeatured: false,
    mediaRevision: 0,
    date: '2026-09-08',
    stock: 50
  }
];

const sameList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const cleanSizes = (sizes) => (sizes || []).map((s) => String(s).trim()).filter(Boolean);

/* The size run each category is sold in, from garments this script does not
   touch. A category whose garments disagree has no single run to copy. */
export function categorySizeRuns(referenceProducts) {
  const seen = new Map();
  for (const p of referenceProducts) {
    const sizes = cleanSizes(p.sizes);
    if (!sizes.length || !p.category) continue;
    const key = JSON.stringify(sizes);
    if (!seen.has(p.category)) seen.set(p.category, new Map());
    const counts = seen.get(p.category);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const runs = {};
  const disagreements = {};
  for (const [category, counts] of seen) {
    if (counts.size === 1) runs[category] = JSON.parse([...counts.keys()][0]);
    else disagreements[category] = Object.fromEntries(counts);
  }
  return { runs, disagreements };
}

/* Everything the migration would do, worked out without touching the
   database. Every write it lists has already been checked. */
export function planLookbookInventory({ products, referenceProducts, lookbooks, targetPrefix = 'LOOK-', canonicalRecords = CANONICAL_RECORDS, colourMappings = COLOUR_MAPPINGS }) {
  const { runs, disagreements } = categorySizeRuns(referenceProducts);
  const actions = [];
  const byId = new Map(products.map((p) => [p.id, p]));

  const runFor = (product) => runs[product.category] || null;

  for (const p of products.filter((x) => String(x.id).startsWith(targetPrefix))) {
    const sizes = cleanSizes(p.sizes);
    const buckets = Array.isArray(p.sizeStock) ? p.sizeStock : [];
    const run = runFor(p);
    const total = buckets.reduce((sum, b) => sum + (Number(b.stock) || 0), 0);

    if (sizes.length && sameList(buckets.map((b) => b.size), sizes)) {
      actions.push({ kind: 'NO CHANGE', target: 'product', id: p.id, note: `sizes ${sizes.join('/')}` });
      continue;
    }
    if (!sizes.length && buckets.length === 1 && buckets[0].size === ONE_SIZE) {
      if (!run) {
        actions.push({ kind: 'CONFLICT', target: 'product', id: p.id, note: `no agreed size run for category "${p.category}"${disagreements[p.category] ? ' (garments disagree)' : ''}` });
        continue;
      }
      const shares = split(total, run.length);
      const sizeStock = run.map((size, i) => ({ size, stock: shares[i] }));
      actions.push({
        kind: 'UPDATE', target: 'product', id: p.id,
        set: { sizes: run, sizeStock, stock: total },
        note: `ONE:${total} -> ${sizeStock.map((b) => `${b.size}:${b.stock}`).join(' ')}`
      });
      continue;
    }
    actions.push({ kind: 'CONFLICT', target: 'product', id: p.id, note: `sizes [${sizes.join('/')}] against buckets [${buckets.map((b) => b.size).join('/')}]` });
  }

  for (const record of canonicalRecords) {
    if (byId.has(record.id)) {
      actions.push({ kind: 'NO CHANGE', target: 'product', id: record.id, note: 'already present' });
      continue;
    }
    const run = runFor(record);
    if (!run) {
      actions.push({ kind: 'CONFLICT', target: 'product', id: record.id, note: `no agreed size run for category "${record.category}"` });
      continue;
    }
    const missing = ['name', 'price', 'category', 'color', 'image'].filter((f) => record[f] === undefined || record[f] === '');
    if (missing.length) {
      actions.push({ kind: 'CONFLICT', target: 'product', id: record.id, note: `canonical record lacks ${missing.join(', ')}` });
      continue;
    }
    const { stock, ...fields } = record;
    const shares = split(stock, run.length);
    actions.push({
      kind: 'CREATE', target: 'product', id: record.id,
      doc: { ...fields, sizes: run, sizeStock: run.map((size, i) => ({ size, stock: shares[i] })), stock, inStock: stock > 0 },
      note: `from backup, ${run.join('/')} total ${stock}`
    });
  }

  const storedById = new Map(lookbooks.map((l) => [l.id, l]));
  for (const m of colourMappings) {
    const look = storedById.get(m.lookbookId);
    if (!look) {
      actions.push({ kind: 'NO CHANGE', target: 'lookbook', id: `${m.lookbookId}/${m.productId}`, note: 'not stored; served from editorialSpreads.json' });
      continue;
    }
    const index = (look.items || []).findIndex((i) => i.productId === m.productId);
    const current = index >= 0 ? look.items[index].color : undefined;
    const product = byId.get(m.productId);
    const productColours = product ? [product.color, ...(product.variants || []).map((v) => v.color)] : [];
    if (current === m.to) {
      actions.push({ kind: 'NO CHANGE', target: 'lookbook', id: `${m.lookbookId}/${m.productId}`, note: `already ${m.to}` });
    } else if (current !== m.from) {
      actions.push({ kind: 'CONFLICT', target: 'lookbook', id: `${m.lookbookId}/${m.productId}`, note: `colour is "${current}", expected "${m.from}"` });
    } else if (!productColours.includes(m.to)) {
      actions.push({ kind: 'CONFLICT', target: 'lookbook', id: `${m.lookbookId}/${m.productId}`, note: `product is not sold in "${m.to}"` });
    } else {
      actions.push({ kind: 'UPDATE', target: 'lookbook', id: `${m.lookbookId}/${m.productId}`, lookbookId: m.lookbookId, productId: m.productId, from: m.from, to: m.to, note: `${m.from} -> ${m.to}` });
    }
  }

  return { actions, runs, disagreements };
}

/* Applies a plan. Each write is conditional on the state the plan was made
   from, so a record that changed in between is skipped, not overwritten. */
export async function applyPlan(db, plan) {
  const products = db.collection('products');
  const lookbooks = db.collection('lookbooks');
  const results = [];
  for (const action of plan.actions) {
    if (action.kind === 'UPDATE' && action.target === 'product') {
      const r = await products.updateOne(
        { id: action.id, sizes: { $size: 0 }, sizeStock: { $size: 1 }, 'sizeStock.0.size': ONE_SIZE },
        { $set: action.set }
      );
      results.push({ ...action, applied: r.modifiedCount === 1 });
    } else if (action.kind === 'CREATE') {
      const mongoose = (await import('mongoose')).default;
      const doc = { ...action.doc, _id: new mongoose.Types.ObjectId(action.doc._id), createdAt: new Date(), updatedAt: new Date() };
      const r = await products.updateOne({ id: action.id }, { $setOnInsert: doc }, { upsert: true });
      results.push({ ...action, applied: r.upsertedCount === 1 });
    } else if (action.kind === 'UPDATE' && action.target === 'lookbook') {
      const r = await lookbooks.updateOne(
        { id: action.lookbookId, items: { $elemMatch: { productId: action.productId, color: action.from } } },
        { $set: { 'items.$.color': action.to } }
      );
      results.push({ ...action, applied: r.modifiedCount === 1 });
    }
  }
  return results;
}

export async function runMigration({ db, apply = false, targetPrefix = 'LOOK-', referenceFilter, canonicalRecords, colourMappings, log = console.log }) {
  const products = await db.collection('products').find({}).toArray();
  const reference = referenceFilter
    ? await db.collection('products').find(referenceFilter).toArray()
    : products.filter((p) => !String(p.id).startsWith(targetPrefix));
  const lookbooks = await db.collection('lookbooks').find({}).toArray();
  const plan = planLookbookInventory({ products, referenceProducts: reference, lookbooks, targetPrefix, canonicalRecords, colourMappings });

  for (const a of plan.actions) log(`${a.kind.padEnd(9)} ${a.target.padEnd(8)} ${a.id}  ${a.note || ''}`);
  const count = (k) => plan.actions.filter((a) => a.kind === k).length;
  log(`\n${count('CREATE')} create, ${count('UPDATE')} update, ${count('NO CHANGE')} no change, ${count('CONFLICT')} conflict`);

  if (!apply) {
    log('DRY RUN — nothing written.');
    return { plan, results: [] };
  }
  const results = await applyPlan(db, plan);
  log(`APPLIED — ${results.filter((r) => r.applied).length} of ${results.length} write(s) took effect.`);
  return { plan, results };
}

async function main() {
  await import('dotenv/config');
  const dns = (await import('node:dns')).default;
  const mongoose = (await import('mongoose')).default;
  const { parseMongoDatabaseName, parseMongoHostname, isDatabaseNameSafe, isHostnameSafe } = await import('../services/mongoSafetyGuard.js');
  dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);

  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const envIndex = args.indexOf('--uri-env');
  const envName = envIndex >= 0 ? args[envIndex + 1] : 'MONGODB_URI';
  const uri = process.env[envName];
  if (!uri) {
    console.error(`${envName} is not set.`);
    process.exit(1);
  }

  // The name is printed so the operator can see where this is going. The URI,
  // which carries credentials, never is.
  const dbName = parseMongoDatabaseName(uri) || '(default)';
  const production = !isDatabaseNameSafe(dbName).safe || !isHostnameSafe(parseMongoHostname(uri)).safe;
  console.log(`Target database: ${dbName}${production ? '  [PRODUCTION-LIKE]' : ''}  (from ${envName})`);
  console.log(apply ? 'Mode: APPLY' : 'Mode: DRY RUN (pass --apply to write)');
  if (apply && production && !args.includes('--production')) {
    console.error('Refusing to write to a production-like database without --production.');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  try {
    await runMigration({ db: mongoose.connection.db, apply });
  } finally {
    await mongoose.disconnect();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
