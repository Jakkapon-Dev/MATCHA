import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookbookProducts, priceForLookbookPiece } from '../data/lookbookProducts.js';
import { defaultLookbooks, resolveLookbooks } from '../services/lookbook.js';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/public');

test('all 50 new Lookbook pieces have distinct catalog records with sellable sizes and artwork', () => {
  assert.equal(lookbookProducts.length, 50);
  assert.equal(new Set(lookbookProducts.map(product => product.id)).size, 50);
  for (const product of lookbookProducts) {
    assert.equal(product.sku, product.id);
    assert.ok(product.price > 0);
    assert.ok(product.sizes.length > 0);
    assert.equal(product.stock, product.sizeStock.reduce((total, row) => total + row.stock, 0));
    assert.ok(fs.existsSync(path.join(publicDir, product.image)));
  }
});

test('Lookbook detail pins become available when matching catalog products exist', () => {
  const resolved = resolveLookbooks(defaultLookbooks(), lookbookProducts);
  const details = resolved.flatMap(look => look.detailHotspots.flatMap(photo => photo.hotspots));
  assert.equal(details.length, 45);
  assert.ok(details.every(piece => piece.linked && piece.inStock && piece.price > 0));
  const coverShoes = resolved.flatMap(look => look.shoppableItems.filter(piece => piece.category === 'Shoes'));
  assert.equal(coverShoes.length, 5);
  assert.ok(coverShoes.every(piece => piece.linked && piece.inStock && piece.price > 0));
});

test('prices follow the current category range without a zero-price item', () => {
  assert.equal(priceForLookbookPiece({ name: 'Black Crossbody Bag', category: 'Accessories' }), 59);
  assert.equal(priceForLookbookPiece({ name: 'Brown Leather Sandals', category: 'Shoes' }), 59);
  assert.equal(priceForLookbookPiece({ name: 'Navy Technical Hooded Parka', category: 'Outerwear' }), 129);
});
