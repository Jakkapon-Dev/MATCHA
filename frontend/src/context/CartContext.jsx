import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useToast } from './ToastContext.jsx';
import { api } from '../services/api';
import { useStoreMode } from './StoreModeContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { shippingCostFor, FREE_SHIPPING_THRESHOLD } from '../config/shipping';

const CART_CONTEXT_KEY = Symbol.for('matcha.cart.context');
const CartContext = globalThis[CART_CONTEXT_KEY] || (globalThis[CART_CONTEXT_KEY] = createContext(null));

export const getCartKey = (item) => `${item.id || item.productId}-${item.size || 'default'}-${item.color || 'default'}`;

export const parsePrice = (price) => {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    const parsed = parseFloat(price.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const loadInitialCart = (storageKey) => {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Failed to load cart from localStorage:', err);
    return [];
  }
};

const resolveDefaultSize = (product) => {
  if (product.size) return product.size;
  if (product.sizes && product.sizes.length > 0) return product.sizes[0];
  const cat = (product.category || '').toLowerCase();
  if (cat.includes('access') || cat.includes('bag') || cat.includes('scarf') || cat.includes('jewelry')) return 'OS';
  if (cat.includes('shoe') || cat.includes('boot') || cat.includes('sneaker')) return 'EU 40';
  return 'M';
};

export function CartProvider({ children }) {
  const { isDemo } = useStoreMode();
  const storageKey = isDemo ? 'matcha_demo_cart' : 'matcha_cart';
  const [cartItems, setCartItems] = useState(() => loadInitialCart(storageKey));
  const { showToast } = useToast();

  /* Which key the items in state were actually read from.

     The store mode arrives from the API a moment after the first render, and
     until it does StoreModeContext reports demo — so this provider mounts
     against `matcha_demo_cart` and then flips to `matcha_cart`. The initialiser
     above runs once and never re-reads, so without this the flip left an empty
     cart in state and the save effect below wrote that emptiness straight over
     the shopper's stored bag. Every reload, every return visit and every trip
     back from Stripe cleared the bag. Reading the new key, and refusing to save
     to a key that has not been read yet, is what keeps it. */
  const [loadedKey, setLoadedKey] = useState(storageKey);

  useEffect(() => {
    if (loadedKey === storageKey) return;
    setCartItems(loadInitialCart(storageKey));
    setLoadedKey(storageKey);
  }, [storageKey, loadedKey]);

  /* The current items, readable from a callback without putting them in its
     dependencies. These callbacks go out through context, so rebuilding them on
     every cart change would re-render every consumer; the ref keeps them stable
     and still current. */
  const cartItemsRef = useRef(cartItems);
  useEffect(() => { cartItemsRef.current = cartItems; }, [cartItems]);

  /* Server writes go out one at a time, in the order the shopper made them.

     A PUT carries the quantity the line should end at, so the server keeps
     whichever PUT it applies last. Fired together, requests reach it in any
     order: five presses of − showed 1 in the bag and left 7 on the server.
     Chaining them keeps the server's order the shopper's order, and a quantity
     still waiting to be sent is replaced by the newer one rather than queued
     behind it, so a burst of presses costs one request per line in flight. */
  const syncChainRef = useRef(Promise.resolve());
  const pendingQtyRef = useRef(new Map());
  const enqueueSync = useCallback((task) => {
    syncChainRef.current = syncChainRef.current.then(task, task);
    return syncChainRef.current;
  }, []);
  // Bumped by every local change, so a server answer can tell it is out of date.
  const localEditsRef = useRef(0);

  // Sync cart items to localStorage on any change
  useEffect(() => {
    // Never write to a key whose contents have not been read yet.
    if (loadedKey !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(cartItems));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [cartItems, storageKey, loadedKey]);

  /* A signed-in shopper's bag is the one on the server.

     The browser used to write every change to the server and never read it
     back. Signing in merged the pre-sign-in basket into the account there, and
     the page went on showing whatever this browser happened to hold — nothing
     from another device, nothing that had been in the account before. Now the
     account's cart is read after sign-in (from the merge's answer) and on every
     load while signed in, and replaces what storage held.

     Signing out, or another account signing in, empties the bag on screen. The
     account keeps its cart on the server; the next person at this browser does
     not see it. */
  const { currentUser } = useAuth();
  const { ready: storeReady } = useStoreMode();
  const userId = currentUser?.id || null;
  const cartOwnerRef = useRef(undefined); // whose bag state holds; undefined until known

  useEffect(() => {
    if (!storeReady || loadedKey !== storageKey) return;
    const previous = cartOwnerRef.current;
    if (previous === userId) return;
    cartOwnerRef.current = userId;

    if (previous) {
      // The last shopper's bag, not the next one's. Only the screen is cleared.
      pendingQtyRef.current.clear();
      cartItemsRef.current = [];
      setCartItems([]);
    }
    if (!userId) return;

    const justSignedIn = previous === null;
    const hydrate = (request) => enqueueSync(async () => {
      const editsBefore = localEditsRef.current;
      let res;
      try {
        res = await request();
      } catch (err) {
        console.warn('Server cart not loaded; keeping this browser\'s bag:', err.message);
        return;
      }
      if (cartOwnerRef.current !== userId) return;
      // The server answered from a store that is not up (see cartRoutes).
      if (!res?.success || res.data?.available === false || !Array.isArray(res.data?.items)) return;
      if (localEditsRef.current !== editsBefore) {
        // Changed while the request was out: those writes are queued behind this
        // one, so read again once they have landed.
        hydrate(() => api.getCart());
        return;
      }
      const local = new Map(cartItemsRef.current.map((item) => [getCartKey(item), item]));
      const next = res.data.items.map((line) => {
        const known = local.get(line.itemId);
        return known
          ? { ...known, quantity: line.quantity }
          : { ...line, id: line.productId, quantity: line.quantity };
      });
      cartItemsRef.current = next;
      setCartItems(next);
    });

    hydrate(justSignedIn ? () => api.mergeGuestCart() : () => api.getCart());
  }, [userId, storeReady, loadedKey, storageKey, enqueueSync]);

  const addToCart = useCallback((product, customQty) => {
    localEditsRef.current += 1;
    /* How many to buy, and never how many are in stock.

       A product as the API returns it carries `quantity` — the stock count. The
       saved archive handed one straight in and a garment with 47 in stock went
       into the bag 47 times. A quantity counts only when the caller says so:
       the second argument, or a cart line it built by choosing a size. A bare
       product record gets one. */
    const explicit = parseInt(customQty, 10);
    const lineQty = parseInt(product.quantity, 10);
    const amount = explicit > 0 ? explicit
      : product.size && lineQty > 0 ? lineQty
        : 1;
    const resolvedSize = resolveDefaultSize(product);
    const resolvedProduct = {
      ...product,
      size: resolvedSize,
      quantity: amount
    };
    const key = getCartKey(resolvedProduct);

    // Worked out from the ref, as updateQty does, so an add and a press on +
    // in the same tick both count.
    const prev = cartItemsRef.current;
    const idx = prev.findIndex((item) => getCartKey(item) === key);
    const next = [...prev];
    if (idx > -1) {
      next[idx] = { ...next[idx], quantity: (next[idx].quantity || 1) + amount };
    } else {
      next.push(resolvedProduct);
    }
    cartItemsRef.current = next;
    setCartItems(next);

    // A quantity for this line is already waiting to go out: send the new
    // total with it instead of an increment that would land after it.
    const pending = pendingQtyRef.current;
    if (idx > -1 && pending.has(key)) {
      pending.set(key, next[idx].quantity);
      return;
    }

    // Background sync to backend MongoDB Cart API (Task 8.5)
    const payload = {
      itemId: key,
      productId: resolvedProduct.id || resolvedProduct._id || 'SKU-ITEM',
      name: resolvedProduct.name || 'MatchA Item',
      price: parsePrice(resolvedProduct.price),
      quantity: amount,
      size: resolvedSize,
      color: resolvedProduct.color || 'Default',
      image: resolvedProduct.image || ''
    };
    enqueueSync(() => api.addToCart(payload).catch((err) => {
      console.warn('Backend cart sync note:', err.message);
    }));
  }, [enqueueSync]);

  /* The new quantity is worked out from the current items and then applied,
     rather than captured out of the updater as it runs.

     It used to be the other way round: a variable declared outside the updater,
     assigned inside it, and read on the next line to send to the server. React
     does not promise to run an updater synchronously — it happened to, because
     React computes state eagerly while the update queue is empty. With a second
     update already queued that shortcut is skipped, the updater has not run,
     and the initial value goes to the server instead.

     Three clicks on + in one tick showed 10 in the bag and sent 8, 1, 1 — the
     server settling on 1 while the shopper saw 10, with nothing to reveal the
     disagreement because every screen reads local state. */
  const updateQty = useCallback((key, delta) => {
    localEditsRef.current += 1;
    const items = cartItemsRef.current;
    const current = items.find((item) => getCartKey(item) === key);
    if (!current) return;

    const nextQty = Math.max(1, (current.quantity || 1) + delta);
    const nextItems = items.map((item) => (
      getCartKey(item) === key ? { ...item, quantity: nextQty } : item
    ));

    /* The ref is advanced here rather than left to the effect that mirrors it.
       That effect runs after the commit, so three clicks inside one tick would
       all read the same pre-click quantity and each land on the same +1 — the
       bag would move by one however many times it was pressed. Writing it now
       makes the ref the synchronous record that rapid presses accumulate on,
       and the effect still covers changes made through the other callbacks. */
    cartItemsRef.current = nextItems;
    setCartItems(nextItems);

    // Background sync to backend MongoDB Cart API (Task 8.6)
    const pending = pendingQtyRef.current;
    const alreadyQueued = pending.has(key);
    pending.set(key, nextQty);
    if (alreadyQueued) return;
    enqueueSync(() => {
      if (!pending.has(key)) return undefined; // removed before it was sent
      const quantity = pending.get(key);
      pending.delete(key);
      return api.updateCartItem(key, quantity).catch((err) => {
        console.warn('Backend cart update note:', err.message);
      });
    });
  }, [enqueueSync]);

  const removeItem = useCallback((key) => {
    localEditsRef.current += 1;
    const next = cartItemsRef.current.filter((item) => getCartKey(item) !== key);
    cartItemsRef.current = next;
    setCartItems(next);
    pendingQtyRef.current.delete(key);

    // Background sync to backend MongoDB Cart API (Task 8.7)
    enqueueSync(() => api.deleteCartItem(key).catch((err) => {
      console.warn('Backend cart delete note:', err.message);
    }));
  }, [enqueueSync]);

  const clearCart = useCallback(() => {
    localEditsRef.current += 1;
    // The ref is reset with the state: updateQty reads it synchronously, so
    // leaving it holding the old items would let the next press compute a
    // quantity from a bag that no longer exists.
    cartItemsRef.current = [];
    setCartItems([]);
    pendingQtyRef.current.clear();

    enqueueSync(() => api.clearCart().catch((err) => {
      console.warn('Backend cart clear note:', err.message);
    }));
  }, [enqueueSync]);

  // Computed summary values
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + parsePrice(item.price) * (item.quantity || 1), 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cartItems]);

  const shipping = useMemo(() => {
    return cartItems.length === 0 ? 0 : shippingCostFor(subtotal);
  }, [cartItems.length, subtotal]);

  const total = useMemo(() => {
    return subtotal + shipping;
  }, [subtotal, shipping]);

  const awayFromFreeShipping = useMemo(() => {
    return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  }, [subtotal]);

  /* True once the bag on screen is the one for the store's real mode. Before
     that it is the demo fallback's (usually empty), and nothing should decide
     the bag is empty from it. */
  const cartReady = Boolean(storeReady) && loadedKey === storageKey;

  const value = {
    cartReady,
    cartItems,
    setCartItems,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
    getCartKey,
    cartCount,
    subtotal,
    shipping,
    total,
    awayFromFreeShipping,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
