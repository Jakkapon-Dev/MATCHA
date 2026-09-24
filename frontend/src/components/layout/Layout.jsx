import React from 'react';
import { useLocation } from 'react-router-dom';
import useChangeMotion from '../../hooks/useChangeMotion';
import useScrollReveal from '../../hooks/useScrollReveal';
import '../../styles/motion.css';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollProgressTracker from '../ui/ScrollProgressTracker';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function Layout({ 
  children, 
  cartCount = 0, 
  onOpenCart, 
  onNavigate, 
  onGoToLanding,
  currentPage = 'home',
  currentUser = null,
  onLogout
}) {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const pageMotionRef = useChangeMotion(pathname, 'route');
  const revealRef = useScrollReveal(pathname);
  // One <main> drives both: the route fade and the scroll reveals below it.
  const setMainRef = (node) => {
    pageMotionRef.current = node;
    revealRef.current = node;
  };
  return (
    <div className="min-h-screen bg-matcha-bg text-matcha-text flex flex-col font-sans selection:bg-matcha-text selection:text-white relative">
      
      {/* Skip to Main Content Link for Keyboard Accessibility (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0A0A0A] focus:text-white focus:font-mono focus:text-xs focus:font-bold focus:uppercase focus:tracking-wider focus:outline-2 focus:outline-offset-2 focus:outline-matcha-accent focus:shadow-xl"
      >
        {t('a11y.skipToContent')}
      </a>

      {/* Global Scroll Progress & Frame Tracker */}
      <ScrollProgressTracker />

      {/* Global Sticky Navigation Header */}
      <Navbar 
        cartCount={cartCount} 
        onOpenCart={onOpenCart} 
        onNavigate={onNavigate}
        onGoToLanding={onGoToLanding}
        currentPage={currentPage}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Main Page Content */}
      <main ref={setMainRef} id="main-content" tabIndex="-1" className="flex-1 w-full outline-none">
        {children}
      </main>

      {/* Global Footer */}
      <Footer />

    </div>
  );
}
