import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
    // A look saved before hotspots existed has no `items` at all, and .lean()
    // does not apply schema defaults, so treat it as a look with no pins.
    const items = (look.items ?? []).map(link => {
      const product = productMap.get(link.productId);
      const variant = product?.variants?.find(v => v.color === link.color);
      const colorMatches = !link.color || product?.color === link.color || Boolean(variant);
      const fallback = fallbackMap.get(link.productId);
      const source = product || fallback || {};
      const sizes = (product?.sizes || []).filter(Boolean);
      const stock = availableStock(product);
      return {
        id: source.id || link.productId, productId: source.id || link.productId,
        name: source.name || 'สินค้ายังไม่พร้อม', title: source.name || 'สินค้ายังไม่พร้อม',
        price: source.price || 0, category: source.category || '',
        color: link.color || source.color || '', image: variant?.image || source.image || '',
        initialVariant: variant || { color: link.color || source.color || '', image: source.image || '', colorHex: source.colorHex },
        specs: product?.specs,
        isDemo: product?.isDemo || false,
        sizes, variants: product?.variants || [], gallery: product?.gallery || [], quantity: stock,
        inStock: Boolean(product && colorMatches && stock > 0 && sizes.length),
        linked: Boolean(product), x: `${link.x}%`, y: `${link.y}%`
      };
    });
    return { ...look.editorial, id: look.id, title: look.title, heroImage: look.heroImage,
      hotspots: items.map((i, index) => ({ ...i, id: `HS-${look.id}-${index}` })), shoppableItems: items };
  });
}

export default { defaultLookbooks, resolveLookbooks, defaults };
