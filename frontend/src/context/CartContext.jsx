import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const getCartKey = (item) => `${item.id}-${item.size || 'default'}-${item.color || 'default'}`;

const parsePrice = (price) => {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    const parsed = parseFloat(price.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const loadInitialCart = () => {
  try {
    const saved = localStorage.getItem('matcha_cart');
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Failed to load cart from localStorage:', err);
    return [];
  }
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadInitialCart);
  const { showToast } = useToast();

  // Sync cart items to localStorage on any change
  useEffect(() => {
    try {
      localStorage.setItem('matcha_cart', JSON.stringify(cartItems));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [cartItems]);

  const addToCart = useCallback((product, customQty) => {
    const amount = customQty || product.quantity || 1;
    setCartItems((prev) => {
      const key = getCartKey(product);
      const idx = prev.findIndex((item) => getCartKey(item) === key);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: (next[idx].quantity || 1) + amount };
        return next;
      }
      return [...prev, { ...product, quantity: amount }];
    });

    const name = product.name || 'Item';
    showToast(`Added ${name} (${amount}) to your cart! 🍵`);
  }, [showToast]);

  const updateQty = useCallback((key, delta) => {
    setCartItems((prev) =>
      prev.map((item) =>
        getCartKey(item) === key
          ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((key) => {
    setCartItems((prev) => prev.filter((item) => getCartKey(item) !== key));
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
    return cartItems.length === 0 || subtotal >= 100 ? 0 : 10;
  }, [cartItems.length, subtotal]);

  const total = useMemo(() => {
    return subtotal + shipping;
  }, [subtotal, shipping]);

  const awayFromFreeShipping = useMemo(() => {
    return Math.max(0, 100 - subtotal);
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
