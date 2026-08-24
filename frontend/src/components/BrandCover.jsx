import React from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

/**
 * BrandCover:
 * A dedicated 100vh fullscreen minimalist cover with the iconic giant dual-tone MATCHA branding.
 * Scrolling down leads smoothly into the Lookbook (BrandHero).
 */
export default function BrandCover({ onScrollDown }) {
  const handleScrollClick = () => {
    if (onScrollDown) {
      onScrollDown();
    } else {
      const el = document.getElementById('brand-hero');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen w-full bg-[#FAF8F5] text-[#2D231E] flex flex-col justify-between items-center py-10 sm:py-14 px-4 sm:px-8 select-none overflow-hidden border-b border-[#D9D3C7]/80">
      
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute w-96 h-96 sm:w-144 sm:h-144 bg-[#2D5A27]/6 rounded-full blur-[140px] pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 sm:w-144 sm:h-144 bg-[#BC5A36]/6 rounded-full blur-[140px] pointer-events-none -bottom-20 -right-20" />

      {/* 1. Top Minimalist Brand Badges */}
      <div className="z-10 w-full max-w-7xl mx-auto flex items-center justify-between font-mono text-xs text-[#6B5E55] uppercase tracking-widest pt-2">
        <span className="flex items-center gap-1.5 font-bold text-[#2D5A27]">
          <Sparkles size={12} className="text-[#BC5A36]" />
          <span>EST. 2026</span>
        </span>
        <span className="hidden sm:inline font-bold tracking-[0.25em] text-[#BC5A36]">
          ARTISAN APPAREL ARCHIVE
        </span>
        <span className="font-bold">
          TOKYO // PARIS
        </span>
      </div>

      {/* 2. Center: Giant, Impactful, Iconic MATCHA Display Typography */}
      <div className="z-10 w-full text-center my-auto flex flex-col items-center justify-center">
        <h1 className="text-8xl sm:text-[14rem] md:text-[18rem] lg:text-[22rem] xl:text-[26rem] font-black tracking-tighter uppercase leading-[0.8] inline-block whitespace-nowrap drop-shadow-sm font-sans cursor-default transition-transform hover:scale-[1.01] duration-500">
          <span className="text-[#2D5A27] transition-colors">MATCH</span>
          <span className="text-[#BC5A36] transition-colors">A</span>
        </h1>
        <p className="mt-4 sm:mt-6 text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-[#6B5E55] font-bold">
          HAUTE COUTURE // STREETWEAR ARCHIVE
        </p>
      </div>

      {/* 3. Bottom: Scroll to Explore Lookbook CTA */}
      <div className="z-10 flex flex-col items-center justify-center pb-2">
        <button
          onClick={handleScrollClick}
          className="flex flex-col items-center gap-2 text-xs font-mono font-bold tracking-[0.25em] text-[#2D231E] hover:text-[#BC5A36] uppercase transition-colors cursor-pointer group"
          title="Scroll down to Lookbook"
        >
          <span className="group-hover:tracking-[0.3em] transition-all">
            SCROLL TO EXPLORE LOOKBOOK
          </span>
          <div className="w-8 h-8 rounded-full border border-[#D9D3C7] group-hover:border-[#BC5A36] flex items-center justify-center bg-white shadow-xs transition-colors">
            <ChevronDown size={16} className="text-[#BC5A36] animate-bounce" />
          </div>
        </button>
      </div>

    </section>
  );
}
