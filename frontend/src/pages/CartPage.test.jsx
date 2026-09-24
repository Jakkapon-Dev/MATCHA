import React from 'react';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import CartPage from './CartPage';

vi.mock('../context/LanguageContext.jsx', () => ({
  useLanguage: () => ({ t: (key) => key })
}));

describe('CartPage bundle badge behavior', () => {
  afterEach(() => {
    cleanup();
  });
  const top = { id: 'AUT-TOP-009', productId: 'AUT-TOP-009', name: 'Autumn Top', category: 'Tops', price: 65.99, quantity: 1, size: 'M' };
  const bottom = { id: 'AUT-BOT-003', productId: 'AUT-BOT-003', name: 'Autumn Skirt', category: 'Bottoms', price: 81.99, quantity: 1, size: 'M' };
  const shoe = { id: 'AUT-ACC-007', productId: 'AUT-ACC-007', name: 'Autumn Boots', category: 'Accessories', subCategory: 'Boots', price: 102.99, quantity: 1, size: 'OS' };
  const acc = { id: 'AUT-ACC-001', productId: 'AUT-ACC-001', name: 'Autumn Bag', category: 'Accessories', subCategory: 'Bags', price: 43.99, quantity: 1, size: 'OS' };

  test('does not show bundle badge on incomplete bundle even if items have isBundleItem: true (fixes False Positive)', () => {
    // 3 items with isBundleItem: true, but missing shoes
    const items = [
      { ...top, isBundleItem: true },
      { ...bottom, isBundleItem: true },
      { ...acc, isBundleItem: true }
    ];

    render(
      <CartPage
        cartItems={items}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
        onBackToStore={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    // No bundle badge should be rendered
    expect(screen.queryByText('cart.bundle')).toBeNull();
  });

  test('shows bundle badge on complete 4-slot set from normal catalog without isBundleItem: true (fixes False Negative)', () => {
    // 4 items from catalog, isBundleItem is false or undefined
    const items = [
      { ...top, isBundleItem: false },
      { ...bottom, isBundleItem: false },
      { ...shoe, isBundleItem: false },
      { ...acc, isBundleItem: false }
    ];

    render(
      <CartPage
        cartItems={items}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
        onBackToStore={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    const badges = screen.getAllByText('cart.bundle');
    expect(badges).toHaveLength(4);
  });

  test('caps bundle badges at the number of complete sets on excess items', () => {
    const extraTop = { id: 'AUT-TOP-010', productId: 'AUT-TOP-010', name: 'Extra Top', category: 'Tops', price: 50.0, quantity: 1, size: 'L' };
    const items = [top, bottom, shoe, acc, extraTop];

    render(
      <CartPage
        cartItems={items}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
        onBackToStore={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    // Only the 4 items forming the complete set should receive the bundle badge
    const badges = screen.getAllByText('cart.bundle');
    expect(badges).toHaveLength(4);
  });

  test('shows bundle badge on restored cart without category property via productsData lookup', () => {
    // Cart loaded from server has productId but no category
    const restoredItems = [
      { id: 'AUT-TOP-009', productId: 'AUT-TOP-009', name: 'Autumn Top', price: 65.99, quantity: 1, size: 'M' },
      { id: 'AUT-BOT-003', productId: 'AUT-BOT-003', name: 'Autumn Skirt', price: 81.99, quantity: 1, size: 'M' },
      { id: 'AUT-ACC-007', productId: 'AUT-ACC-007', name: 'Autumn Boots', price: 102.99, quantity: 1, size: 'OS' },
      { id: 'AUT-ACC-001', productId: 'AUT-ACC-001', name: 'Autumn Bag', price: 43.99, quantity: 1, size: 'OS' }
    ];

    render(
      <CartPage
        cartItems={restoredItems}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
        onBackToStore={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    const badges = screen.getAllByText('cart.bundle');
    expect(badges).toHaveLength(4);
  });
});
