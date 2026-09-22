/* Repair the `color` / `colorHex` fields on the products collection.

   The collection carried three faults, the same ones the static data files
   carried and a few more besides:

   1. #2D5A27 (the matcha green) was used as a fallback hex wherever a real one
      was missing, so sixteen colour names rendered dark green — including
      Black and White.
   2. Twelve values were product names rather than colours ("Coral Blouse").
   3. Several names shared one hex, or split one dye across near-duplicates
      ("Brown" / "Dark Brown" / "Warm Brown").

   Every replacement hex below was read off that garment's own photography
   rather than invented, and a name is only merged into another when it is a
   texture or qualifier of the same dye ("Charcoal Marl" into Charcoal), never
   when the hue genuinely differs.

   Usage:
     node scripts/fixProductColors.mjs           # dry run, writes a backup
     node scripts/fixProductColors.mjs --apply   # writes the changes
*/

import 'dotenv/config';
import dns from 'node:dns';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const FIX = {
  // Stranded on the green fallback
  'Black':               ['Black',            '#1C1B1E'],
  'White':               ['White',            '#F5F5F5'],
  'Yellow':              ['Mustard',          '#D4A338'],
  'Soft':                ['Peach',            '#EDBCA4'],
  'Peach':               ['Peach',            '#EDBCA4'],
  'Peach Skirt':         ['Peach',            '#EDBCA4'],
  'Silk Scarf':          ['Apricot',          '#E38953'],
  'Cognac Boots':        ['Caramel',          '#A0522D'],
  'Charcoal Marl':       ['Charcoal',         '#2C3539'],
  'Dark Brown Charcoal': ['Charcoal',         '#2C3539'],
  'Ivory Cream':         ['Ivory',            '#EAE1D5'],
  'Warm Ivory':          ['Ivory',            '#EAE1D5'],
  'Metallic Silver':     ['Silver',           '#C0C0C0'],
  'Copper Bronze':       ['Copper',           '#A24C25'],
  'Iridescent Lilac':    ['Iridescent Lilac', '#A9A0C4'],
  'Signal Orange':       ['Signal Orange',    '#E86518'],

  // Product names sitting in the colour field
  'Coral Blouse':        ['Coral',   '#FF6F61'],
  'Coral Bag':           ['Coral',   '#FF6F61'],
  'Coral Sneakers':      ['Coral',   '#FF6F61'],
  'Cream Bag':           ['Cream',   '#FFFDD0'],
  'Gold Necklace':       ['Gold',    '#D4AF37'],
  'Mustard Sweater':     ['Mustard', '#D4A338'],
  'Teal Pants':          ['Teal',    '#00796B'],
  'Cobalt Coat':         ['Cobalt',  '#1A365D'],
  'Silver Earrings':     ['Silver',  '#C0C0C0'],

  // Near-duplicates of one dye
  'Dark Brown':          ['Brown',   '#5C4033'],
  'Warm Brown':          ['Brown',   '#5C4033'],
  'Warm Cream':          ['Cream',   '#FFFDD0'],
};

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL;
if (!uri) {
  console.error('No MongoDB connection string in the environment.');
  process.exit(1);
}

/* A mongodb+srv:// string is resolved through a DNS SRV lookup, and Node asks
   the system's configured nameservers directly rather than going through the
   OS resolver. On this machine that query is refused even though the same
   lookup succeeds via nslookup, so fall back to a public resolver instead of
   failing outright. The default is tried first and kept when it works. */
async function connect() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  } catch (err) {
    if (!/querySrv|ECONNREFUSED|ETIMEOUT|EAI_AGAIN/.test(String(err))) throw err;
    console.log('SRV lookup failed on the system resolver; retrying via 1.1.1.1 / 8.8.8.8');
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  }
}

await connect();
const products = mongoose.connection.collection('products');
const docs = await products.find({}).toArray();
console.log(`connected · ${docs.length} documents\n`);

// The backup is written on every run, dry or not, and before anything is
// touched: it is the only way back if a mapping turns out to be wrong.
const backupDir = path.resolve('storage');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `products-backup-${stamp}.json`);
fs.writeFileSync(backupPath, JSON.stringify(docs, null, 2));
console.log(`backup written: ${backupPath}\n`);

const ops = [];
const changeLog = [];

for (const doc of docs) {
  const set = {};

  const top = FIX[doc.color];
  if (top && (doc.color !== top[0] || doc.colorHex !== top[1])) {
    set.color = top[0];
    set.colorHex = top[1];
    changeLog.push(`${doc.name} · ${doc.color} ${doc.colorHex} -> ${top[0]} ${top[1]}`);
  }

  if (Array.isArray(doc.variants)) {
    doc.variants.forEach((variant, i) => {
      const fix = FIX[variant?.color];
      if (!fix) return;
      if (variant.color === fix[0] && variant.colorHex === fix[1]) return;
      set[`variants.${i}.color`] = fix[0];
      set[`variants.${i}.colorHex`] = fix[1];
      changeLog.push(`${doc.name} · variant ${i} · ${variant.color} ${variant.colorHex} -> ${fix[0]} ${fix[1]}`);
    });
  }

  if (Object.keys(set).length) {
    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: set } } });
  }
}

console.log(`${changeLog.length} field pairs to change across ${ops.length} documents:\n`);
changeLog.forEach((line) => console.log('  ' + line));

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write these changes.');
} else if (ops.length) {
  const result = await products.bulkWrite(ops, { ordered: false });
  console.log(`\napplied · ${result.modifiedCount} documents modified`);

  const after = await products.find({}, { projection: { color: 1, colorHex: 1, variants: 1 } }).toArray();
  const dyes = new Map();
  let green = 0;
  for (const doc of after) {
    const vs = doc.variants?.length ? doc.variants : [{ color: doc.color, colorHex: doc.colorHex }];
    for (const v of vs) {
      if (!v?.color) continue;
      if (v.colorHex === '#2D5A27') green++;
      dyes.set(v.color, v.colorHex);
    }
  }
  console.log(`verification · ${dyes.size} distinct dyes · ${green} still on the green fallback`);
  [...dyes.entries()].sort().forEach(([n, h]) => console.log(`  ${h}  ${n}`));
} else {
  console.log('\nNothing to change.');
}

await mongoose.disconnect();
