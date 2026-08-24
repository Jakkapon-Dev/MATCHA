import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function WelcomeIntro({ onEnterWebsite }) {
  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-between bg-[#1A2218] text-[#FAF8F5] overflow-hidden px-4 py-12 select-none">
      
      {/* 1. Ambient Glow Aura Background */}
      <div className="absolute w-96 h-96 sm:w-[36rem] sm:h-[36rem] bg-[#2D5A27]/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#BC5A36]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#D0DEC6]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 2. Top Minimal Brand Badge */}
      <div className="z-10 pt-4 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] font-mono tracking-[0.25em] text-[#D0DEC6] uppercase">
          <Sparkles size={12} className="text-[#BC5A36]" />
          <span>EST. 2026 // MATCHA APPAREL</span>
        </span>
      </div>

      {/* 3. Center Hero: Floating WELCOME Text & Branding */}
      <div className="z-10 text-center animate-welcome-intro my-auto flex flex-col items-center">
        
        {/* Giant WELCOME Display */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extralight tracking-[0.3em] uppercase text-[#FAF8F5] animate-glow">
          WELCOME
        </h1>

        {/* Brand Tagline */}
        <p className="mt-6 text-xs sm:text-sm md:text-base font-light text-[#D0DEC6] tracking-[0.35em] uppercase opacity-90 font-mono">
          MatchA • Modern Artisan Streetwear
        </p>

        {/* Enter Website Button (เข้าสู่เว็บไซต์) */}
        <div className="mt-10 sm:mt-12">
          <button
            onClick={onEnterWebsite}
            className="px-8 py-4 bg-[#BC5A36] hover:bg-[#A64C2B] text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.2em] rounded-full shadow-2xl hover:shadow-[#BC5A36]/40 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-3 group border border-white/10"
          >
            <span>เข้าสู่เว็บไซต์</span>
            <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

      </div>

      {/* 4. Bottom Footer Cue */}
      <div className="z-10 text-center pb-4 opacity-60 hover:opacity-100 transition-opacity">
        <button
          onClick={onEnterWebsite}
          className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#D0DEC6] hover:text-white cursor-pointer transition-colors"
        >
          CLICK TO ENTER STORE ✦ EXPLORE DROPS
        </button>
      </div>

    </section>
  );
}
