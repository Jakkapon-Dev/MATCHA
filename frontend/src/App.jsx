import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { api } from './services/api';

import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import Layout from './components/Layout';
import ProductModal from './components/ProductModal';
import SignUpPage from './pages/SignUpPage';

const getCartKey = (item) => `${item.id}-${item.size || 'default'}-${item.color || 'default'}`;

const loadCart = () => {
  try {
    const saved = localStorage.getItem('matcha_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export default function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [cartItems, setCartItems] = useState(loadCart);
  const [toast, setToast] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#cart') return 'cart';
    if (hash === '#signup') return 'signup';
    return 'home';
  });

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('matcha_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  // Sync hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#cart') setCurrentPage('cart');
      else if (hash === '#signup') setCurrentPage('signup');
      else if (hash === '' || hash === '#brand-hero' || hash.startsWith('#')) {
        if (hash === '#cart' || hash === '#signup') return;
        setCurrentPage('home');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.8,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await api.checkHealth().catch(() => null);
        if (res) setHealthStatus(res);
      } catch (err) {
        console.error('API Error:', err);
      }
    }
    loadHealth();
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddToCart = (product) => {
    const amount = product.quantity || 1;
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
    const details = product.size && product.color ? ` (${product.size} / ${product.color})` : '';
    showToast(`Added ${product.name}${details} to bag! 🛍️`);
  };

  const handleUpdateQty = (key, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          getCartKey(item) === key
            ? { ...item, quantity: (item.quantity || 1) + delta }
            : item
        )
        .filter((item) => (item.quantity || 1) > 0)
    );
  };

  const handleRemoveItem = (key) => {
    setCartItems((prev) => prev.filter((item) => getCartKey(item) !== key));
    showToast('Removed item from cart 🗑️');
  };

  const handleCheckout = () => {
    const count = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCartItems([]);
    showToast(`Order placed! ${count} items on the way ✨`);
  };

  const handleOpenCart = () => {
    setCurrentPage('cart');
    window.location.hash = '#cart';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStore = () => {
    setCurrentPage('home');
    window.location.hash = '#brand-hero';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (href) => {
    if (href === '#cart') {
      handleOpenCart();
      return;
    }
    if (href === '#signup') {
      setCurrentPage('signup');
      window.location.hash = '#signup';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (currentPage !== 'home') {
      setCurrentPage('home');
    }
    window.location.hash = href;
    setTimeout(() => {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectFit = (fit) => {
    showToast(`Selected ${fit.category || fit.title}! 🎨`);
  };

  const handleClaimPromo = () => {
    showToast(`Claimed 15% discount for 2+ items! 🎉`);
  };

  const handleSubscribe = (email) => {
    showToast(`Subscribed ${email} to VIP Drop List! 📩`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D231E] font-sans selection:bg-[#2D5A27] selection:text-white relative">
      
      {/* Interactive Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce pointer-events-none">
          <div className="py-3 px-5 rounded-2xl bg-[#2D231E] text-[#FAF8F5] border border-[#3D312A] font-bold text-xs shadow-2xl flex items-center gap-2">
            <span className="text-[#BC5A36]">✨</span>
            {toast}
          </div>
        </div>
      )}

      {/* Product Customizer & Quick View Modal */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Main Experience: Direct Master Lookbook & Store Catalog */}
      <Layout 
        cartCount={cartItems.length}
        onOpenCart={handleOpenCart}
        onNavigate={handleNavigate}
        onGoToLanding={handleBackToStore}
      >
        {currentPage === 'cart' ? (
          <CartPage 
            cartItems={cartItems}
            onUpdateQty={handleUpdateQty}
            onRemove={handleRemoveItem}
            onBackToStore={handleBackToStore}
            onCheckout={handleCheckout}
          />
        ) : currentPage === 'signup' ? (
          <SignUpPage onBackToStore={handleBackToStore} />
        ) : (
          <HomePage 
            onSelectFit={handleSelectFit}
            onClaimPromo={handleClaimPromo}
            onAddToCart={handleAddToCart}
            onQuickView={(prod) => setSelectedProduct(prod)}
            onExploreWarehouse={() => showToast('Opening Warehouse Archive! 📦')}
            onSubscribe={handleSubscribe}
          />
        )}
      </Layout>

    </div>
  );
}
