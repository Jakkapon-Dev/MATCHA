import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import Media from '../models/MediaAsset.js';
import { storeImage } from './mediaStorage.js';
import { defaults } from './lookbook.js';
import Product from '../models/Product.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getProductModel = () => {
  return mongoose.models.Product || Product;
};

export async function importLookbookMedia(uploadedBy) {
  const ProductModel = getProductModel();
  let imported = 0;
  for (const spread of defaults) {
    for (const item of spread.shoppableItems) {
      let asset = await Media.findOne({ sourcePath: item.image });
      if (!asset) {
        const buffer = await fs.readFile(path.join(__dirname, '../../frontend/public', item.image));
        const stored = await storeImage(buffer);
        asset = await Media.findOneAndUpdate({ sourcePath: item.image }, { $setOnInsert: { ...stored, sourcePath: item.image, alt: item.name, originalName: path.basename(item.image), uploadedBy } }, { upsert: true, returnDocument: 'after' });
      }
      await ProductModel.updateOne({ id: item.id }, { $setOnInsert: {
        id: item.id, name: item.name, description: `Editorial garment: ${item.name}. Product details pending confirmation.`,
        category: item.category, price: item.price, color: item.color, season: spread.season,
        tag: 'Editorial', quantity: 0, inStock: false, sizes: [], image: asset.url,
        gallery: [{ mediaId: asset._id, url: asset.url, alt: asset.alt, color: item.color }]
      } }, { upsert: true, runValidators: true });
      imported++;
    }
  }
  return { imported };
}

export default { importLookbookMedia };
