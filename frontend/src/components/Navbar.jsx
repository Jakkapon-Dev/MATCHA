import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, Sparkles, User, LogIn } from 'lucide-react';
import AuthModal from './AuthModal';
import BorderBeam from './BorderBeam';

export default function Navbar({ cartCount = 0, onOpenCart, onNavigate, onGoToLanding }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [cartAnimated, setCartAnimated] = useState(false);

  // Trigger bouncy pop animation on cart icon when items are added
  useEffect(() => {
    if (cartCount > 0) {
      setCartAnimated(true);
      const timer = setTimeout(() => setCartAnimated(false), 650);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const navLinks = [
    { label: 'Fit Guide', href: '#fit-guide' },
    { label: 'Favorites', href: '#street-favorites' },
    { label: 'Cinematic', href: '#cinematic-reel' },
    { label: 'Perks', href: '#pulse-perks' },
    { label: 'VIP Pass', href: '#vip-drop' },
  ];

  const handleOpenAuth = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleLinkClick = (href) => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(href);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FAF8F5]/90 border-b border-[#D9D3C7] transition-all">
        
        {/* 1. Top Announcement Bar */}
        <div className="bg-[#2D231E] text-[#D0DEC6] text-[11px] py-1.5 px-4 text-center font-mono flex items-center justify-center gap-2">
          <span className="text-[#BC5A36]">✦</span>
          <span>FREE EXPRESS SHIPPING ON ORDERS OVER $100</span>
          <span className="hidden sm:inline">| USE CODE: <strong>MATCHA15</strong> FOR 15% OFF</span>
          <span className="text-[#BC5A36]">✦</span>
        </div>

        {/* 2. Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Left: Brand Logo (Scroll to Top) */}
          <button 
            onClick={() => handleLinkClick('#brand-hero')}
            className="flex items-center gap-2.5 group cursor-pointer text-left"
            title="Scroll to Top"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2D5A27] flex items-center justify-center text-white text-xl shadow-md group-hover:scale-105 transition-transform">
              🍵
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#2D5A27] uppercase">
                MatchA
              </span>
              <span className="hidden sm:block text-[9px] font-mono tracking-widest text-[#6B5E55] -mt-1">
                ARTISAN APPAREL
              </span>
            </div>
          </button>

          {/* Center: Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => { e.preventDefault(); handleLinkClick(link.href); }}
                className="text-xs font-semibold text-[#2D231E] hover:text-[#2D5A27] transition-colors tracking-wider uppercase font-mono"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right: MIX@MATCH, Cart & Far Right Auth Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Main Feature Action: MIX@MATCH Button with Border Beam */}
            <button
              onClick={() => handleLinkClick('#fit-guide')}
              className="relative overflow-hidden hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-[#2D5A27]/25 transition-all active:scale-95 cursor-pointer"
            >
              <BorderBeam size={80} duration={6} colorFrom="#D0DEC6" colorTo="#BC5A36" />
              <Sparkles size={14} className="text-[#D0DEC6] relative z-10" />
              <span className="relative z-10">MIX@MATCH</span>
            </button>

            {/* Cart Trigger Button */}
            <button
              onClick={onOpenCart}
              aria-label="View Cart"
              className={`relative p-2.5 rounded-xl bg-[#D0DEC6]/60 hover:bg-[#D0DEC6] text-[#2D231E] hover:text-[#2D5A27] border border-[#B8CBAE] transition-all cursor-pointer ${
                cartAnimated ? 'animate-cart-pop ring-3 ring-[#BC5A36] bg-[#D0DEC6]' : ''
              }`}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 min-w-[18px] text-center bg-[#BC5A36] text-white text-[10px] font-mono font-bold rounded-full shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="hidden lg:block h-6 w-px bg-[#D9D3C7] mx-1" />

            {/* Far Right: Desktop Auth Buttons (LOG IN / SIGN UP) */}
            <div className="hidden lg:flex items-center gap-1.5 font-mono">
              <button
                onClick={() => handleOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-bold text-[#2D231E] hover:text-[#2D5A27] hover:bg-[#D0DEC6]/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <User size={13} />
                <span>LOG IN</span>
              </button>
              <span className="text-[#D9D3C7]">/</span>
              <button
                onClick={() => handleOpenAuth('signup')}
                className="px-3 py-1.5 text-xs font-bold text-[#BC5A36] hover:text-[#9E4423] hover:bg-[#BC5A36]/10 rounded-lg transition-colors cursor-pointer"
              >
                SIGN UP
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-[#FAF8F5] text-[#2D231E] hover:text-[#2D5A27] border border-[#D9D3C7] transition-all cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>

        </div>

        {/* 3. Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FAF8F5] border-b border-[#D9D3C7] px-6 py-5 shadow-xl animate-fade-in">
            <nav className="flex flex-col gap-4">
              
              {/* Mobile Auth Quick Buttons */}
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#D9D3C7]">
                <button
                  onClick={() => handleOpenAuth('login')}
                  className="py-2 px-3 bg-white border border-[#D9D3C7] rounded-xl text-xs font-mono font-bold text-[#2D231E] hover:border-[#2D5A27] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <User size={13} />
                  <span>LOG IN</span>
                </button>
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="py-2 px-3 bg-[#BC5A36] text-white rounded-xl text-xs font-mono font-bold hover:bg-[#9E4423] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>SIGN UP</span>
                </button>
              </div>

              <button
                onClick={() => { setMobileMenuOpen(false); onGoToLanding(); }}
                className="text-left text-sm font-semibold text-[#BC5A36] py-1 border-b border-[#D9D3C7]/50"
              >
                ✦ RETURN TO LANDING LOOKBOOK
              </button>
              
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleLinkClick(link.href); }}
                  className="text-sm font-semibold text-[#2D231E] hover:text-[#2D5A27] py-1 border-b border-[#D9D3C7]/50"
                >
                  {link.label}
                </a>
              ))}
              
              <button
                onClick={() => handleLinkClick('#fit-guide')}
                className="mt-2 w-full py-2.5 bg-[#2D5A27] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Sparkles size={14} />
                <span>MIX@MATCH FIT FINDER</span>
              </button>

            </nav>
          </div>
        )}

      </header>

      {/* Member Login & Sign Up Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
