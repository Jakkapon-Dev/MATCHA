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
import { handleImageError, webpSrc } from '../../utils/imageFallback';

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
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-matcha-bg/95 border-b border-matcha-border transition-all">

        {/* Persistent Demo Session Warning Banner */}
        {currentUser?.isDemoSession && (
          <div className="bg-matcha-secondary text-matcha-primary text-[11px] py-1.5 px-4 font-mono font-bold flex items-center justify-between gap-2 shadow-inner border-b border-matcha-primary/20">
            <div className="flex items-center gap-2 mx-auto sm:mx-0">
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
        <div className="bg-matcha-text text-matcha-bg text-[11px] py-1.5 px-4 text-center font-mono flex items-center justify-center gap-2">
          <span className="text-matcha-accent">✦</span>
          <span>{t('nav.shippingPromo')}</span>
          <span className="text-matcha-accent hidden sm:inline">✦</span>
          <span className="hidden sm:inline text-matcha-bg/70">{t('nav.capsulePromo')}</span>
        </div>

        {/* 2. Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

          {/* Left: Brand Wordmark (Sleek Standalone High-Fashion Identity) */}
          <div className="flex items-center">
            <button
              onClick={onGoToLanding}
              className="flex flex-col justify-center group cursor-pointer text-left py-1 outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A] rounded-lg"
              aria-label={t('nav.homeAria')}
            >
              <img 
                src={webpSrc('/images/brand/matcha-logo-primary.png')} data-original-src="/images/brand/matcha-logo-primary.png"
                onError={handleImageError}
                alt="MatchA" 
                className="h-8 sm:h-9 w-auto object-contain object-left group-hover:scale-[1.02] transition-transform duration-200" 
              />
              <span className="block text-[9px] font-mono tracking-[0.22em] text-matcha-muted uppercase mt-0.5 group-hover:text-matcha-text transition-colors">
                {t('nav.tagline')}
              </span>
            </button>
          </div>

          {/* Center: Desktop Navigation Links (Clean Black & White) */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              const isActive = currentPage === 'home' && false;

              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleLinkClick(link.href); }}
                  className={`text-xs font-semibold tracking-wider uppercase font-mono transition-colors relative py-1 outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A] rounded-xs ${
                    isActive ? 'text-matcha-text font-bold' : 'text-matcha-text/80 hover:text-matcha-text'
                  }`}
                >
                  {t(`nav.links.${link.id}`)}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-matcha-text rounded-full" />
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
              className="relative overflow-hidden hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-matcha-text hover:bg-[#1a1a1a] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A]"
            >
              <BorderBeam size={80} duration={6} colorFrom="#518F5C" colorTo="#C91D1D" />
              <Sparkles size={14} className="text-matcha-secondary relative z-10" />
              <span className="relative z-10">MIX@MATCH</span>
            </button>

            {/* Cart Trigger Button (Black & White with Red Count Badge) */}
            <button
              onClick={onOpenCart}
              aria-label={t('nav.cartAria')}
              data-cart-target
              className={`relative p-2.5 rounded-xl bg-white hover:bg-matcha-bg text-matcha-text border border-matcha-border transition-all cursor-pointer shadow-xs outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A] ${
                cartAnimated ? 'animate-cart-pop ring-3 ring-matcha-accent' : ''
              }`}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 min-w-4.5 text-center bg-matcha-accent text-white text-[10px] font-mono font-bold rounded-full shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="hidden lg:block h-6 w-px bg-matcha-border mx-1" />

            {/* Far Right: Desktop Auth Buttons or User Avatar */}
            {currentUser ? (
              <div className="hidden lg:flex items-center gap-2 font-mono">
                <button
                  onClick={() => handleLinkClick(currentUser.role === 'Admin' ? '/admin' : '/account')}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-matcha-bg border border-matcha-text/20 hover:border-matcha-text rounded-xl text-xs font-bold text-matcha-text transition-all cursor-pointer shadow-xs group outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A]"
                  title={currentUser.role === 'Admin' ? t('nav.adminTitle') : t('nav.myAccountTitle')}
                >
                  <User size={14} className="text-matcha-text" />
                  <span className="font-mono text-xs font-bold tracking-wide uppercase">
                    {currentUser.role === 'Admin' ? t('nav.adminDashboard') : t('nav.myAccount')}
                  </span>
                </button>

                <button
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-matcha-accent hover:bg-matcha-accent/10 rounded-lg transition-all cursor-pointer disabled:opacity-70 font-mono outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-matcha-accent"
                  title={t('nav.logOutTitle')}
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-matcha-accent" />
                      <span>{t('nav.exiting')}</span>
                    </>
                  ) : (
                    <span>{t('nav.logOut')}</span>
                  )}
                </button>
              </div>
            ) : (
              /* Signing in and registering are one page now, so the header
                 offers one door rather than two buttons to the same room. */
              <div className="hidden lg:flex items-center font-mono">
                <button
                  onClick={() => handleLinkClick('/login')}
                  className="px-4 py-2 text-xs font-bold bg-[#0A0A0A] text-matcha-bg hover:bg-matcha-accent transition-colors cursor-pointer flex items-center gap-1.5 outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A]"
                >
                  <User size={13} aria-hidden="true" />
                  <span>{t('nav.access')}</span>
                </button>
              </div>
            )}

            {/* At tablet widths the primary navigation is still visible, but
                the full desktop account control is intentionally hidden to
                keep the bar from wrapping. Before this compact control was
                added, the only sign-in door disappeared completely between
                the md and lg breakpoints. */}
            <div className="hidden md:flex lg:hidden items-center">
              <button
                type="button"
                onClick={() => handleLinkClick(currentUser ? (currentUser.role === 'Admin' ? '/admin' : '/account') : '/login')}
                className="p-2.5 rounded-xl bg-white hover:bg-matcha-bg text-matcha-text border border-matcha-border transition-all cursor-pointer shadow-xs outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A]"
                aria-label={currentUser
                  ? (currentUser.role === 'Admin' ? t('nav.adminTitle') : t('nav.myAccountTitle'))
                  : t('nav.access')}
                title={currentUser
                  ? (currentUser.role === 'Admin' ? t('nav.adminTitle') : t('nav.myAccountTitle'))
                  : t('nav.access')}
              >
                <User size={17} aria-hidden="true" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-white text-matcha-text border border-matcha-border transition-all cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A]"
              aria-label={t('nav.menuAria')}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Far right: EN / TH switch, last tile in the row */}
            <LanguageToggle />

          </div>

        </div>

        {/* 3. Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div id="mobile-nav" className="md:hidden bg-matcha-bg border-b border-matcha-border px-6 py-5 shadow-xl animate-fade-in">
            <nav aria-label="Mobile Navigation" className="flex flex-col gap-4">

              {/* Mobile Auth Quick Buttons */}
              {currentUser ? (
                <div className="flex items-center justify-between pb-3 border-b border-matcha-border">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLinkClick(currentUser.role === 'Admin' ? '/admin' : '/account');
                    }}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-matcha-text text-white flex items-center justify-center text-xs font-bold font-mono group-hover:scale-105 transition-transform">
                      {currentUser.name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold text-matcha-text">{currentUser.name}</p>
                      <p className="text-[10px] font-mono text-matcha-muted">{currentUser.role === 'Admin' ? t('nav.adminCenter') : t('nav.myAccountMobile')}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogoutClick();
                    }}
                    disabled={isLoggingOut}
                    className="text-xs font-mono font-bold text-matcha-accent hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-60"
                  >
                    {isLoggingOut && <Loader2 size={11} className="animate-spin" />}
                    <span>{isLoggingOut ? t('nav.exitingMobile') : t('nav.logOutMobile')}</span>
                  </button>
                </div>
              ) : (
                <div className="pb-3 border-b border-matcha-border">
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLinkClick('/login'); }}
                    className="w-full py-2.5 px-3 bg-[#0A0A0A] text-matcha-bg text-xs font-mono font-bold hover:bg-matcha-accent transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <User size={13} aria-hidden="true" />
                    <span>{t('nav.access')}</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => { setMobileMenuOpen(false); onGoToLanding(); }}
                className="text-left text-sm font-semibold text-matcha-text py-1 border-b border-matcha-border"
              >
                <span className="text-matcha-accent mr-1">✦</span> {t('nav.returnToLanding')}
              </button>

              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleLinkClick(link.href); }}
                  className="text-sm font-semibold text-matcha-text/80 hover:text-matcha-text py-1 border-b border-matcha-border"
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
