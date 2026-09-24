import { describe, it, expect } from 'vitest';
import { bundleDiscountFor } from './coupons';

const top = { category: 'Tops', price: 100, quantity: 1 };
const bottom = { category: 'Bottoms', price: 100, quantity: 1 };
const shoe = { category: 'Footwear', subCategory: 'Sneakers', price: 100, quantity: 1 };
const acc = { category: 'Accessories', price: 100, quantity: 1 };

describe('bundleDiscountFor mirrors the server rule', () => {
  it('discounts a complete four-slot set', () => {
    expect(bundleDiscountFor([top, bottom, shoe, acc])).toBe(48);
  });
  it('ignores the isBundleItem flag on an incomplete set', () => {
    expect(bundleDiscountFor([{ ...top, isBundleItem: true }, { ...bottom, isBundleItem: true }])).toBe(0);
  });
  it('discounts a complete set without the flag', () => {
    expect(bundleDiscountFor([top, bottom, shoe, acc].map(i => ({ ...i, isBundleItem: false })))).toBe(48);
  });
  it('caps the discount at the number of complete sets', () => {
    expect(bundleDiscountFor([{ ...top, quantity: 3 }, bottom, shoe, acc])).toBe(48);
  });
});
