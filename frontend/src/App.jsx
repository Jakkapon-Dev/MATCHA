import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { api } from './services/api';

import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import Layout from './components/Layout';
import ProductModal from './components/ProductModal';

export default function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [toast, setToast] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Page Routing State ('home' | 'catalog')
  const [currentPage, setCurrentPage] = useState(() => {
    return window.location.hash === '#catalog' ? 'catalog' : 'home';
  });
  const [catalogCategory, setCatalogCategory] = useState('ALL');

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

  // Sync hash changes with page state
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#catalog') {
        setCurrentPage('catalog');
      } else if (window.location.hash === '#brand-hero' || window.location.hash === '') {
        setCurrentPage('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
    setCartItems((prev) => [...prev, product]);
    const details = product.size && product.color ? ` (${product.size} / ${product.color})` : '';
    showToast(`Added ${product.name}${details} to bag! 🛍️`);
  };

  const handleSelectFit = (fit) => {
    showToast(`Exploring ${fit.category || fit.title} in Catalog! 🎨`);
    // Map fit category to Catalog category filter
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
    setCurrentPage('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.location.hash = '#catalog';
  };

  const handleClaimPromo = () => {
    showToast(`Claimed 15% discount code MATCHA15 applied at checkout! 🎉`);
  };

  const handleSubscribe = (email) => {
    showToast(`Subscribed ${email} to VIP Drop List! 📩`);
  };

  const handleNavigate = (href) => {
    if (href === '#catalog') {
      setCurrentPage('catalog');
      window.location.hash = '#catalog';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentPage !== 'home') {
      setCurrentPage('home');
      window.location.hash = href;
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGoToHome = () => {
    setCurrentPage('home');
    window.location.hash = '#brand-hero';
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        currentPage={currentPage}
        onOpenCart={() => showToast(`Cart contains ${cartItems.length} items! 🛍️`)}
        onNavigate={handleNavigate}
        onGoToLanding={handleGoToHome}
      >
        {currentPage === 'catalog' ? (
          <CatalogPage 
            initialCategory={catalogCategory}
            onBackToHome={handleGoToHome}
            onAddToCart={handleAddToCart}
            onQuickView={(prod) => setSelectedProduct(prod)}
            onSelectFit={handleSelectFit}
          />
        ) : (
          <HomePage 
            onSelectFit={handleSelectFit}
            onClaimPromo={handleClaimPromo}
            onAddToCart={handleAddToCart}
            onQuickView={(prod) => setSelectedProduct(prod)}
            onExploreWarehouse={() => {
              setCurrentPage('catalog');
              window.location.hash = '#catalog';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSubscribe={handleSubscribe}
          />
        )}
      </Layout>

    </div>
  );
}
