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
    clearCart: vi.fn(() => Promise.resolve()),
    getCart: vi.fn(() => Promise.resolve({ success: true, data: { items: [] } })),
    mergeGuestCart: vi.fn(() => Promise.resolve({ success: true, data: { items: [] } }))
  }
}));

// Who is signed in; the hydration tests change it between renders.
let auth = { currentUser: null };
vi.mock('./AuthContext.jsx', () => ({ useAuth: () => auth }));

/* The one thing these tests move: the mode the provider sees. It starts `demo`,
   the way the real provider does before its request comes back. */
let storeMode = { isDemo: true };
vi.mock('./StoreModeContext.jsx', () => ({ useStoreMode: () => storeMode }));

const { CartProvider, useCart } = await import('./CartContext.jsx');
const { api } = await import('../services/api');

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
  auth = { currentUser: null };
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

/* The server keeps whichever quantity it applies last, and requests fired
   together reach it in any order — five presses of − once showed 1 in the bag
   and left 7 on the server. Each write now waits for the one before it. */
describe('CartProvider server sync order', () => {
  const deferred = () => {
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    return { promise, resolve };
  };

  beforeEach(() => {
    storeMode = { isDemo: false, ready: true };
    vi.mocked(api.addToCart).mockReset().mockImplementation(() => Promise.resolve());
    vi.mocked(api.updateCartItem).mockReset().mockImplementation(() => Promise.resolve());
    vi.mocked(api.deleteCartItem).mockReset().mockImplementation(() => Promise.resolve());
    vi.mocked(api.clearCart).mockReset().mockImplementation(() => Promise.resolve());
  });

  test('never has two writes in flight, and the last quantity sent is the one on screen', async () => {
    const add = deferred();
    vi.mocked(api.addToCart).mockImplementation(() => add.promise);
    let inFlight = 0;
    let maxInFlight = 0;
    vi.mocked(api.updateCartItem).mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
    });

    const { result } = render();
    act(() => { result.current.addToCart(ITEM); });
    const key = result.current.getCartKey(result.current.cartItems[0]);

    // Six presses while the add is still out: nothing else may leave yet.
    act(() => {
      for (let i = 0; i < 6; i += 1) result.current.updateQty(key, 1);
      result.current.updateQty(key, -1);
    });
    expect(api.updateCartItem).not.toHaveBeenCalled();
    expect(result.current.cartItems[0].quantity).toBe(6);

    await act(async () => { add.resolve(); });
    await waitFor(() => expect(api.updateCartItem).toHaveBeenCalled());

    const calls = vi.mocked(api.updateCartItem).mock.calls;
    expect(calls.at(-1)).toEqual([key, 6]);
    expect(calls).toHaveLength(1); // the burst collapsed into one request
    expect(maxInFlight).toBe(1);
  });

  test('a removal waits for the writes queued before it and drops an unsent quantity', async () => {
    const add = deferred();
    vi.mocked(api.addToCart).mockImplementation(() => add.promise);
    const { result } = render();
    act(() => { result.current.addToCart(ITEM); });
    const key = result.current.getCartKey(result.current.cartItems[0]);

    act(() => {
      result.current.updateQty(key, 2);
      result.current.removeItem(key);
    });
    expect(api.deleteCartItem).not.toHaveBeenCalled();

    await act(async () => { add.resolve(); });
    await waitFor(() => expect(api.deleteCartItem).toHaveBeenCalledWith(key));
    expect(api.updateCartItem).not.toHaveBeenCalled();
    expect(result.current.cartItems).toHaveLength(0);
  });

  test('adding to a line whose new quantity is still waiting sends the total, not an increment', async () => {
    const add = deferred();
    vi.mocked(api.addToCart).mockImplementationOnce(() => add.promise);
    const { result } = render();
    act(() => { result.current.addToCart(ITEM); });
    const key = result.current.getCartKey(result.current.cartItems[0]);

    act(() => {
      result.current.updateQty(key, 1);  // 2, waiting behind the first add
      result.current.addToCart(ITEM);    // 3
    });
    await act(async () => { add.resolve(); });
    await waitFor(() => expect(api.updateCartItem).toHaveBeenCalled());

    expect(api.addToCart).toHaveBeenCalledTimes(1);
    expect(vi.mocked(api.updateCartItem).mock.calls.at(-1)).toEqual([key, 3]);
    expect(result.current.cartItems[0].quantity).toBe(3);
  });

  test('a failed write does not stop the ones after it', async () => {
    vi.mocked(api.addToCart).mockImplementationOnce(() => Promise.reject(new Error('offline')));
    const { result } = render();
    act(() => {
      result.current.addToCart(ITEM);
      result.current.addToCart({ ...ITEM, id: 'SECOND' });
    });
    await waitFor(() => expect(api.addToCart).toHaveBeenCalledTimes(2));
  });
});

/* The browser wrote every change to the server and never read it back, so a
   signed-in shopper saw only what this browser held — not the account's cart,
   not the basket the sign-in had just merged into it. */
