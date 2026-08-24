import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollProgressTracker from './ScrollProgressTracker';

export default function Layout({ children, cartCount = 0, onOpenCart, onNavigate, onGoToLanding }) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D231E] flex flex-col font-sans selection:bg-[#2D5A27] selection:text-white relative">
      
      {/* Global Scroll Progress & Frame Tracker */}
      <ScrollProgressTracker />

      {/* Global Sticky Navigation Header */}
      <Navbar 
        cartCount={cartCount} 
        onOpenCart={onOpenCart} 
        onNavigate={onNavigate}
        onGoToLanding={onGoToLanding}
      />

      {/* Main Page Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Global Footer */}
      <Footer />

    </div>
  );
}
