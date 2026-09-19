import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { api } from './services/api';

// แต่ละหน้าโหลดตอนที่คนเดินไปถึงจริง ๆ ไม่ใช่ยกมาทั้งร้านตั้งแต่เปิดเว็บ
const HomePage = React.lazy(() => import('./pages/HomePage.jsx'));
const CatalogPage = React.lazy(() => import('./pages/CatalogPage.jsx'));
const CartPage = React.lazy(() => import('./pages/CartPage.jsx'));
/* One page serves both doors. The two routes stay because they are in the
   navbar, in the hash router and in links people already hold; they differ
   only in which mode opens. */
const AccessPage = React.lazy(() => import('./pages/AccessPage.jsx'));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage.jsx'));
const UserAccount = React.lazy(() => import('./pages/UserAccount.jsx'));
const GuestOrdersPage = React.lazy(() => import('./pages/GuestOrdersPage.jsx'));
const AdminPage = React.lazy(() => import('./pages/AdminPage.jsx'));
const PersonalColorPage = React.lazy(() => import('./pages/PersonalColorPage.jsx'));
const MixMatchStudioPage = React.lazy(() => import('./pages/MixMatchStudioPage.jsx'));
const EditorialLookbookPage = React.lazy(() => import('./pages/EditorialLookbookPage.jsx'));
const LegalPage = React.lazy(() => import('./pages/LegalPage.jsx'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage.jsx'));

import Layout from './components/layout/Layout';
import ProductModal from './components/product/ProductModal';
import RequireRole from './components/auth/RequireRole';
import RequireAuth from './components/auth/RequireAuth';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Context Providers and Hooks
import { ToastProvider, useToast } from './context/ToastContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CartProvider, useCart } from './context/CartContext.jsx';
import { StoreModeProvider } from './context/StoreModeContext.jsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext.jsx';

// ความสูงคงที่ระหว่างรอ chunk เพื่อไม่ให้หน้ากระตุกตอนหน้าใหม่มาถึง
function PageSkeleton() {
  return (
    <div className="w-full bg-[#F1F1F1] min-h-[70vh] px-5 sm:px-6 lg:px-8 py-16" aria-busy="true">
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="h-3 w-32 rounded-full bg-[#DCDCDC]" />
        <div className="mt-5 h-10 w-2/3 max-w-md rounded-lg bg-[#DCDCDC]" />
        <div className="mt-4 h-4 w-1/2 max-w-sm rounded-full bg-[#DCDCDC]" />
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-[#DCDCDC]" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* The tab title, per route and per language.

   The old map was a literal with mixed Thai and English values, so the tab
   never changed when the visitor switched language. It also keyed only on
   '/legal', while the route that actually renders is '/legal/:topic' — so
   every policy page fell back to the home title. Prefixes are matched longest
   first, which covers sub-routes without listing each one. */
const TITLE_KEYS = [
  ['/personal-color', 'titles.personalColor'],
  ['/mix-match', 'titles.mixMatch'],
  ['/lookbook', 'titles.lookbook'],
  ['/editorial', 'titles.lookbook'],
  ['/catalog', 'titles.catalog'],
  ['/payment', 'titles.payment'],
  ['/signup', 'titles.signup'],
  ['/account', 'titles.account'],
  ['/orders', 'titles.orders'],
  ['/admin', 'titles.admin'],
  ['/login', 'titles.login'],
  ['/legal', 'titles.legal'],
  ['/cart', 'titles.cart'],
];

function titleKeyFor(pathname) {
  if (pathname === '/') return 'titles.home';
  const hit = TITLE_KEYS.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'));
  return hit ? hit[1] : 'titles.notFound';
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // อัปเดต <title> ตามหน้าและภาษาที่เปิดอยู่
  useEffect(() => {
    document.title = t(titleKeyFor(location.pathname));
  }, [location.pathname, t]);

  // Context Hooks
  const { cartItems, setCartItems, addToCart, updateQty, removeItem, cartCount } = useCart();
  const { currentUser, login, logout } = useAuth();
  const { showToast } = useToast();

  // Local UI States
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

    let isRunning = true;
    let rafId;

    function raf(time) {
      if (!isRunning) return;
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      isRunning = false;
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Health check & backend warmup
  useEffect(() => {
    api.checkHealth().catch(() => null);
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
    // Fit cards carry their catalog target as data. Matching on the label would break
    // the moment the label is translated, so the label is never read here.
    setCatalogCategory(fit.catalogCategory || 'ALL');
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
        {/* หน้าเดียวพังไม่ควรลากทั้งแอปไปด้วย — key ทำให้ boundary รีเซ็ตเองเมื่อเปลี่ยนหน้า */}
        {/* resetKeys rather than key: keying by pathname threw away the whole
            subtree on every navigation — form state, scroll position and any
            in-flight work — to achieve something the boundary can now do by
            clearing its own error. */}
        <ErrorBoundary resetKeys={[location.pathname]}>
        <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* 1. Home Page */}
          <Route
            path="/"
            element={
              <HomePage
                onSelectFit={handleSelectFit}
                // `held` บอกว่าเก็บคูปองไว้ได้จริงไหม ถ้า storage ถูกปิด (โหมดส่วนตัว)
                // ต้องบอกให้ผู้ใช้กรอกเอง ไม่ใช่สัญญาว่าจะใส่ให้แล้วไม่เกิดอะไรขึ้น
                onClaimPromo={(held) => showToast(
                  held
                    ? 'รับส่วนลด 15% แล้ว — จะใส่ให้อัตโนมัติตอนชำระเงิน 🎉'
                    : 'คัดลอกโค้ด MATCHA15 แล้ว! กรอกในหน้าชำระเงินเพื่อรับส่วนลด 15%',
                  'success'
                )}
                onAddToCart={addToCart}
                onQuickView={(prod) => setSelectedProduct(prod)}
                onExploreCatalog={() => {
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
                onAddToCart={addToCart}
                onQuickView={(prod) => setSelectedProduct(prod)}
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

          {/* 5. High-Fashion Editorial Lookbook */}
          <Route
            path="/lookbook"
            element={<EditorialLookbookPage />}
          />
          <Route
            path="/editorial"
            element={<EditorialLookbookPage />}
          />

          {/* 6. Shopping Cart Page */}
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
            element={<PaymentPage />} 
          />

          {/* 5 & 6. Sign in and register, one page */}
          <Route path="/login" element={<AccessPage mode="signin" />} />
          <Route path="/signup" element={<AccessPage mode="register" />} />

          {/* Order history for whoever is asking. Open on purpose: without the
              browser's guest id the API returns an empty list, so there is
              nothing here to reach that the caller does not own. */}
          <Route path="/orders" element={<GuestOrdersPage />} />

          {/* 7. User Account Page (Member VIP Lounge) */}
          <Route
            path="/account"
            element={
              <RequireAuth>
                <UserAccount />
              </RequireAuth>
            }
          />

          {/* 8. Admin Control Center */}
          <Route
            path="/admin"
            element={
              <RequireRole role="Admin">
                <AdminPage />
              </RequireRole>
            }
          />

          {/* 9. Branded Legal and Policy Documentation */}
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/legal/:topic" element={<LegalPage />} />

          {/* 10. Branded 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </Layout>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <StoreModeProvider><AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider></StoreModeProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
