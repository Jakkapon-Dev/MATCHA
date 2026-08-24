import React, { useState, useEffect } from 'react';
import { Shuffle, Play, Pause, ArrowRight } from 'lucide-react';

export default function BrandHero({ onShopNow, onEnterWebsite }) {
  const sectionRef = useRef(null);
  const [stickyOffset, setStickyOffset] = useState(0);

  // Guarantee silky-smooth sticky pinning behind model until BrandHero section ends
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!sectionRef.current) return;
          const rect = sectionRef.current.getBoundingClientRect();
          if (rect.top <= 0 && rect.bottom >= 150) {
            const maxShift = sectionRef.current.offsetHeight - window.innerHeight;
            const shift = Math.min(Math.max(-rect.top, 0), maxShift > 0 ? maxShift : 0);
            setStickyOffset(shift);
          } else if (rect.top > 0) {
            setStickyOffset(0);
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
  // Auto-run on page load by default with 1.30s interval per user request
  const [slicePlaying, setSlicePlaying] = useState([true, true, true, true]);

  // Randomize all 4 slices independently across 10 outfits
  const randomizeAll = () => {
    setSliceModels([
      Math.floor(Math.random() * models.length),
      Math.floor(Math.random() * models.length),
      Math.floor(Math.random() * models.length),
      Math.floor(Math.random() * models.length)
    ]);
  };

  // Auto-play interval effect for active running slices with randomized selection (1.30 seconds)
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

  return (
    <section 
      ref={sectionRef}
      className="relative w-full bg-[#FAF8F5] text-[#2D231E] min-h-[145vh] py-6 sm:py-10 px-4 sm:px-8 lg:px-12 flex flex-col justify-between select-none border-b border-[#D9D3C7]"
    >
      
      {/* 1. Header Title: Glides & follows smoothly with scroll inside Hero, stops & exits at ChooseYourFit */}
      <div 
        className="w-full text-center z-0 pointer-events-none select-none pt-2 relative"
        style={{
          transform: `translateY(${stickyOffset}px)`,
          transition: 'transform 0.04s ease-out',
        }}
      >
        <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[11.5rem] xl:text-[14rem] font-black tracking-tight uppercase leading-none inline-block whitespace-nowrap drop-shadow-sm font-sans">
          <span className="text-[#2D5A27]">MATCH</span>
          <span className="text-[#BC5A36]">A</span>
        </h1>
      </div>

      {/* 2. Main 3-Column Layout with Magazine Depth Overlap (In Front of Sticky MATCHA) */}
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-center my-auto -mt-10 sm:-mt-16 md:-mt-24 lg:-mt-32 pt-4 pb-20">
        
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

        {/* Center Column: Extra Large Sliced Model Supporting 10 Outfits with Magazine Overlap */}
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

            {/* Slice 2: Torso & Apparel (25% - 50%) */}
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

        </div>

        {/* Right Column: Code, Barcode & Action Button */}
        <div className="md:col-span-3 flex flex-col items-center md:items-start justify-center gap-6 order-3 z-20">
          
          {/* Metadata Text */}
          <div className="text-center md:text-left font-mono">
            <p className="text-xs font-bold tracking-wider text-[#2D231E]">
              DROP_35 &nbsp;//&nbsp; URBAN
            </p>
            <p className="text-xs font-bold tracking-wider text-[#6B5E55] mt-0.5">
              CODE &nbsp;//&nbsp; LIMITED RUN
            </p>
          </div>

          {/* Barcode Graphic */}
          <div className="w-48 py-1">
            <svg viewBox="0 0 200 40" className="w-full h-8 text-[#2D231E] fill-current">
              <rect x="0" y="0" width="3" height="40" />
              <rect x="5" y="0" width="2" height="40" />
              <rect x="9" y="0" width="4" height="40" />
              <rect x="16" y="0" width="1" height="40" />
              <rect x="19" y="0" width="6" height="40" />
              <rect x="28" y="0" width="2" height="40" />
              <rect x="32" y="0" width="3" height="40" />
              <rect x="38" y="0" width="5" height="40" />
              <rect x="46" y="0" width="2" height="40" />
              <rect x="50" y="0" width="4" height="40" />
              <rect x="57" y="0" width="1" height="40" />
              <rect x="61" y="0" width="6" height="40" />
              <rect x="70" y="0" width="2" height="40" />
              <rect x="75" y="0" width="5" height="40" />
              <rect x="83" y="0" width="3" height="40" />
              <rect x="89" y="0" width="2" height="40" />
              <rect x="94" y="0" width="6" height="40" />
              <rect x="103" y="0" width="1" height="40" />
              <rect x="107" y="0" width="4" height="40" />
              <rect x="114" y="0" width="3" height="40" />
              <rect x="120" y="0" width="5" height="40" />
              <rect x="128" y="0" width="2" height="40" />
              <rect x="133" y="0" width="4" height="40" />
              <rect x="140" y="0" width="1" height="40" />
              <rect x="144" y="0" width="6" height="40" />
              <rect x="153" y="0" width="3" height="40" />
              <rect x="159" y="0" width="2" height="40" />
              <rect x="164" y="0" width="5" height="40" />
              <rect x="172" y="0" width="2" height="40" />
              <rect x="177" y="0" width="4" height="40" />
              <rect x="184" y="0" width="1" height="40" />
              <rect x="188" y="0" width="6" height="40" />
              <rect x="197" y="0" width="3" height="40" />
            </svg>
            <p className="text-[10px] font-mono text-[#6B5E55] tracking-widest text-center mt-1">
              8 859012 345678
            </p>
          </div>

          {/* Action Button: SHOP NEW DROPS / ENTER WEBSITE */}
          <button 
            onClick={handleAction}
            className="w-full sm:w-auto px-7 py-3.5 bg-[#BC5A36] hover:bg-[#A64C2B] text-white font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-[#BC5A36]/30 active:scale-95 cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>{onEnterWebsite ? 'เข้าสู่เว็บไซต์' : 'SHOP NEW DROPS'}</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>

        </div>

      </div>

    </section>
  );
}
