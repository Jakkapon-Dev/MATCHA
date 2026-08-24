import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { api } from './services/api';

import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';

export default function App() {
  // Page Routing State: 'landing' (Default editorial entry) or 'store' (Full shopping catalog)
  const [currentPage, setCurrentPage] = useState('landing');

  const [healthStatus, setHealthStatus] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  // Scroll to top when changing pages
  const handleEnterStore = () => {
    setCurrentPage('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToLanding = () => {
    setCurrentPage('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === product.id && item.size === product.size);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: (updated[existingIdx].quantity || 1) + 1,
        };
        return updated;
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    setIsCartOpen(true);
    const details = product.size && product.color ? ` (${product.size} / ${product.color})` : '';
    showToast(`Added ${product.name}${details} to bag! 🛍️`);
  };

  const handleUpdateQuantity = (index, newQty) => {
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
    showToast('Removed item from bag 🗑️');
  };

  const handleSelectFit = (fit) => {
    showToast(`Selected ${fit.category || fit.title}! 🎨`);
  };

  const handleClaimPromo = () => {
    setIsCartOpen(true);
    showToast(`Use code MATCHA15 in your cart for 15% off! 🎉`);
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

      {/* Interactive Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => showToast('Order processed successfully! 🎉')}
      />

      {/* Conditional View: 1. Landing Lookbook Page vs 2. Main Store Catalog */}
      {currentPage === 'landing' ? (
        <LandingPage onEnterWebsite={handleEnterStore} />
      ) : (
        <Layout 
          cartCount={cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)}
          onOpenCart={() => setIsCartOpen(true)}
          onGoToLanding={handleGoToLanding}
        >
          <HomePage 
            onSelectFit={handleSelectFit}
            onClaimPromo={handleClaimPromo}
            onAddToCart={handleAddToCart}
            onQuickView={(prod) => setSelectedProduct(prod)}
            onExploreWarehouse={() => showToast('Opening Warehouse Archive! 📦')}
            onSubscribe={handleSubscribe}
          />
        </Layout>
      )}

    </div>
  );
}
