/* Bring every product's `stock` back into agreement with its size buckets.
 *
 * `stock` is derived: models/Product.js recomputes it as the sum of
 * `sizeStock` in a pre-validate hook. Restocking from the admin console went
 * through findOneAndUpdate, which does not run that hook, so the total was set
 * to a number no bucket agreed with. Four rows drifted in production this way:
 *
 *   LOOK-01-CARGO   stock 12   sizeStock sum 50
 *   LOOK-05-CARGO   stock 12   sizeStock sum 50
 *   LOOK-06-SHIRT   stock 12   sizeStock sum 50
 *   LOOK-06-VEST    stock 12   sizeStock sum 50
 *
 * The buckets win. They are what order placement decrements, under a condition
 * that refuses to go below zero, so they are the only figure that has ever
 * reflected what is on the shelf; the total is a display convenience that fell
 * behind. Rewriting the buckets down to match the total instead would destroy
 * 38 real units per row.
 *
 * Products with no sizeStock are left alone: for those, `stock` IS the
 * authoritative figure.
 *
 * Safe to re-run: a row whose total already matches is not touched, so a
 * second run reports nothing to do. A backup of every affected document is
 * written before anything changes, on dry runs too.
 *
 *   node scripts/repairStockTotals.mjs                        <- dry run
 *   node scripts/repairStockTotals.mjs --yes                  <- write it
 *   node scripts/repairStockTotals.mjs --only=LOOK-06-VEST    <- one row
 *
 * --only may be repeated or comma-separated, and is worth using for the first
 * run against production: repair one row, look at it in the admin console,
 * then do the rest.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import mongoose from 'mongoose';

// mongodb+srv:// needs an SRV lookup, which some networks refuse
// (querySrv ECONNREFUSED), so point at public resolvers first.
dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);

const CONFIRMED = process.argv.includes('--yes');

const only = process.argv
  .filter(arg => arg.startsWith('--only='))
  .flatMap(arg => arg.slice('--only='.length).split(','))
  .map(value => value.trim())
  .filter(Boolean);

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
const products = mongoose.connection.db.collection('products');

/* Drift is defined by the data, not by a hardcoded list of the four rows we
   happen to know about: the same bug could have touched others since the
   figures were taken, and a row that has been fixed in the meantime must not
   be "repaired" back. */
const filter = {
  sizeStock: { $exists: true, $not: { $size: 0 } },
  $expr: { $ne: ['$stock', { $sum: '$sizeStock.stock' }] },
  ...(only.length ? { $or: [{ id: { $in: only } }, { sku: { $in: only } }] } : {})
};

const drifted = await products.find(filter).toArray();

console.log(`${CONFIRMED ? 'REPAIRING' : 'DRY RUN'}${only.length ? ` (--only ${only.join(', ')})` : ''}`);
console.log(`${drifted.length} product(s) whose total disagrees with its sizes, of ${await products.countDocuments()} in the collection\n`);

if (!drifted.length) {
  console.log('Nothing to do — every total already matches its sizes.');
  await mongoose.disconnect();
  process.exit(0);
}

// Written on every run, dry or not, and before anything is touched.
const backupDir = path.resolve('storage');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `products-backup-${stamp}.json`);
fs.writeFileSync(backupPath, JSON.stringify(drifted, null, 2));
console.log(`backup written: ${backupPath}\n`);

const writes = [];
for (const p of drifted) {
  const sum = (p.sizeStock || []).reduce((acc, row) => acc + (Number(row.stock) || 0), 0);
  const sizes = (p.sizeStock || []).map(row => `${row.size}:${row.stock}`).join(' ');
  console.log(`  ${String(p.id).padEnd(18)} stock ${String(p.stock).padStart(4)} -> ${String(sum).padStart(4)}   [${sizes}]`);
  writes.push({
    updateOne: {
      filter: { _id: p._id },
      update: { $set: { stock: sum, inStock: sum > 0 } },
    },
  });
}

if (CONFIRMED) {
  const res = await products.bulkWrite(writes, { ordered: false });
  console.log(`\nmodified ${res.modifiedCount} product(s)`);
  const remaining = await products.countDocuments({
    sizeStock: { $exists: true, $not: { $size: 0 } },
    $expr: { $ne: ['$stock', { $sum: '$sizeStock.stock' }] },
  });
  console.log(`still disagreeing across the whole collection: ${remaining}`);
} else {
  console.log('\nRe-run with --yes to write these.');
}

await mongoose.disconnect();
