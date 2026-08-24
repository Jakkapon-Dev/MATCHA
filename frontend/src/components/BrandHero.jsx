import React, { useState, useEffect, useRef } from 'react';
import { Shuffle, Play, Pause, ArrowRight, ChevronDown } from 'lucide-react';

export default function BrandHero({ onShopNow, onEnterWebsite }) {
  const heroRef = useRef(null);

  // 10 Strictly Verified Studio White Background Front-Facing Models (100% Facing Forward)
  const models = [
    {
      id: 'LOOK-01',
      name: 'MatchA Crew & Lace Skirt',
      src: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_crew_001.jpg'
    },
    {
      id: 'LOOK-02',
      name: 'MatchA Striped Tee & Cargo Trousers',
      src: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_striped_tee_001.jpg'
    },
    {
      id: 'LOOK-03',
      name: 'MatchA Green Hoodie & Terracotta Pants',
      src: '/images/studio_white_bg/standing_straight/autumn/studio_straight_autumn_matcha_hoodie_terracotta_001.jpg'
    },
    {
      id: 'LOOK-04',
      name: 'MatchA Minimalist Tee & Wide Pants',
      src: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_minimal_tee_001.jpg'
    },
    {
      id: 'LOOK-05',
      name: 'Emerald Green Velvet Suit',
      src: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_green_suit_001.jpeg'
    },
    {
      id: 'LOOK-06',
      name: 'Geometric Colorblock Knitwear Set',
      src: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_knitwear_set_001.jpeg'
    },
    {
      id: 'LOOK-07',
      name: 'Charcoal Tailored Suit & Tie',
      src: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_tailored_suit_001.jpeg'
    },
    {
      id: 'LOOK-08',
      name: 'Royal Blue Street Suit',
      src: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_royal_blue_suit_001.jpeg'
    },
    {
      id: 'LOOK-09',
      name: 'Peach Linen Blazer & Slacks',
      src: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_peach_linen_suit_001.jpeg'
    },
    {
      id: 'LOOK-10',
      name: 'Mint Green Summer Suit & Sneakers',
      src: '/images/studio_white_bg/standing_straight/summer/studio_straight_summer_wearing_mint_green_suit_001.jpeg'
    }
  ];

  // Each slice model index (Initialized with a dynamic multi-color random mix)
  const [sliceModels, setSliceModels] = useState([0, 4, 2, 5]);

  // Track auto-play running state for each of the 4 slices: [slice0, slice1, slice2, slice3]
  const [slicePlaying, setSlicePlaying] = useState([true, true, true, true]);

  // Scroll Progress Tracker for Cinematic Kinetic Sequence
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!heroRef.current) return;
          const rect = heroRef.current.getBoundingClientRect();
          const totalScrollable = heroRef.current.offsetHeight - window.innerHeight;
          if (totalScrollable > 0) {
            const currentScrolled = -rect.top;
            const p = Math.min(Math.max(currentScrolled / totalScrollable, 0), 1);
            setScrollProgress(p);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Randomize all 4 slices independently across 10 outfits
  const randomizeAll = () => {
    setSliceModels([
      Math.floor(Math.random() * models.length),
      Math.floor(Math.random() * models.length),
      Math.floor(Math.random() * models.length),
      Math.floor(Math.random() * models.length)
    ]);
  };

  // Auto-play interval effect for active running slices (1.30 seconds)
  useEffect(() => {
    const hasAnyPlaying = slicePlaying.some((p) => p);
    if (!hasAnyPlaying) return;

    const interval = setInterval(() => {
      setSliceModels((prev) => {
        return prev.map((currentIdx, sliceIdx) => {
          if (slicePlaying[sliceIdx]) {
            let nextIdx = Math.floor(Math.random() * models.length);
            if (nextIdx === currentIdx) {
              nextIdx = (currentIdx + 1) % models.length;
            }
            return nextIdx;
          }
          return currentIdx;
        });
      });
    }, 1300);

    return () => clearInterval(interval);
  }, [slicePlaying, models.length]);

  // Toggle play/stop on a specific slice
  const togglePlaySlice = (sliceIndex, e) => {
    e?.stopPropagation();
    setSlicePlaying((prev) => {
      const next = [...prev];
      next[sliceIndex] = !next[sliceIndex];
      return next;
    });
  };

  // Toggle master play/pause for all 4 slices together
  const togglePlayAll = () => {
    const allPlaying = slicePlaying.every((p) => p);
    setSlicePlaying([!allPlaying, !allPlaying, !allPlaying, !allPlaying]);
  };

  // Click on a single slice to cycle to a random new look
  const cycleSingleSlice = (sliceIndex) => {
    setSliceModels((prev) => {
      const next = [...prev];
      let randomLook = Math.floor(Math.random() * models.length);
      if (randomLook === next[sliceIndex]) {
        randomLook = (next[sliceIndex] + 1) % models.length;
      }
      next[sliceIndex] = randomLook;
      return next;
    });
  };

  // Stacked badge words matching the reference design
  const stackedBadges = [
    'Fresh Cuts',
    'And',
    'Bold Statement',
    'Streetwear',
    'Designed',
    'For',
    'The Ultimate',
    'Urban',
    'Playground',
    '☺'
  ];

  const isAllPlaying = slicePlaying.every((p) => p);

  const handleAction = () => {
    if (onEnterWebsite) {
      onEnterWebsite();
    } else if (onShopNow) {
      onShopNow();
    }
  };

  // Sequence Calculations:
  // Phase 1 (0 -> 0.3): MATCHA starts centered and expands
  // Phase 2 (0.2 -> 0.8): Model & Badges glide smoothly UP into place
  const titleScale = 1 + scrollProgress * 0.65;
  const titleTranslateY = scrollProgress * -90; // px
  
  const contentProgress = Math.min(Math.max((scrollProgress - 0.18) / 0.62, 0), 1);
  const contentTranslateY = (1 - contentProgress) * 140; // px
  const contentOpacity = contentProgress;
  const contentScale = 0.94 + contentProgress * 0.06;

  const hintOpacity = Math.max(1 - scrollProgress * 4.5, 0);

  return (
    <section 
      ref={heroRef} 
      className="relative w-full bg-[#FAF8F5] text-[#2D231E] min-h-[195vh] select-none"
    >
      {/* Sticky Fullscreen Stage */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
        
        {/* 1. SCENE 1 & BACKGROUND: MATCHA Title - Expands smoothly as you scroll */}
        <div 
          className="absolute inset-x-0 z-0 text-center pointer-events-none transition-transform duration-75 ease-out origin-center"
          style={{
            top: '38%',
            transform: `translateY(calc(-50% + ${titleTranslateY}px)) scale(${titleScale})`,
          }}
        >
          <h1 className="text-6xl sm:text-8xl md:text-[11rem] lg:text-[15rem] xl:text-[18.5rem] font-black tracking-tight uppercase leading-[0.82] inline-block whitespace-nowrap drop-shadow-sm font-sans">
            <span className="text-[#2D5A27] transition-colors">MATCH</span>
            <span className="text-[#BC5A36] transition-colors">A</span>
          </h1>

          {/* Initial Scroll Prompt Hint */}
          <div 
            className="mt-4 flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-[0.25em] text-[#6B5E55] uppercase transition-opacity duration-300 pointer-events-none"
            style={{ opacity: hintOpacity }}
          >
            <span>SCROLL TO EXPLORE LOOKBOOK</span>
            <ChevronDown size={14} className="animate-bounce text-[#BC5A36]" />
          </div>
        </div>

        {/* 2. SCENE 2: Main 3-Column Outfit Grid (Model + Badges) - Glides UP into View */}
        <div 
          className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-center transition-all duration-75 ease-out mt-12 sm:mt-16 md:mt-20 lg:mt-24"
          style={{
            transform: `translateY(${contentTranslateY}px) scale(${contentScale})`,
            opacity: contentOpacity,
            pointerEvents: contentProgress > 0.3 ? 'auto' : 'none',
          }}
        >
          
          {/* Left Column: Stacked Black Badge Typography */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start justify-center order-2 md:order-1 z-20">
            <div className="flex flex-col items-center md:items-start gap-1">
              {stackedBadges.map((text, i) => (
                <span
                  key={i}
                  className="bg-[#2D231E] text-[#FAF8F5] px-3.5 py-1 text-xs sm:text-sm font-bold font-mono uppercase tracking-wider inline-block shadow-md transition-transform hover:scale-105 select-none"
                >
                  {text}
                </span>
              ))}
            </div>
          </div>

          {/* Center Column: Extra Large Sliced Model Supporting 10 Outfits */}
          <div className="md:col-span-6 flex flex-col items-center justify-center order-1 md:order-2 z-20">
            
            <div 
              className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl aspect-3/4 bg-white rounded-none overflow-hidden shadow-2xl border border-[#2D231E]/20 flex flex-col select-none group/card z-20"
            >
              
              {/* Slice 1: Head & Face (Top 25%) */}
              <div 
                onClick={() => cycleSingleSlice(0)}
                className="relative w-full h-[25%] overflow-hidden border-b border-[#2D231E]/15 bg-neutral-100 cursor-pointer group"
                title="Click to randomize head slice"
              >
                <img 
                  src={models[sliceModels[0]].src} 
                  alt="MatchA Head Slice" 
                  className="absolute inset-x-0 w-full h-[400%] top-0 object-cover object-center pointer-events-none transition-all duration-500 group-hover:scale-102"
                />
                {/* Slice 1 Play / Stop Button */}
                <button 
                  onClick={(e) => togglePlaySlice(0, e)}
                  title={slicePlaying[0] ? 'Stop Randomizing Slice 1' : 'Auto-Randomize Slice 1'}
                  aria-label="Toggle Slice 1 Auto-run"
                  className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold shadow-md transition-all z-20 cursor-pointer ${
                    slicePlaying[0]
                      ? 'bg-[#BC5A36] text-white border-[#A64C2B] animate-pulse ring-2 ring-[#BC5A36]/40'
                      : 'bg-white/90 text-[#2D231E] border-[#D9D3C7] hover:bg-[#BC5A36] hover:text-white'
                  }`}
                >
                  {slicePlaying[0] ? '⏸' : '▷'}
                </button>
              </div>

              {/* Slice 2: Torso & Tops/Jackets (25% - 50%) */}
              <div 
                onClick={() => cycleSingleSlice(1)}
                className="relative w-full h-[25%] overflow-hidden border-b border-[#2D231E]/15 bg-neutral-100 cursor-pointer group"
                title="Click to randomize torso slice"
              >
                <img 
                  src={models[sliceModels[1]].src} 
                  alt="MatchA Torso Slice" 
                  className="absolute inset-x-0 w-full h-[400%] -top-full object-cover object-center pointer-events-none transition-all duration-500 group-hover:scale-102"
                />
                {/* Slice 2 Play / Stop Button */}
                <button 
                  onClick={(e) => togglePlaySlice(1, e)}
                  title={slicePlaying[1] ? 'Stop Randomizing Slice 2' : 'Auto-Randomize Slice 2'}
                  aria-label="Toggle Slice 2 Auto-run"
                  className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold shadow-md transition-all z-20 cursor-pointer ${
                    slicePlaying[1]
                      ? 'bg-[#BC5A36] text-white border-[#A64C2B] animate-pulse ring-2 ring-[#BC5A36]/40'
                      : 'bg-white/90 text-[#2D231E] border-[#D9D3C7] hover:bg-[#BC5A36] hover:text-white'
                  }`}
                >
                  {slicePlaying[1] ? '⏸' : '▷'}
                </button>
              </div>

              {/* Slice 3: Lower Body & Pants/Skirt (50% - 75%) */}
              <div 
                onClick={() => cycleSingleSlice(2)}
                className="relative w-full h-[25%] overflow-hidden border-b border-[#2D231E]/15 bg-neutral-100 cursor-pointer group"
                title="Click to randomize pants/skirt slice"
              >
                <img 
                  src={models[sliceModels[2]].src} 
                  alt="MatchA Pants/Skirt Slice" 
                  className="absolute inset-x-0 w-full h-[400%] top-[-200%] object-cover object-center pointer-events-none transition-all duration-500 group-hover:scale-102"
                />
                {/* Slice 3 Play / Stop Button */}
                <button 
                  onClick={(e) => togglePlaySlice(2, e)}
                  title={slicePlaying[2] ? 'Stop Randomizing Slice 3' : 'Auto-Randomize Slice 3'}
                  aria-label="Toggle Slice 3 Auto-run"
                  className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold shadow-md transition-all z-20 cursor-pointer ${
                    slicePlaying[2]
                      ? 'bg-[#BC5A36] text-white border-[#A64C2B] animate-pulse ring-2 ring-[#BC5A36]/40'
                      : 'bg-white/90 text-[#2D231E] border-[#D9D3C7] hover:bg-[#BC5A36] hover:text-white'
                  }`}
                >
                  {slicePlaying[2] ? '⏸' : '▷'}
                </button>
              </div>

              {/* Slice 4: Sneakers & Studio Floor (75% - 100%) */}
              <div 
                onClick={() => cycleSingleSlice(3)}
                className="relative w-full h-[25%] overflow-hidden bg-neutral-100 cursor-pointer group"
                title="Click to randomize footwear slice"
              >
                <img 
                  src={models[sliceModels[3]].src} 
                  alt="MatchA Footwear Slice" 
                  className="absolute inset-x-0 w-full h-[400%] top-[-300%] object-cover object-center pointer-events-none transition-all duration-500 group-hover:scale-102"
                />
                {/* Slice 4 Play / Stop Button */}
                <button 
                  onClick={(e) => togglePlaySlice(3, e)}
                  title={slicePlaying[3] ? 'Stop Randomizing Slice 4' : 'Auto-Randomize Slice 4'}
                  aria-label="Toggle Slice 4 Auto-run"
                  className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold shadow-md transition-all z-20 cursor-pointer ${
                    slicePlaying[3]
                      ? 'bg-[#BC5A36] text-white border-[#A64C2B] animate-pulse ring-2 ring-[#BC5A36]/40'
                      : 'bg-white/90 text-[#2D231E] border-[#D9D3C7] hover:bg-[#BC5A36] hover:text-white'
                  }`}
                >
                  {slicePlaying[3] ? '⏸' : '▷'}
                </button>
              </div>

            </div>

            {/* Sub Controls: Master Play All + Shuffle Slices */}
            <div className="mt-3 flex items-center gap-3 z-30">
              <button
                onClick={randomizeAll}
                className="px-3.5 py-1.5 bg-white hover:bg-[#2D5A27] text-[#2D231E] hover:text-white border border-[#D9D3C7] text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Shuffle All 4 Slices"
              >
                <Shuffle size={13} />
                <span>Shuffle All</span>
              </button>

              <button
                onClick={togglePlayAll}
                className={`px-3.5 py-1.5 border text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isAllPlaying
                    ? 'bg-[#BC5A36] text-white border-[#A64C2B] animate-pulse'
                    : 'bg-white hover:bg-[#BC5A36] text-[#2D231E] hover:text-white border-[#D9D3C7]'
                }`}
                title={isAllPlaying ? 'Pause Auto Randomization' : 'Auto-Run All 4 Slices'}
              >
                {isAllPlaying ? <Pause size={13} /> : <Play size={13} />}
                <span>{isAllPlaying ? 'Auto (1.3s)' : 'Resume'}</span>
              </button>
            </div>

          </div>

          {/* Right Column: Code, Barcode & Action Button */}
          <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center order-3 z-20">
            <div className="flex flex-col items-center md:items-end gap-4 max-w-xs text-center md:text-right">
              
              {/* Technical Code Meta */}
              <div className="font-mono text-xs text-[#2D231E] leading-relaxed select-none">
                <p className="font-bold tracking-wider">DROP_35 // URBAN</p>
                <p className="text-[#6B5E55] tracking-widest text-[11px]">CODE // LIMITED RUN</p>
              </div>

              {/* Realistic Barcode Visual */}
              <div className="flex flex-col items-center md:items-end select-none">
                <div className="flex items-center gap-[3px] h-10 px-2 py-1 bg-white border border-[#D9D3C7]">
                  <div className="w-[2px] h-8 bg-black"></div>
                  <div className="w-[1px] h-8 bg-black"></div>
                  <div className="w-[3px] h-8 bg-black"></div>
                  <div className="w-[1px] h-8 bg-black"></div>
                  <div className="w-[4px] h-8 bg-black"></div>
                  <div className="w-[2px] h-8 bg-black"></div>
                  <div className="w-[1px] h-8 bg-black"></div>
                  <div className="w-[3px] h-8 bg-black"></div>
                  <div className="w-[2px] h-8 bg-black"></div>
                  <div className="w-[1px] h-8 bg-black"></div>
                  <div className="w-[4px] h-8 bg-black"></div>
                  <div className="w-[2px] h-8 bg-black"></div>
                  <div className="w-[1px] h-8 bg-black"></div>
                </div>
                <span className="text-[9px] font-mono tracking-[0.3em] text-[#6B5E55] mt-1">
                  8 859012 345678
                </span>
              </div>

              {/* Action Button: Shop New Drops */}
              <button
                onClick={handleAction}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#BC5A36] hover:bg-[#9E4423] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 group/btn"
              >
                <span>SHOP NEW DROPS</span>
                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
