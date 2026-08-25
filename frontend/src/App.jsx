import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Lenis from 'lenis';
import { api } from './services/api';

import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CartPage from './pages/CartPage';
import SignUpPage from './pages/SignUpPage';
import Payment from './pages/Payment';
import Layout from './components/Layout';
import ProductModal from './components/ProductModal';

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
  const navigate = useNavigate();
  const location = useLocation();

  const [healthStatus, setHealthStatus] = useState(null);
  const [cartItems, setCartItems] = useState(loadCart);
  const [toast, setToast] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [catalogCategory, setCatalogCategory] = useState('ALL');

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('matcha_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  // Support legacy hash redirection (#catalog -> /catalog, #cart -> /cart, #signup -> /signup, #payment -> /payment)
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#catalog' && location.pathname !== '/catalog') {
      navigate('/catalog', { replace: true });
    } else if (hash === '#cart' && location.pathname !== '/cart') {
      navigate('/cart', { replace: true });
    } else if (hash === '#signup' && location.pathname !== '/signup') {
      navigate('/signup', { replace: true });
    } else if (hash === '#payment' && location.pathname !== '/payment') {
      navigate('/payment', { replace: true });
    }
  }, [location.pathname, navigate]);

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

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) {
      showToast('Your cart is empty! Add items first. 🛍️');
      return;
    }
    navigate('/payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCart = () => {
    navigate('/cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToHome = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (pathOrHash) => {
    if (pathOrHash === '/catalog' || pathOrHash === '#catalog') {
      navigate('/catalog');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (pathOrHash === '/cart' || pathOrHash === '#cart') {
      handleOpenCart();
      return;
    }
    if (pathOrHash === '/signup' || pathOrHash === '#signup') {
      navigate('/signup');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (pathOrHash === '/payment' || pathOrHash === '#payment') {
      handleProceedToPayment();
      return;
    }

    // Anchor hash links like #fit-guide or #street-favorites
    if (pathOrHash.startsWith('#')) {
      if (location.pathname !== '/') {
        navigate('/' + pathOrHash);
        setTimeout(() => {
          const el = document.querySelector(pathOrHash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        return;
      }
      const el = document.querySelector(pathOrHash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    navigate(pathOrHash);
  };

  const handleSelectFit = (fit) => {
    showToast(`Exploring ${fit.category || fit.title} in Catalog! 🎨`);
    const cat = fit.category || '';
    if (cat.toLowerCase().includes('tank') || cat.toLowerCase().includes('tee') || cat.toLowerCase().includes('sweat')) {
      setCatalogCategory('Tops');
    } else if (cat.toLowerCase().includes('denim') || cat.toLowerCase().includes('bottom') || cat.toLowerCase().includes('suit')) {
      setCatalogCategory('Bottoms');
    } else if (cat.toLowerCase().includes('outerwear')) {
      setCatalogCategory('Outerwear');
    } else {
      setCatalogCategory('ALL');
    }
    navigate('/catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClaimPromo = () => {
    showToast(`Claimed 15% discount code MATCHA15 applied at checkout! 🎉`);
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

      {/* Main Experience Layout */}
      <Layout
        cartCount={cartItems.length}
        currentPage={
          location.pathname === '/catalog' ? 'catalog' : 
          location.pathname === '/cart' ? 'cart' : 
          location.pathname === '/signup' ? 'signup' : 
          location.pathname === '/payment' ? 'payment' : 
          'home'
        }
        onOpenCart={handleOpenCart}
        onNavigate={handleNavigate}
        onGoToLanding={handleGoToHome}
      >
        <Routes>
          {/* 1. Home Page */}
          <Route
            path="/"
            element={
              <HomePage
                onSelectFit={handleSelectFit}
                onClaimPromo={handleClaimPromo}
                onAddToCart={handleAddToCart}
                onQuickView={(prod) => setSelectedProduct(prod)}
                onExploreWarehouse={() => {
                  navigate('/catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSubscribe={handleSubscribe}
              />
            }
          />

          {/* 2. Catalog Grid Page */}
          <Route
            path="/catalog"
            element={
              <CatalogPage
                initialCategory={catalogCategory}
                onBackToHome={handleGoToHome}
                onAddToCart={handleAddToCart}
                onQuickView={(prod) => setSelectedProduct(prod)}
                onSelectFit={handleSelectFit}
              />
            }
          />

          {/* 3. Shopping Cart Page */}
          <Route
            path="/cart"
            element={
              <CartPage
                cartItems={cartItems}
                onUpdateQty={handleUpdateQty}
                onRemove={handleRemoveItem}
                onBackToStore={handleGoToHome}
                onCheckout={handleProceedToPayment}
              />
            }
          />

          {/* 4. Payment / Checkout Page (From Pete) */}
          <Route 
            path="/payment" 
            element={
              <Payment 
                cartItems={cartItems}
                onUpdateCart={setCartItems}
              />
            } 
          />

          {/* 5. Sign Up Page */}
          <Route
            path="/signup" 
            element={<SignUpPage onBackToStore={handleGoToHome} />} 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

    </div>
  );
}
