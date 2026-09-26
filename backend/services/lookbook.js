import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import Lookbook from '../models/Lookbook.js';
import DefaultProduct from '../models/Product.js';

const getProductModel = () => mongoose.models.Product || DefaultProduct;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const defaults = JSON.parse(fs.readFileSync(path.join(__dirname, '../../frontend/src/data/editorialSpreads.json'), 'utf8'));

export function defaultLookbooks() {
  return defaults.map(({ hotspots, shoppableItems, ...editorial }) => ({
    id: editorial.id, title: editorial.title, heroImage: editorial.heroImage,
    editorial, published: true, revision: 0,
    items: hotspots.map(h => ({ productId: h.productId, color: h.color, x: parseFloat(h.x), y: parseFloat(h.y) }))
  }));
}

/* Database rows created before inventory migrated still carry `quantity`.
   Orders reserve `sizeStock`/`stock`, so the editorial view must use that
   same source rather than incorrectly marking a stocked item unavailable. */
export function availableStock(product) {
  const buckets = Array.isArray(product?.sizeStock) ? product.sizeStock : [];
  if (buckets.length) {
    return buckets.reduce((total, row) => total + (Number(row?.stock) || 0), 0);
  }
  return Number(product?.stock ?? product?.quantity ?? 0) || 0;
}

export function resolveLookbooks(looks, products) {
  const productMap = new Map(products.flatMap(p => [[String(p._id), p], [p.id, p]]));
  const fallbackMap = new Map(defaults.flatMap(s => s.shoppableItems.map(i => [i.id, i])));
  return looks.filter(l => l.published).map(look => {
    const resolveItem = (link, detailFallback = {}) => {
      const product = productMap.get(link.productId);
      const variant = product?.variants?.find(v => v.color === link.color);
      const colorMatches = !link.color || product?.color === link.color || Boolean(variant);
      const source = product || fallbackMap.get(link.productId) || detailFallback;
      const sizes = (product?.sizes || []).filter(Boolean);
      const stock = availableStock(product);
      return {
        id: source.id || link.productId, productId: source.id || link.productId,
        name: source.name || source.title || 'สินค้ายังไม่พร้อม', title: source.name || source.title || 'สินค้ายังไม่พร้อม',
        price: source.price ?? null, category: source.category || '',
        color: link.color || source.color || '', image: variant?.image || source.image || '',
        initialVariant: variant || { color: link.color || source.color || '', image: source.image || '', colorHex: source.colorHex },
        specs: product?.specs,
        isDemo: product?.isDemo || false,
        sizes, variants: product?.variants || [], gallery: product?.gallery || [], quantity: stock,
        inStock: Boolean(product && colorMatches && stock > 0 && sizes.length),
        linked: Boolean(product), x: `${parseFloat(link.x)}%`, y: `${parseFloat(link.y)}%`
      };
    };
    // A look saved before hotspots existed has no `items` at all, and .lean()
    // does not apply schema defaults, so treat it as a look with no pins.
    const items = (look.items ?? []).map(link => resolveItem(link));
    const itemByProductId = new Map(items.map(item => [item.productId, item]));
    const detailHotspots = (look.editorial?.detailHotspots ?? []).map(photo => ({
      ...photo,
      hotspots: (photo.hotspots ?? []).map(hotspot => {
        const item = itemByProductId.get(hotspot.productId) || resolveItem(hotspot, hotspot);
        return { ...hotspot, ...item, id: hotspot.id, title: item.name,
          imageQuadrant: item.linked ? undefined : hotspot.imageQuadrant,
          x: hotspot.x, y: hotspot.y };
      })
    }));
    return { ...look.editorial, id: look.id, title: look.title, heroImage: look.heroImage,
      hotspots: items.map((i, index) => ({ ...i, id: `HS-${look.id}-${index}` })), detailHotspots, shoppableItems: items };
  });
}

export function mergeDefaultLook(existing, look) {
  if (!existing) return look;
  const sameCover = existing.heroImage === look.heroImage;
  const items = existing.items ?? [];
  const missingFootwear = sameCover ? look.items.filter(item =>
    item.productId.endsWith('-SHOES') && !items.some(savedItem => savedItem.productId === item.productId)
  ) : [];
  const savedEditorial = existing.editorial ?? {};
  const savedPhotos = savedEditorial.detailHotspots ?? [];
  const defaultPhotos = look.editorial.detailHotspots ?? [];
  const detailHotspots = defaultPhotos.map(photo =>
    savedPhotos.find(saved => saved.image === photo.image) ?? photo
  ).concat(savedPhotos.filter(photo => !defaultPhotos.some(defaultPhoto => defaultPhoto.image === photo.image)));
  return {
    ...existing,
    items: [...items, ...missingFootwear],
    editorial: { ...look.editorial, ...savedEditorial, detailHotspots }
  };
}

export async function allLooks() {
  const saved = await Lookbook.find().sort({ id: 1 }).lean();
  const byId = new Map(saved.map(l => [l.id, l]));
  return defaultLookbooks().map(look => mergeDefaultLook(byId.get(look.id), look))
    .concat(saved.filter(l => !defaults.some(d => d.id === l.id)));
}

export async function findLinkedProducts(items) {
  const Product = getProductModel();
  const ids = [...new Set(items.map(i => i.productId))];
  const objectIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
  return Product.find({ $or: [{ id: { $in: ids } }, { _id: { $in: objectIds } }] })
    .select('id name price category color colorHex image variants sizes sizeStock stock quantity gallery mediaRevision specs')
    .lean();
}

export default { defaultLookbooks, resolveLookbooks, defaults, allLooks, findLinkedProducts };
