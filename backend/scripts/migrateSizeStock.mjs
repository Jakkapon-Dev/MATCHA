/* Spread each product's single stock figure across the sizes it is sold in.
 *
 * Stock used to be one number per product, which cannot answer the question a
 * shopper actually asks — "is there an M?" — so a garment whose M had gone
 * still read as in stock on the strength of the XLs nobody wanted. This fills
 * the sizeStock array that models/Product.js now treats as authoritative.
 *
 * How the existing figure is divided:
 *
 *   sizes: ['S','M','L','XL','XXL']  ->  one bucket per size, the current
 *                                        stock split evenly, remainder going
 *                                        to the earlier sizes
 *   sizes: ['OS']                    ->  a single bucket, the whole figure
 *   sizes: []                        ->  a single ONE bucket, the whole figure
 *
 * The last case is the sixteen LOOK-* garments imported from the lookbook
 * without sizes. Splitting a jacket's stock across sizes it does not declare
 * would be inventing inventory, and zeroing it would quietly take them off
 * sale, so they keep exactly what they have in one bucket. They still need
 * real sizes before the shop goes live; this script does not pretend otherwise
 * and prints them at the end.
 *
 * Safe to re-run: a product that already has sizeStock is left alone. Pass
 * --force to rebuild from the current sizes and total.
 *
 * Default is a dry run. Nothing is written without --yes.
 *
 *   node scripts/migrateSizeStock.mjs          <- show what would change
 *   node scripts/migrateSizeStock.mjs --yes    <- write it
 */

import 'dotenv/config';
import dns from 'node:dns';
import mongoose from 'mongoose';

// mongodb+srv:// needs an SRV lookup, which some networks refuse
// (querySrv ECONNREFUSED), so point at public resolvers first.
dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);

const CONFIRMED = process.argv.includes('--yes');
const FORCE = process.argv.includes('--force');
const ONE_SIZE = 'ONE';

/* Divide `total` into `n` buckets as evenly as it goes, giving the remainder
   to the earlier sizes. Eleven across five sizes is 3,2,2,2,2 — not 2,2,2,2,2
   with one unit quietly lost. */
function split(total, n) {
  const base = Math.floor(total / n);
  const extra = total % n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

function bucketsFor(product) {
  const total = Math.max(0, Number(product.stock) || 0);
  const sizes = (product.sizes || []).map(s => String(s).trim()).filter(Boolean);
  if (!sizes.length) return [{ size: ONE_SIZE, stock: total }];
  const shares = split(total, sizes.length);
  return sizes.map((size, i) => ({ size, stock: shares[i] }));
}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
const products = mongoose.connection.db.collection('products');

const filter = FORCE ? {} : { $or: [{ sizeStock: { $exists: false } }, { sizeStock: { $size: 0 } }] };
const todo = await products.find(filter).project({ id: 1, name: 1, sizes: 1, stock: 1, category: 1 }).toArray();

console.log(`${CONFIRMED ? 'MIGRATING' : 'DRY RUN'}${FORCE ? ' (--force: rebuilding every product)' : ''}`);
console.log(`${todo.length} product(s) to process, of ${await products.countDocuments()} in the collection\n`);

const sizeless = [];
const writes = [];

for (const p of todo) {
  const buckets = bucketsFor(p);
  if (!(p.sizes || []).length) sizeless.push(`${p.id}  ${p.category}  ${p.name}`);
  writes.push({
    updateOne: {
      filter: { _id: p._id },
      update: {
        $set: {
          sizeStock: buckets,
          // Keep the derived total honest even though the hook is not running here.
          stock: buckets.reduce((sum, b) => sum + b.stock, 0),
          inStock: buckets.some(b => b.stock > 0),
        },
      },
    },
  });
}

// Show a few so the shape is visible before anything is written.
for (const p of todo.slice(0, 5)) {
  console.log(`  ${p.id.padEnd(18)} stock ${String(p.stock).padStart(3)} -> ${JSON.stringify(bucketsFor(p))}`);
}
if (todo.length > 5) console.log(`  … and ${todo.length - 5} more`);

if (!CONFIRMED) {
  console.log('\nNothing written. Re-run with --yes to apply.');
} else if (writes.length) {
  const res = await products.bulkWrite(writes, { ordered: false });
  console.log(`\nmodified ${res.modifiedCount} product(s)`);

  const remaining = await products.countDocuments({ $or: [{ sizeStock: { $exists: false } }, { sizeStock: { $size: 0 } }] });
  const mismatched = await products.countDocuments({
    $expr: { $ne: ['$stock', { $sum: '$sizeStock.stock' }] },
  });
  console.log(`still without sizeStock: ${remaining}`);
  console.log(`stock disagreeing with the sum of its sizes: ${mismatched}`);
} else {
  console.log('\nNothing to do.');
}

if (sizeless.length) {
  console.log(`\n${sizeless.length} product(s) are sold without any size and went into one ${ONE_SIZE} bucket.`);
  console.log('They keep the stock they had, so nothing has gone off sale, but they need');
  console.log('real sizes before the shop takes real money:');
  for (const line of sizeless) console.log('  ' + line);
}

await mongoose.disconnect();
