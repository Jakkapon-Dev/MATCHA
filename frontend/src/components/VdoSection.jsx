import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function VdoSection({ onClaimPromo }) {
  // High-definition fashion streetwear lookbook cinematic loop
  const videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-stylish-model-posing-outdoors-in-the-city-41222-large.mp4";

  return (
    <section className="relative w-full min-h-screen bg-[#1A2218] overflow-hidden flex items-center justify-center border-y border-[#2D5A27]/30 select-none py-16 sm:py-24">
      
      {/* 1. Full-Height Background Video (Anchored to top to prevent head crop) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-top sm:object-[center_15%] opacity-90 pointer-events-none"
      >
        <source src="/videos/lookbook_reel.mp4" type="video/mp4" />
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* 2. Film Gradient Overlays for Readability & Depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/65 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1A2218] via-transparent to-[#1A2218]/90 pointer-events-none" />

      {/* 3. Main Content Container: Left Headline + Right Floating Glass Card */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-10 sm:gap-14">
        
        {/* Left Side: Editorial Cinematic Title */}
        <div className="max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#D0DEC6] text-xs font-mono tracking-widest uppercase mb-5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#BC5A36] animate-pulse" />
            <span>SEASON 01 // CINEMATIC REEL</span>
          </div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#FAF8F5] tracking-tight uppercase leading-[0.95] drop-shadow-xl">
            MOVEMENT <br />
            <span className="text-[#D0DEC6] font-light">& EXPRESSION</span>
          </h2>
          <p className="mt-6 text-xs sm:text-sm text-neutral-300 font-mono max-w-md leading-relaxed drop-shadow">
            Experience our organic Japanese cotton textures in real-world motion. Engineered for unrestricted movement in the modern urban landscape.
          </p>
        </div>

        {/* Right Side: Floating Glass Promotion Card (Glassmorphism) */}
        <div className="w-full max-w-md backdrop-blur-2xl bg-[#FAF8F5]/95 border border-white/60 shadow-2xl rounded-3xl p-6 sm:p-8 transform hover:scale-[1.02] transition-transform duration-300">
          
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 bg-[#BC5A36] text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm flex items-center gap-1.5">
              <Sparkles size={11} />
              <span>SPECIAL PROMO</span>
            </span>
            <span className="text-[10px] font-mono text-[#2D5A27] font-bold bg-[#D0DEC6] px-2.5 py-1 rounded-md">
              USE: MATCHA15
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2D231E] leading-tight">
            Buy two items get 15% off the total
          </h3>

          <p className="text-xs text-[#6B5E55] mt-3 leading-relaxed font-sans">
            Mix and match any tops and bottoms from our new MatchA series to unlock your discount automatically at checkout.
          </p>

          <button 
            onClick={onClaimPromo}
            className="mt-6 w-full py-4 bg-[#BC5A36] hover:bg-[#A64C2B] text-white font-bold font-mono text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-[#BC5A36]/30 active:scale-95 cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>Claim 15% Discount</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>

        </div>

      </div>

    </section>
  );
}
