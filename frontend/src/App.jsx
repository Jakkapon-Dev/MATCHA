import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Lenis from 'lenis';
import { api } from './services/api';

import HomePage from './pages/HomePage';
import Layout from './components/Layout';
import ProductModal from './components/ProductModal';
import Payment from './pages/Payment';

export default function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [cartItems, setCartItems] = useState([]);
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
    showToast(`Selected ${fit.category || fit.title}! 🎨`);
  };

  const handleClaimPromo = () => {
    showToast(`Claimed 15% discount for 2+ items! 🎉`);
  };

  const handleSubscribe = (email) => {
    showToast(`Subscribed ${email} to VIP Drop List! 📩`);
  };

  const handleNavigateToPayment = () => {
    if (cartItems.length === 0) {
      showToast('Your cart is empty! Add some items first. 🛍️');
      return;
    }
    window.location.href = '/payment';
  };

  return (
    <BrowserRouter>
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

        <Routes>
          <Route 
            path="/" 
            element={
              <Layout 
                cartCount={cartItems.length}
                onOpenCart={handleNavigateToPayment}
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
            } 
          />
          <Route 
            path="/payment" 
            element={
              <Layout 
                cartCount={cartItems.length}
                onOpenCart={handleNavigateToPayment}
              >
                <Payment 
                  cartItems={cartItems}
                  onUpdateCart={setCartItems}
                />
              </Layout>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </div>
    </BrowserRouter>
  );
}
