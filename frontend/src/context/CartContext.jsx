import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useToast } from './ToastContext.jsx';
import { api } from '../services/api';
import { useStoreMode } from './StoreModeContext.jsx';
import { shippingCostFor, FREE_SHIPPING_THRESHOLD } from '../config/shipping';

const CART_CONTEXT_KEY = Symbol.for('matcha.cart.context');
const CartContext = globalThis[CART_CONTEXT_KEY] || (globalThis[CART_CONTEXT_KEY] = createContext(null));

export const getCartKey = (item) => `${item.id || item.productId}-${item.size || 'default'}-${item.color || 'default'}`;

const parsePrice = (price) => {
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

  /* The current items, readable from a callback without putting them in its
     dependencies. These callbacks go out through context, so rebuilding them on
     every cart change would re-render every consumer; the ref keeps them stable
     and still current. */
  const cartItemsRef = useRef(cartItems);
  useEffect(() => { cartItemsRef.current = cartItems; }, [cartItems]);

  // Sync cart items to localStorage on any change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cartItems));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [cartItems, storageKey]);

  const addToCart = useCallback((product, customQty) => {
    const amount = customQty || product.quantity || 1;
    const resolvedSize = resolveDefaultSize(product);
    const resolvedProduct = {
      ...product,
      size: resolvedSize,
      quantity: amount
    };
    const key = getCartKey(resolvedProduct);

    setCartItems((prev) => {
      const idx = prev.findIndex((item) => getCartKey(item) === key);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: (next[idx].quantity || 1) + amount };
        return next;
      }
      return [...prev, resolvedProduct];
    });

    // Background sync to backend MongoDB Cart API (Task 8.5)
    api.addToCart({
      itemId: key,
      productId: resolvedProduct.id || resolvedProduct._id || 'SKU-ITEM',
      name: resolvedProduct.name || 'MatchA Item',
      price: parsePrice(resolvedProduct.price),
      quantity: amount,
      size: resolvedSize,
      color: resolvedProduct.color || 'Default',
      image: resolvedProduct.image || ''
    }).catch((err) => {
      console.warn('Backend cart sync note:', err.message);
    });
  }, []);

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
    api.updateCartItem(key, nextQty).catch((err) => {
      console.warn('Backend cart update note:', err.message);
    });
  }, []);

  const removeItem = useCallback((key) => {
    setCartItems((prev) => prev.filter((item) => getCartKey(item) !== key));

    // Background sync to backend MongoDB Cart API (Task 8.7)
    api.deleteCartItem(key).catch((err) => {
      console.warn('Backend cart delete note:', err.message);
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

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

  const value = {
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
