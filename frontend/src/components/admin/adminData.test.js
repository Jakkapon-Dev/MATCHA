import { describe, expect, it } from 'vitest';
import { normalizeProduct } from './adminData';

describe('normalizeProduct', () => {
  it('uses size buckets instead of stale legacy quantity after a restock', () => {
    const product = normalizeProduct({
      _id: 'AUT-BOT-004',
      quantity: 25,
      stock: 50,
      sizeStock: [
        { size: 'S', stock: 10 },
        { size: 'M', stock: 12 },
        { size: 'L', stock: 8 },
      ],
    });

    expect(product.stock).toBe(30);
    expect(product.status).toBe('In Stock');
    expect(product.needsSizeChoice).toBe(true);
  });

  it('uses the current stock field for an unsized legacy product', () => {
    expect(normalizeProduct({ stock: 7, quantity: 25 }).stock).toBe(7);
  });
});
