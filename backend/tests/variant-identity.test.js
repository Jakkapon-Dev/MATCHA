/* C3 — a cart line is productId + size + colour name.

   Four garments carried two variants under one colour name (Brown twice where
   the second photo is dark brown, Cream twice, Mustard twice). The cart and
   the order key a line on that name, so choosing the second variant merged it
   into the first and the order recorded the wrong colour. Colour names must be
   unique within a product, in both copies of the catalogue. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import backendProducts from '../data/products.js';

const frontendModule = await import('../../frontend/src/data/productsData.js');
const frontendProducts = frontendModule.default || Object.values(frontendModule).find(Array.isArray);

for (const [label, list] of [['backend', backendProducts], ['frontend', frontendProducts]]) {
  test(`${label} catalogue: no product repeats a variant colour name`, () => {
    assert.ok(Array.isArray(list) && list.length > 0);
    const clashes = [];
    for (const product of list) {
      const names = (product.variants || []).map((v) => String(v.color || '').trim().toLowerCase());
      const dupes = names.filter((name, i) => names.indexOf(name) !== i);
      if (dupes.length) clashes.push(`${product.id}: ${[...new Set(dupes)].join(', ')}`);
    }
    assert.deepEqual(clashes, []);
  });
}

test('the four garments that clashed now name each variant apart', () => {
  const colours = (id) => backendProducts.find((p) => p.id === id).variants.map((v) => v.color);
  assert.ok(colours('AUT-BOT-006').includes('Dark Brown'));
  assert.ok(colours('AUT-TOP-011').includes('Dark Brown'));
  assert.ok(colours('AUT-TOP-009').includes('Yellow'));
  assert.ok(colours('SPR-TOP-021').includes('Warm Cream'));
});
