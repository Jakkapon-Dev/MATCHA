/* User A signs out and User B signs in on the same browser. Run through the
   real AuthProvider and CartProvider together, B must see only B's cart and
   none of A's saved lists, and A's cart must stay on the server. */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const serverCarts = {};
let signedIn = null;
vi.mock('../services/api', () => ({
  setToken: vi.fn((token) => { signedIn = token; }),
  api: {
    getCart: vi.fn(async () => ({ success: true, data: { items: serverCarts[signedIn] || [] } })),
    mergeGuestCart: vi.fn(async () => ({ success: true, data: { items: serverCarts[signedIn] || [] } })),
    addToCart: vi.fn(async () => ({ success: true })),
    updateCartItem: vi.fn(async () => ({ success: true })),
    deleteCartItem: vi.fn(async () => ({ success: true })),
    clearCart: vi.fn(async () => ({ success: true }))
  }
}));
vi.mock('./StoreModeContext.jsx', () => ({ useStoreMode: () => ({ isDemo: false, ready: true }) }));
vi.mock('./ToastContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

const { AuthProvider, useAuth } = await import('./AuthContext.jsx');
const { CartProvider, useCart } = await import('./CartContext.jsx');
const { api } = await import('../services/api');

const wrapper = ({ children }) => <AuthProvider><CartProvider>{children}</CartProvider></AuthProvider>;
const line = (id) => ({ itemId: `${id}-M-Black`, productId: id, name: id, price: 10, quantity: 1, size: 'M', color: 'Black' });

beforeEach(() => {
  localStorage.clear();
  signedIn = null;
  serverCarts['token-a'] = [line('A-ONLY')];
  serverCarts['token-b'] = [line('B-ONLY')];
});

describe('account switch on one browser', () => {
  test("B never sees A's cart, wishlist or saved looks", async () => {
    const { result } = renderHook(() => ({ auth: useAuth(), cart: useCart() }), { wrapper });

    act(() => { result.current.auth.login({ id: 'u_a' }, true, 'token-a'); });
    await waitFor(() => expect(result.current.cart.cartItems.map((i) => i.id)).toEqual(['A-ONLY']));
    localStorage.setItem('matcha_wishlist', JSON.stringify([{ id: 'A-FAVOURITE' }]));
    localStorage.setItem('matcha_saved_looks', JSON.stringify(['SPREAD-01']));

    act(() => { result.current.auth.logout(); });
    await waitFor(() => expect(result.current.cart.cartItems).toEqual([]));
    expect(JSON.parse(localStorage.getItem('matcha_cart'))).toEqual([]);
    expect(localStorage.getItem('matcha_wishlist')).toBeNull();
    expect(localStorage.getItem('matcha_saved_looks')).toBeNull();
    expect(api.clearCart).not.toHaveBeenCalled();

    act(() => { result.current.auth.login({ id: 'u_b' }, true, 'token-b'); });
    await waitFor(() => expect(result.current.cart.cartItems.map((i) => i.id)).toEqual(['B-ONLY']));
    expect(result.current.cart.cartCount).toBe(1);
  });
});
