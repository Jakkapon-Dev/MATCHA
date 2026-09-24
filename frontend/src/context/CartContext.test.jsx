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
    storeMode = { isDemo: false };
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
