import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Menu,
  X,
  User,
  Loader2
} from 'lucide-react';
import { BorderBeam } from '../ui/BorderBeam';
import LanguageToggle from '../ui/LanguageToggle';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function Navbar({
  cartCount = 0,
  currentUser = null,
  onLogout = () => { },
  currentPage = 'home',
  onOpenCart = () => { },
  onNavigate = () => { },
  onGoToLanding = () => { }
}) {
  const { t } = useLanguage();
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
    { id: 'colorLab', href: '/personal-color' },
    { id: 'catalog', href: '/catalog' },
    { id: 'lookbook', href: '/lookbook' },
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
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#F1F1F1]/95 border-b border-[#DCDCDC] transition-all">

        {/* Persistent Demo Session Warning Banner */}
        {currentUser?.isDemoSession && (
          <div className="bg-[#518F5C] text-[#042509] text-[11px] py-1.5 px-4 font-mono font-bold flex items-center justify-between gap-2 shadow-inner border-b border-[#042509]/20">
            <div className="flex items-center gap-2 mx-auto sm:mx-0">
              <span className="text-sm">🧪</span>
              <span>{t('nav.demoBanner')}</span>
            </div>
            <button
              type="button"
              onClick={handleLogoutClick}
              className="underline hover:text-black shrink-0 text-[10px] uppercase tracking-wider bg-white/40 hover:bg-white/60 px-2 py-0.5 rounded cursor-pointer transition-all"
            >
              {t('nav.demoExit')}
            </button>
          </div>
        )}

        {/* 1. Top Announcement Bar - Sleek Monochrome with Red Sparkle */}
        <div className="bg-[#000000] text-[#F1F1F1] text-[11px] py-1.5 px-4 text-center font-mono flex items-center justify-center gap-2">
          <span className="text-[#C91D1D]">✦</span>
          <span>{t('nav.shippingPromo')}</span>
          <span className="text-[#C91D1D] hidden sm:inline">✦</span>
          <span className="hidden sm:inline text-[#F1F1F1]/70">{t('nav.capsulePromo')}</span>
        </div>

        {/* 2. Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

          {/* Left: Brand Wordmark (Sleek Standalone High-Fashion Identity) */}
          <div className="flex items-center">
            <button
              onClick={onGoToLanding}
              className="flex flex-col justify-center group cursor-pointer text-left py-1"
              aria-label={t('nav.homeAria')}
            >
              <img 
                src="/images/brand/matcha-logo-primary.png" 
                alt="MatchA" 
                className="h-8 sm:h-9 w-auto object-contain object-left group-hover:scale-[1.02] transition-transform duration-200" 
              />
              <span className="block text-[9px] font-mono tracking-[0.22em] text-[#666666] uppercase mt-0.5 group-hover:text-[#000000] transition-colors">
                {t('nav.tagline')}
              </span>
            </button>
          </div>

          {/* Center: Desktop Navigation Links (Clean Black & White) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              const isActive = currentPage === 'home' && false;

              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleLinkClick(link.href); }}
                  className={`text-xs font-semibold tracking-wider uppercase font-mono transition-colors relative py-1 ${
                    isActive ? 'text-[#000000] font-bold' : 'text-[#000000]/80 hover:text-[#000000]'
                  }`}
                >
                  {t(`nav.links.${link.id}`)}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#000000] rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right: MIX@MATCH, Cart & Far Right Auth Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">

            {/* Main Feature Action: MIX@MATCH Button (Black with subtle Green/Red BorderBeam) */}
            <button
              onClick={() => handleLinkClick('/mix-match')}
              className="relative overflow-hidden hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#000000] hover:bg-[#1a1a1a] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <BorderBeam size={80} duration={6} colorFrom="#518F5C" colorTo="#C91D1D" />
              <Sparkles size={14} className="text-[#518F5C] relative z-10" />
              <span className="relative z-10">MIX@MATCH</span>
            </button>

            {/* Cart Trigger Button (Black & White with Red Count Badge) */}
            <button
              onClick={onOpenCart}
              aria-label={t('nav.cartAria')}
              data-cart-target
              className={`relative p-2.5 rounded-xl bg-white hover:bg-[#F1F1F1] text-[#000000] border border-[#DCDCDC] transition-all cursor-pointer shadow-xs ${
                cartAnimated ? 'animate-cart-pop ring-3 ring-[#C91D1D]' : ''
              }`}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 min-w-4.5 text-center bg-[#C91D1D] text-white text-[10px] font-mono font-bold rounded-full shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="hidden lg:block h-6 w-px bg-[#DCDCDC] mx-1" />

            {/* Far Right: Desktop Auth Buttons or User Avatar */}
            {currentUser ? (
              <div className="hidden lg:flex items-center gap-2 font-mono">
                <button
                  onClick={() => handleLinkClick(currentUser.role === 'Admin' ? '/admin' : '/account')}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#F1F1F1] border border-[#000000]/20 hover:border-[#000000] rounded-xl text-xs font-bold text-[#000000] transition-all cursor-pointer shadow-xs group"
                  title={currentUser.role === 'Admin' ? t('nav.adminTitle') : t('nav.myAccountTitle')}
                >
                  <User size={14} className="text-[#000000]" />
                  <span className="font-mono text-xs font-bold tracking-wide uppercase">
                    {currentUser.role === 'Admin' ? t('nav.adminDashboard') : t('nav.myAccount')}
                  </span>
                </button>

                <button
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#C91D1D] hover:bg-[#C91D1D]/10 rounded-lg transition-all cursor-pointer disabled:opacity-70 font-mono"
                  title={t('nav.logOutTitle')}
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-[#C91D1D]" />
                      <span>{t('nav.exiting')}</span>
                    </>
                  ) : (
                    <span>{t('nav.logOut')}</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-1.5 font-mono">
                <button
                  onClick={() => handleLinkClick('/login')}
                  className="px-3 py-1.5 text-xs font-bold text-[#000000] hover:bg-black/5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <User size={13} />
                  <span>{t('nav.logIn')}</span>
                </button>
                <span className="text-[#DCDCDC]">/</span>
                <button
                  onClick={() => handleLinkClick('/signup')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-[#000000] text-white hover:bg-black/80 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  {t('nav.signUp')}
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-white text-[#000000] border border-[#DCDCDC] transition-all cursor-pointer"
              aria-label={t('nav.menuAria')}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Far right: EN / TH switch, last tile in the row */}
            <LanguageToggle />

          </div>

        </div>

        {/* 3. Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#F1F1F1] border-b border-[#DCDCDC] px-6 py-5 shadow-xl animate-fade-in">
            <nav className="flex flex-col gap-4">

              {/* Mobile Auth Quick Buttons */}
              {currentUser ? (
                <div className="flex items-center justify-between pb-3 border-b border-[#DCDCDC]">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLinkClick(currentUser.role === 'Admin' ? '/admin' : '/account');
                    }}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#000000] text-white flex items-center justify-center text-xs font-bold font-mono group-hover:scale-105 transition-transform">
                      {currentUser.name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold text-[#000000]">{currentUser.name}</p>
                      <p className="text-[10px] font-mono text-[#666666]">{currentUser.role === 'Admin' ? t('nav.adminCenter') : t('nav.myAccountMobile')}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogoutClick();
                    }}
                    disabled={isLoggingOut}
                    className="text-xs font-mono font-bold text-[#C91D1D] hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-60"
                  >
                    {isLoggingOut && <Loader2 size={11} className="animate-spin" />}
                    <span>{isLoggingOut ? t('nav.exitingMobile') : t('nav.logOutMobile')}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#DCDCDC]">
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLinkClick('/login'); }}
                    className="py-2 px-3 bg-white border border-[#DCDCDC] rounded-xl text-xs font-mono font-bold text-[#000000] hover:border-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <User size={13} />
                    <span>{t('nav.logIn')}</span>
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLinkClick('/signup'); }}
                    className="py-2 px-3 bg-[#000000] text-white rounded-xl text-xs font-mono font-bold hover:bg-black/80 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>{t('nav.signUp')}</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => { setMobileMenuOpen(false); onGoToLanding(); }}
                className="text-left text-sm font-semibold text-[#000000] py-1 border-b border-[#DCDCDC]"
              >
                <span className="text-[#C91D1D] mr-1">✦</span> {t('nav.returnToLanding')}
              </button>

              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleLinkClick(link.href); }}
                  className="text-sm font-semibold text-[#000000]/80 hover:text-[#000000] py-1 border-b border-[#DCDCDC]"
                >
                  {t(`nav.links.${link.id}`)}
                </a>
              ))}
            </nav>
          </div>
        )}

      </header>
    </>
  );
}
