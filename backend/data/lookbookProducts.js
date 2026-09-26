import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const spreads = JSON.parse(fs.readFileSync(path.join(here, '../../frontend/src/data/editorialSpreads.json'), 'utf8'));

const GARMENT_SIZES = ['S', 'M', 'L', 'XL'];
const SHOE_SIZES = ['EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'];

export function priceForLookbookPiece(piece) {
  const name = piece.name.toLowerCase();
  if (piece.category === 'Outerwear') {
    if (name.includes('coat') || name.includes('cape')) return 139;
    if (name.includes('parka') || name.includes('puffer')) return 129;
    if (name.includes('vest')) return 89;
    return 119;
  }
  if (piece.category === 'Tops') {
    if (name.includes('t-shirt')) return 29;
    if (name.includes('mesh')) return 35;
    if (name.includes('shirt')) return 45;
    if (name.includes('bustier')) return 49;
    return 69;
  }
  if (piece.category === 'Bottoms') {
    if (name.includes('leather')) return 95;
    if (name.includes('cargo')) return 89;
    if (name.includes('silver') || name.includes('metallic')) return 89;
    return 79;
  }
  if (piece.category === 'Shoes') {
    if (name.includes('sandal')) return 59;
    if (name.includes('slip-on')) return 69;
    if (name.includes('sneaker')) return 79;
    return 95;
  }
  if (piece.category === 'Accessories') return name.includes('bag') ? 59 : 39;
  throw new Error(`Unknown Lookbook category: ${piece.category}`);
}

export function buildLookbookProducts(sourceSpreads = spreads) {
  return sourceSpreads.flatMap(spread => {
    const pieces = [
      ...spread.shoppableItems.filter(piece => piece.linked === false).map(piece => ({ piece, photoTitle: spread.title })),
      ...spread.detailHotspots.flatMap(photo => photo.hotspots.map(piece => ({ piece, photoTitle: photo.title })))
    ];
    return pieces.map(({ piece, photoTitle }) => {
      const sizes = piece.category === 'Shoes' ? SHOE_SIZES : piece.category === 'Accessories' ? ['OS'] : GARMENT_SIZES;
      const eachStock = piece.category === 'Accessories' ? 12 : 3;
      return {
        id: piece.productId || piece.id,
        sku: piece.productId || piece.id,
        name: piece.name,
        description: `${piece.name} สี ${piece.color} จากลุค ${photoTitle} ใน MatchA Lookbook`,
        price: priceForLookbookPiece(piece),
        image: piece.image.replace(/\.png$/, '.webp'),
        category: piece.category,
        season: spread.season,
        color: piece.color,
        sizes,
        sizeStock: sizes.map(size => ({ size, stock: eachStock })),
        stock: sizes.length * eachStock,
        inStock: true,
        tag: 'Lookbook Edition'
      };
    });
  });
}

export const lookbookProducts = buildLookbookProducts();
