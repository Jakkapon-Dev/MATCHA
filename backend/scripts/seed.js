import 'dotenv/config';
import dns from 'node:dns';

// DNS SRV lookup fix for MongoDB Atlas on certain networks
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import Product from '../models/Product.js';
import productsData from '../data/products.js';

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️  [seed] No MONGODB_URI found in .env. Skipping database seeding.');
    return;
  }

  console.log('🍃 [seed] Connecting to MongoDB...');
  await mongoose.connect(uri);

  const existingCount = await Product.countDocuments();
  const sourceItems = Array.isArray(productsData) ? productsData : productsData.productsData;
  console.log(`📊 [seed] Existing products in DB: ${existingCount}. Master catalog items: ${sourceItems.length}`);

  if (existingCount === 0 || process.argv.includes('--force')) {
    console.log('🚀 [seed] Seeding products into database...');
    let seeded = 0;
    for (const item of sourceItems) {
      await Product.findOneAndUpdate(
        { id: item.id },
        { $setOnInsert: item },
        { upsert: true, new: true }
      );
      seeded++;
    }
    console.log(`✅ [seed] Successfully seeded ${seeded} products.`);
  } else {
    console.log('ℹ️  [seed] Database already contains products. Use --force to re-seed.');
  }

  await mongoose.disconnect();
  console.log('✨ [seed] Finished cleanly.');
}

seed().catch((err) => {
  console.error('❌ [seed] Error during seeding:', err.message);
  process.exit(1);
});
