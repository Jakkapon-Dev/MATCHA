const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');
const Media = require('../models/MediaAsset');
const { storeImage } = require('./mediaStorage');
const { defaults } = require('./lookbook');

const getProductModel = () => {
  try {
    return require('../models/Product');
  } catch {
    return mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  }
};

async function importLookbookMedia(uploadedBy) {
  const Product = getProductModel();
  let imported = 0;
  for (const spread of defaults) {
    for (const item of spread.shoppableItems) {
      let asset = await Media.findOne({ sourcePath: item.image });
      if (!asset) {
        const buffer = await fs.readFile(path.join(__dirname, '../../frontend/public', item.image));
        const stored = await storeImage(buffer);
        asset = await Media.findOneAndUpdate({ sourcePath: item.image }, { $setOnInsert: { ...stored, sourcePath: item.image, alt: item.name, originalName: path.basename(item.image), uploadedBy } }, { upsert: true, returnDocument: 'after' });
      }
      await Product.updateOne({ id: item.id }, { $setOnInsert: {
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
module.exports = { importLookbookMedia };
