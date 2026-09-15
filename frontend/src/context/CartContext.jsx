import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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

  const updateQty = useCallback((key, delta) => {
    let newCalculatedQty = 1;
    setCartItems((prev) =>
      prev.map((item) => {
        if (getCartKey(item) === key) {
          const qty = Math.max(1, (item.quantity || 1) + delta);
          newCalculatedQty = qty;
          return { ...item, quantity: qty };
        }
        return item;
      })
    );

    // Background sync to backend MongoDB Cart API (Task 8.6)
    api.updateCartItem(key, newCalculatedQty).catch((err) => {
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