describe('CartProvider server cart hydration', () => {
  const serverLine = (id, quantity, extra = {}) => ({
    itemId: `${id}-M-Black`, productId: id, name: `Garment ${id}`, price: 20, quantity, size: 'M', color: 'Black', ...extra
  });
  const answer = (items) => Promise.resolve({ success: true, data: { items } });

  beforeEach(() => {
    storeMode = { isDemo: false, ready: true };
    for (const fn of Object.values(api)) vi.mocked(fn).mockReset().mockImplementation(() => answer([]));
  });

  test('a signed-in load shows the account cart even when this browser holds none', async () => {
    auth = { currentUser: { id: 'u_a' } };
    vi.mocked(api.getCart).mockImplementation(() => answer([serverLine('P1', 2), serverLine('P2', 1)]));

    const { result } = render();
    await waitFor(() => expect(result.current.cartItems).toHaveLength(2));
    expect(result.current.cartItems.map((i) => [i.id, i.quantity])).toEqual([['P1', 2], ['P2', 1]]);
    expect(api.mergeGuestCart).not.toHaveBeenCalled();
    expect(result.current.cartCount).toBe(3);
  });

  test('on refresh the server quantity wins over a stale stored one, keeping the stored details', async () => {
    localStorage.setItem('matcha_cart', JSON.stringify([{ id: 'P1', size: 'M', color: 'Black', quantity: 5, price: 20, category: 'Tops', name: 'Garment P1' }]));
    auth = { currentUser: { id: 'u_a' } };
    vi.mocked(api.getCart).mockImplementation(() => answer([serverLine('P1', 2)]));

    const { result } = render();
    await waitFor(() => expect(result.current.cartItems[0]?.quantity).toBe(2));
    expect(result.current.cartItems[0].category).toBe('Tops');
    await waitFor(() => expect(JSON.parse(localStorage.getItem('matcha_cart'))[0].quantity).toBe(2));
  });

  test('signing in merges the guest basket and shows the merged cart', async () => {
    const { result, rerender } = render();
    act(() => { result.current.addToCart({ ...ITEM, id: 'P1', size: 'M', color: 'Black', price: 20 }); });
    await waitFor(() => expect(api.addToCart).toHaveBeenCalled());

    vi.mocked(api.mergeGuestCart).mockImplementation(() => answer([serverLine('P1', 1), serverLine('P9', 4)]));
    act(() => { auth = { currentUser: { id: 'u_a' } }; });
    rerender();

    await waitFor(() => expect(result.current.cartItems).toHaveLength(2));
    expect(api.mergeGuestCart).toHaveBeenCalledTimes(1);
    expect(api.getCart).not.toHaveBeenCalled();
    expect(result.current.cartItems.find((i) => i.id === 'P9').quantity).toBe(4);
  });

  test("signing out empties the bag on screen, and the next account never sees the last one's", async () => {
    auth = { currentUser: { id: 'u_a' } };
    vi.mocked(api.getCart).mockImplementation(() => answer([serverLine('A-ONLY', 3)]));
    const { result, rerender } = render();
    await waitFor(() => expect(result.current.cartItems).toHaveLength(1));

    act(() => { auth = { currentUser: null }; });
    rerender();
    await waitFor(() => expect(result.current.cartItems).toHaveLength(0));
    expect(JSON.parse(localStorage.getItem('matcha_cart'))).toEqual([]);
    expect(api.clearCart).not.toHaveBeenCalled(); // A's cart stays on the server

    vi.mocked(api.mergeGuestCart).mockImplementation(() => answer([serverLine('B-ONLY', 1)]));
    act(() => { auth = { currentUser: { id: 'u_b' } }; });
    rerender();
    await waitFor(() => expect(result.current.cartItems.map((i) => i.id)).toEqual(['B-ONLY']));
  });

  test('rapid quantity changes after the merge still end with one request carrying the final quantity', async () => {
    auth = { currentUser: { id: 'u_a' } };
    vi.mocked(api.getCart).mockImplementation(() => answer([serverLine('P1', 1)]));
    const { result } = render();
    await waitFor(() => expect(result.current.cartItems).toHaveLength(1));

    const key = result.current.getCartKey(result.current.cartItems[0]);
    act(() => { for (let i = 0; i < 5; i += 1) result.current.updateQty(key, 1); });
    await waitFor(() => expect(api.updateCartItem).toHaveBeenCalled());
    expect(vi.mocked(api.updateCartItem).mock.calls).toEqual([[key, 6]]);
  });

  test('a change made while the account cart is loading is kept, and the cart is read again after it lands', async () => {
    auth = { currentUser: { id: 'u_a' } };
    let release;
    vi.mocked(api.getCart)
      .mockImplementationOnce(() => new Promise((r) => { release = () => r({ success: true, data: { items: [serverLine('P1', 1)] } }); }))
      .mockImplementation(() => answer([serverLine('P1', 1), serverLine('NEW', 1)]));
    const { result } = render();
    await waitFor(() => expect(api.getCart).toHaveBeenCalledTimes(1));

    act(() => { result.current.addToCart({ id: 'NEW', size: 'M', color: 'Black', price: 20, name: 'New' }); });
    await act(async () => { release(); });

    await waitFor(() => expect(api.getCart).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.cartItems.map((i) => i.id).sort()).toEqual(['NEW', 'P1']));
  });

  test('an empty answer from a store that is not up does not wipe the bag', async () => {
    localStorage.setItem('matcha_cart', JSON.stringify([ITEM]));
    auth = { currentUser: { id: 'u_a' } };
    vi.mocked(api.getCart).mockImplementation(() => Promise.resolve({ success: true, data: { items: [], available: false } }));
    const { result } = render();
    await waitFor(() => expect(api.getCart).toHaveBeenCalled());
    expect(result.current.cartItems).toHaveLength(1);
  });

  test('nothing is loaded before the store mode is known', async () => {
    storeMode = { isDemo: true, ready: false };
    auth = { currentUser: { id: 'u_a' } };
    render();
    await Promise.resolve();
    expect(api.getCart).not.toHaveBeenCalled();
  });
});
