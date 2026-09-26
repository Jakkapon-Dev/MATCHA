import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { lookbookProducts } from '../data/lookbookProducts.js';

const apply = process.argv.includes('--apply');

async function main() {
  const ids = lookbookProducts.map(product => product.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate Lookbook product IDs');

  if (!apply) {
    console.log(`Dry run: ${lookbookProducts.length} Lookbook products are ready to import.`);
    console.log('Run with --apply to insert missing products. Existing products are never changed.');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  await mongoose.connect(uri);
  try {
    const existing = await Product.find({ $or: [{ id: { $in: ids } }, { sku: { $in: ids } }] }, 'id sku').lean();
    const found = new Set(existing.flatMap(product => [product.id, product.sku]));
    let created = 0;
    for (const product of lookbookProducts) {
      if (found.has(product.id)) continue;
      await Product.create(product);
      created += 1;
    }
    console.log(`Created ${created} Lookbook products; left ${lookbookProducts.length - created} existing products unchanged.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  console.error(`Lookbook import failed: ${error.message}`);
  process.exitCode = 1;
});
