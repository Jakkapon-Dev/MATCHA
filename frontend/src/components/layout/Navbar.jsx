import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Menu,
  X,
  User,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Loader2
} from 'lucide-react';
import { BorderBeam } from '../ui/BorderBeam';

export default function Navbar({
  cartCount = 0,
  currentUser = null,
  onLogout = () => { },
  currentPage = 'home',
  onOpenCart = () => { },
  onNavigate = () => { },
  onGoToLanding = () => { }
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartAnimated, setCartAnimated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Trigger bouncy pop animation on cart icon when items are added
  useEffect(() => {
    if (cartCount > 0) {
      setCartAnimated(true);
      const timer = setTimeout(() => setCartAnimated(false), 650);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const navLinks = [
    { label: 'Catalog', href: '/catalog' },
    { label: 'Color Lab ✨', href: '/personal-color' },
    { label: 'Mix & Match', href: '/mix-match' },
    { label: 'Lookbook 📸', href: '/lookbook' },
    { label: 'VIP Access', href: '#vip-drop' },
  ];

  const handleLinkClick = (href) => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(href);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogoutClick = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      onLogout();
      setIsLoggingOut(false);
    }, 400);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FAF8F5]/90 border-b border-[#D9D3C7] transition-all">

        {/* 1. Top Announcement Bar */}
        <div className="bg-[#2D231E] text-[#D0DEC6] text-[11px] py-1.5 px-4 text-center font-mono flex items-center justify-center gap-2">
          <span className="text-[#BC5A36]">✦</span>
          <span>FREE EXPRESS SHIPPING ON ORDERS OVER $100</span>
          <span className="text-[#BC5A36] hidden sm:inline">✦</span>
          <span className="hidden sm:inline text-white/70">ECO TEA-DYE CAPSULE NOW LIVE</span>
        </div>

        {/* 2. Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

          {/* Left: Brand Logo & Wordmark */}
          <div className="flex items-center gap-6">
            <button
              onClick={onGoToLanding}
              className="flex items-center gap-2.5 group cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#2D5A27] text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 group-hover:bg-[#23471E] transition-all">
                🍵
              </div>
              <div>
                <span className="font-extrabold text-xl sm:text-2xl tracking-tighter text-[#2D231E] uppercase font-sans block">
                  MatchA
                </span>
                <span className="block text-[9px] font-mono tracking-widest text-[#6B5E55] uppercase -mt-1">
                  Artisan Color Archive
                </span>
              </div>
            </button>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              const isActive = currentPage === 'home' && false;

              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleLinkClick(link.href); }}
                  className={`text-xs font-semibold tracking-wider uppercase font-mono transition-colors relative py-1 ${
                    isActive ? 'text-[#2D5A27] font-bold' : 'text-[#2D231E] hover:text-[#2D5A27]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5A27] rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right: MIX@MATCH, Cart & Far Right Auth Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">

            {/* Main Feature Action: MIX@MATCH Button with Border Beam */}
            <button
              onClick={() => handleLinkClick('/mix-match')}
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
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 min-w-4.5 text-center bg-[#BC5A36] text-white text-[10px] font-mono font-bold rounded-full shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="hidden lg:block h-6 w-px bg-[#D9D3C7] mx-1" />

            {/* Far Right: Desktop Auth Buttons or User Avatar */}
            {currentUser ? (
              <div className="hidden lg:flex items-center gap-2 font-mono">
                <button
                  onClick={() => handleLinkClick(currentUser.role === 'Admin' ? '/admin' : '/account')}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#D0DEC6]/50 hover:bg-[#D0DEC6] border border-[#2D5A27]/30 hover:border-[#2D5A27] rounded-xl text-xs font-bold text-[#2D5A27] transition-all cursor-pointer shadow-2xs group"
                  title={currentUser.role === 'Admin' ? 'Open Admin Command Center' : 'Go to My Account'}
                >
                  <User size={14} className="text-[#2D5A27]" />
                  <span className="font-mono text-xs font-bold tracking-wide uppercase">
                    {currentUser.role === 'Admin' ? '👑 Admin Dashboard' : 'My Account'}
                  </span>
                </button>

                <button
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#BC5A36] hover:bg-[#BC5A36]/10 rounded-lg transition-all cursor-pointer disabled:opacity-70 font-mono"
                  title="Sign out of MatchA"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-[#BC5A36]" />
                      <span>EXITING...</span>
                    </>
                  ) : (
                    <span>LOG OUT</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-1.5 font-mono">
                <button
                  onClick={() => handleLinkClick('/login')}
                  className="px-3 py-1.5 text-xs font-bold text-[#2D231E] hover:text-[#2D5A27] hover:bg-[#D0DEC6]/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <User size={13} />
                  <span>LOG IN</span>
                </button>
                <span className="text-[#D9D3C7]">/</span>
                <button
                  onClick={() => handleLinkClick('/signup')}
                  className="px-3 py-1.5 text-xs font-bold text-[#BC5A36] hover:text-[#9E4423] hover:bg-[#BC5A36]/10 rounded-lg transition-colors cursor-pointer"
                >
                  SIGN UP
                </button>
              </div>
            )}

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
              {currentUser ? (
                <div className="flex items-center justify-between pb-3 border-b border-[#D9D3C7]">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLinkClick(currentUser.role === 'Admin' ? '/admin' : '/account');
                    }}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2D5A27] text-white flex items-center justify-center text-xs font-bold font-mono group-hover:scale-105 transition-transform">
                      {currentUser.name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold text-[#2D231E] group-hover:text-[#2D5A27]">{currentUser.name}</p>
                      <p className="text-[10px] font-mono text-[#6B5E55]">{currentUser.role === 'Admin' ? '👑 Admin Command Center' : '👤 My Account'}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogoutClick();
                    }}
                    disabled={isLoggingOut}
                    className="text-xs font-mono font-bold text-[#BC5A36] hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-60"
                  >
                    {isLoggingOut && <Loader2 size={11} className="animate-spin" />}
                    <span>{isLoggingOut ? 'Exiting...' : 'Log Out'}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#D9D3C7]">
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLinkClick('/login'); }}
                    className="py-2 px-3 bg-white border border-[#D9D3C7] rounded-xl text-xs font-mono font-bold text-[#2D231E] hover:border-[#2D5A27] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <User size={13} />
                    <span>LOG IN</span>
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLinkClick('/signup'); }}
                    className="py-2 px-3 bg-[#BC5A36] text-white rounded-xl text-xs font-mono font-bold hover:bg-[#9E4423] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>SIGN UP</span>
                  </button>
                </div>
              )}

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
            </nav>
          </div>
        )}

      </header>
    </>
  );
}
