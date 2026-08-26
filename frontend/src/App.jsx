import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Lenis from 'lenis';
import { api } from './services/api';

import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CartPage from './pages/CartPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import Payment from './pages/Payment';
import UserAccount from './pages/UserAccount';
import AdminPage from './pages/AdminPage';
import PersonalColorPage from './pages/PersonalColorPage';
import MixMatchStudioPage from './pages/MixMatchStudioPage';
import Layout from './components/layout/Layout';
import ProductModal from './components/product/ProductModal';

// Context Providers and Hooks
import { ToastProvider, useToast, AuthProvider, useAuth, CartProvider, useCart } from './context';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Context Hooks
  const { cartItems, setCartItems, addToCart, updateQty, removeItem, cartCount } = useCart();
  const { currentUser, login, logout } = useAuth();
  const { showToast } = useToast();

  // Local UI States
  const [healthStatus, setHealthStatus] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [catalogCategory, setCatalogCategory] = useState('ALL');

  // Support legacy hash redirection (#catalog -> /catalog, #cart -> /cart, #signup -> /signup, etc.)
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#catalog' && location.pathname !== '/catalog') {
      navigate('/catalog', { replace: true });
    } else if (hash === '#cart' && location.pathname !== '/cart') {
      navigate('/cart', { replace: true });
    } else if (hash === '#signup' && location.pathname !== '/signup') {
      navigate('/signup', { replace: true });
    } else if (hash === '#login' && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    } else if (hash === '#payment' && location.pathname !== '/payment') {
      navigate('/payment', { replace: true });
    } else if (hash === '#account' && location.pathname !== '/account') {
      navigate('/account', { replace: true });
    } else if (hash === '#admin' && location.pathname !== '/admin') {
      navigate('/admin', { replace: true });
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

  // Health check
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

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) return;
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
    if (pathOrHash === '/login' || pathOrHash === '#login') {
      navigate('/login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (pathOrHash === '/payment' || pathOrHash === '#payment') {
      handleProceedToPayment();
      return;
    }
    if (pathOrHash === '/account' || pathOrHash === '#account') {
      navigate('/account');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (pathOrHash === '/admin' || pathOrHash === '#admin') {
      navigate('/admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleLogout = () => {
    logout();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D231E] font-sans selection:bg-[#2D5A27] selection:text-white relative">
      
      {/* Product Customizer & Quick View Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Main Experience Layout */}
      <Layout
        cartCount={cartCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        currentPage={
          location.pathname === '/catalog' ? 'catalog' : 
          location.pathname === '/cart' ? 'cart' : 
          location.pathname === '/signup' ? 'signup' : 
          location.pathname === '/login' ? 'login' : 
          location.pathname === '/payment' ? 'payment' : 
          location.pathname === '/account' ? 'account' : 
          location.pathname === '/admin' ? 'admin' : 
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
                onClaimPromo={() => showToast('Claimed 15% discount code MATCHA15! 🎉')}
                onAddToCart={addToCart}
                onQuickView={(prod) => setSelectedProduct(prod)}
                onExploreWarehouse={() => {
                  navigate('/catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSubscribe={(email) => showToast(`Subscribed ${email} to VIP Drop List! 📩`)}
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
                onAddToCart={addToCart}
                onQuickView={(prod) => setSelectedProduct(prod)}
                onSelectFit={handleSelectFit}
              />
            }
          />

          {/* 3. Personal Color Lab & Diagnostic Quiz */}
          <Route
            path="/personal-color"
            element={<PersonalColorPage />}
          />

          {/* 4. Interactive Mix & Match Fashion Studio */}
          <Route
            path="/mix-match"
            element={<MixMatchStudioPage />}
          />

          {/* 5. Shopping Cart Page */}
          <Route
            path="/cart"
            element={
              <CartPage
                cartItems={cartItems}
                onUpdateQty={updateQty}
                onRemove={removeItem}
                onBackToStore={handleGoToHome}
                onCheckout={handleProceedToPayment}
              />
            }
          />

          {/* 4. Payment / Checkout Page */}
          <Route 
            path="/payment" 
            element={
              <Payment 
                cartItems={cartItems}
                onUpdateCart={setCartItems}
              />
            } 
          />

          {/* 5. Login Page */}
          <Route 
            path="/login" 
            element={
              <LoginPage 
                onLoginSuccess={(user) => {
                  login(user);
                }} 
              />
            } 
          />

          {/* 6. Sign Up Page */}
          <Route 
            path="/signup" 
            element={<SignUpPage onBackToStore={handleGoToHome} />} 
          />

          {/* 7. User Account Page (Member VIP Lounge) */}
          <Route
            path="/account"
            element={
              <UserAccount
                cartCount={cartCount}
                onOpenCart={handleOpenCart}
                onNavigate={handleNavigate}
                onGoToLanding={handleGoToHome}
                user={currentUser}
                onAddToCart={addToCart}
                onLogout={logout}
              />
            }
          />

          {/* 8. Admin Control Center */}
          <Route
            path="/admin"
            element={<AdminPage />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
