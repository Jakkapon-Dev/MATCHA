import { describe, it, expect } from 'vitest';
import { bundleDiscountFor, bundleQualifiedIndices, bundleSlotFor } from './coupons';

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

describe('bundleQualifiedIndices reflects active bundle items', () => {
  it('returns all 4 indices for a complete set', () => {
    const indices = bundleQualifiedIndices([top, bottom, shoe, acc]);
    expect(Array.from(indices).sort()).toEqual([0, 1, 2, 3]);
  });

  it('returns empty Set on incomplete bundle even with isBundleItem: true', () => {
    const indices = bundleQualifiedIndices([{ ...top, isBundleItem: true }, { ...bottom, isBundleItem: true }]);
    expect(indices.size).toBe(0);
  });

  it('excludes excess lines beyond complete sets quota', () => {
    const extraTop = { category: 'Tops', price: 100, quantity: 1 };
    const indices = bundleQualifiedIndices([top, bottom, shoe, acc, extraTop]);
    expect(indices.has(0)).toBe(true);
    expect(indices.has(1)).toBe(true);
    expect(indices.has(2)).toBe(true);
    expect(indices.has(3)).toBe(true);
    expect(indices.has(4)).toBe(false);
  });
});

describe('bundleSlotFor product metadata lookup fallback', () => {
  it('resolves slot from productsData when category is missing', () => {
    // AUT-TOP-009 is a Top in productsData
    expect(bundleSlotFor({ productId: 'AUT-TOP-009' })).toBe('tops');
    // AUT-ACC-001 is an Accessory in productsData
    expect(bundleSlotFor({ id: 'AUT-ACC-001' })).toBe('accessories');
  });

  it('returns null safely for unknown product id', () => {
    expect(bundleSlotFor({ productId: 'NONEXISTENT-SKU-999' })).toBe(null);
  });

  it('returns null safely for empty or invalid item', () => {
    expect(bundleSlotFor(null)).toBe(null);
    expect(bundleSlotFor(undefined)).toBe(null);
    expect(bundleSlotFor({})).toBe(null);
  });

  it('calculates bundle discount when items have only productId without category', () => {
    const restoredCart = [
      { productId: 'AUT-TOP-009', price: 100, quantity: 1 },
      { productId: 'AUT-BOT-003', price: 100, quantity: 1 },
      { productId: 'AUT-ACC-007', price: 100, quantity: 1 },
      { productId: 'AUT-ACC-001', price: 100, quantity: 1 },
    ];
    expect(bundleDiscountFor(restoredCart)).toBe(48);
    const indices = bundleQualifiedIndices(restoredCart);
    expect(indices.size).toBe(4);
  });
});

