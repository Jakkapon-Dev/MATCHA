import test from 'node:test';
import assert from 'node:assert/strict';
import { availableStock, presentProduct } from '../controllers/productController.js';
import { availableStock as lookbookStock } from '../services/lookbook.js';

test('public product presentation never returns stale legacy quantity', () => {
  const product = {
    id: 'LOOK-06-SHIRT',
    quantity: 12,
    stock: 50,
    inStock: false,
    sizeStock: [{ size: 'M', stock: 25 }, { size: 'L', stock: 25 }],
  };

  assert.equal(availableStock(product), 50);
  assert.deepEqual(presentProduct(product), { ...product, stock: 50, quantity: 50, inStock: true });
  assert.equal(lookbookStock(product), 50);
});

test('legacy unsized products keep their current stock value', () => {
  assert.equal(availableStock({ quantity: 25, stock: 7 }), 7);
  assert.equal(lookbookStock({ quantity: 25, stock: 7 }), 7);
});
