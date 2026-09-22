/* The bag has to survive a reload, and for a while it did not.
 *
 * StoreModeContext reports `demo` until the API answers, so CartProvider mounts
 * against `matcha_demo_cart` and switches to `matcha_cart` a moment later. The
 * items were read once, in the useState initialiser, and never re-read — so the
 * switch left state empty while the save effect wrote that emptiness over the
 * shopper's stored bag. Measured on production: add an item, reload, and
 * `matcha_cart` came back `[]`.
 *
 * "the stored bag survives the store mode arriving" below is the regression
 * test: against the one-shot initialiser it sees an empty cart and a cleared
 * key.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('./ToastContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

vi.mock('../services/api', () => ({
  api: {
    addToCart: vi.fn(() => Promise.resolve()),
    updateCartItem: vi.fn(() => Promise.resolve()),
    deleteCartItem: vi.fn(() => Promise.resolve()),
    clearCart: vi.fn(() => Promise.resolve())
  }
}));

/* The one thing these tests move: the mode the provider sees. It starts `demo`,
   the way the real provider does before its request comes back. */
let storeMode = { isDemo: true };
vi.mock('./StoreModeContext.jsx', () => ({ useStoreMode: () => storeMode }));

const { CartProvider, useCart } = await import('./CartContext.jsx');

const ITEM = {
  id: 'AUT-BOT-004',
  name: 'MatchA Autumn Jeans',
  price: 70.99,
  size: 'M',
  color: 'Brown',
  quantity: 1
};

const render = () => renderHook(() => useCart(), { wrapper: CartProvider });

beforeEach(() => {
  localStorage.clear();
  storeMode = { isDemo: true };
});

describe('CartProvider storage', () => {
  test('the stored bag survives the store mode arriving', async () => {
    // What a returning shopper has: a bag saved under the live key.
    localStorage.setItem('matcha_cart', JSON.stringify([ITEM]));

    const { result, rerender } = render();
    expect(result.current.cartItems).toHaveLength(0); // demo key, correctly empty

    // The API answers: this is a live store.
    act(() => { storeMode = { isDemo: false }; });
    rerender();

    await waitFor(() => expect(result.current.cartItems).toHaveLength(1));
    expect(result.current.cartItems[0].name).toBe('MatchA Autumn Jeans');
    expect(JSON.parse(localStorage.getItem('matcha_cart'))).toHaveLength(1);
  });

  test('an empty state is never written to a key it has not read', async () => {
    localStorage.setItem('matcha_cart', JSON.stringify([ITEM]));

    const { rerender } = render();
    act(() => { storeMode = { isDemo: false }; });
    rerender();

    // The moment of the switch is the one that used to clear it.
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem('matcha_cart'))).toHaveLength(1));
  });

  test('each mode keeps its own bag', async () => {
    localStorage.setItem('matcha_cart', JSON.stringify([ITEM]));
    localStorage.setItem('matcha_demo_cart', JSON.stringify([]));

    const { result, rerender } = render();
    act(() => { result.current.addToCart({ ...ITEM, id: 'DEMO-ONLY' }); });
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem('matcha_demo_cart'))).toHaveLength(1));

    act(() => { storeMode = { isDemo: false }; });
    rerender();

    await waitFor(() => expect(result.current.cartItems).toHaveLength(1));
    expect(result.current.cartItems[0].id).toBe('AUT-BOT-004', 'the live bag, not the demo one');
    expect(JSON.parse(localStorage.getItem('matcha_demo_cart'))).toHaveLength(1);
  });
});
