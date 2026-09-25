import mongoose from 'mongoose';
import Media from '../models/MediaAsset.js';
import Lookbook from '../models/Lookbook.js';
import DefaultProduct from '../models/Product.js';
import { isManagedUrl } from './mediaStorage.js';
import { allLooks } from './lookbook.js';

const getProductModel = () => mongoose.models.Product || DefaultProduct;

export async function assertActiveUrls(urls) {
  const managed = urls.filter(isManagedUrl);
  const assets = await Media.find({ url: { $in: managed }, archived: false }).select('url').lean();
  if (managed.some(u => !assets.some(a => a.url === u))) {
    throw Object.assign(new Error('รูปถูกเก็บเข้าคลังแล้วหรือไม่พบรูป กรุณาเลือกใหม่'), { status: 400 });
  }
}

export async function usage(asset) {
  const Product = getProductModel();
  const urls = [asset.url, asset.thumbnailUrl, asset.sourcePath].filter(Boolean);
  const [products, looks] = await Promise.all([
    Product.find({ $or: [{ image: { $in: urls } }, { 'gallery.url': { $in: urls } }, { 'variants.image': { $in: urls } }] }).select('id name').lean(),
    Lookbook.find({ $or: [{ heroImage: { $in: urls } }, { 'editorial.detailImages': { $in: urls } }] }).select('id title').lean()
  ]);
  const inherited = (await allLooks()).filter(l => urls.includes(l.heroImage) || l.editorial?.detailImages?.some(u => urls.includes(u)));
  return [...products.map(p => ({ type: 'product', id: p.id, name: p.name })), ...new Map([...looks, ...inherited].map(l => [l.id, { type: 'lookbook', id: l.id, name: l.title }])).values()];
}

export default {
  assertActiveUrls,
  usage
};
