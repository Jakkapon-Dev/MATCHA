import React, { useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export default function ChooseYourFit({ onSelectFit }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  // Upper Body Fit Categories (ส่วนบน - Tops, Tees & Sweats)
  const upperFits = [
    {
      id: 1,
      category: 'Tanks & Polos',
      count: '34 Items',
      code: 'TOP-01',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_coral_polo_shirt_001.jpeg',
      positionClass: 'top-[22%] left-[4%] sm:left-[8%] lg:left-[12%]',
      sizeClass: 'w-28 sm:w-40 lg:w-52 aspect-[3/4]',
    },
    {
      id: 2,
      category: 'Oversized Tees',
      count: '82 Tees',
      code: 'TOP-02',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_striped_tee_001.jpg',
      positionClass: 'top-[28%] left-[38%] sm:left-[41%] lg:left-[43%]',
      sizeClass: 'w-32 sm:w-44 lg:w-60 aspect-[3/4]',
      isFeatured: true,
    },
    {
      id: 3,
      category: 'Statement Sweats',
      count: '46 Looks',
      code: 'TOP-03',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_crew_001.jpg',
      positionClass: 'top-[20%] right-[4%] sm:right-[8%] lg:right-[12%]',
      sizeClass: 'w-28 sm:w-40 lg:w-52 aspect-[3/4]',
    },
  ];

  // Lower Body Fit Categories (ส่วนล่าง - Denim, Pants & Cargo)
  const lowerFits = [
    {
      id: 4,
      category: 'Baggy Denim',
      count: '58 Fits',
      code: 'BOT-01',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_minimal_tee_001.jpg',
      positionClass: 'top-[20%] left-[4%] sm:left-[8%] lg:left-[12%]',
      sizeClass: 'w-28 sm:w-40 lg:w-52 aspect-[3/4]',
    },
    {
      id: 5,
      category: 'Tailored Suits',
      count: '29 Tailored',
      code: 'BOT-02',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_green_suit_001.jpeg',
      positionClass: 'top-[26%] left-[38%] sm:left-[41%] lg:left-[43%]',
      sizeClass: 'w-32 sm:w-44 lg:w-56 aspect-[3/4]',
    },
    {
      id: 6,
      category: 'Utility Cargo',
      count: '64 Bottoms',
      code: 'BOT-03',
      image: '/images/studio_white_bg/standing_straight/autumn/studio_straight_autumn_matcha_hoodie_terracotta_001.jpg',
      positionClass: 'top-[20%] right-[4%] sm:right-[8%] lg:right-[12%]',
      sizeClass: 'w-28 sm:w-40 lg:w-52 aspect-[3/4]',
    },
  ];

  return (
    <section className="relative w-full bg-[#FAF8F5] text-[#2D231E] border-b border-[#D9D3C7] overflow-hidden select-none">
      
      {/* ========================================================================= */}
      {/* 1. ส่วนบน (STAGE 01: UPPER SILHOUETTES - TOPS, TEES & SWEATS) */}
      {/* ========================================================================= */}
      <div className="relative w-full h-[650px] sm:h-[800px] lg:h-[950px] flex items-center justify-center border-b border-[#2D231E]/20 bg-white overflow-hidden">
        
        {/* Background Canvas: Upper Torso & Head of Nude Model */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/images/studio_white_bg/standing_straight/spring/studio_straight_spring_nude_beige_tank_tailored_pants_001.jpeg"
            alt="MatchA Upper Canvas"
            className="w-full h-[200%] object-cover sm:object-contain object-top opacity-95 transition-opacity"
          />
        </div>

        {/* Section Label Top Left */}
        <div className="absolute top-6 left-6 sm:left-12 z-30 flex items-center gap-2">
          <span className="px-3 py-1 bg-[#2D5A27] text-white text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest rounded-md shadow-md">
            PART 01 // TOPS & UPPER BODY
          </span>
        </div>

        {/* Iconic Header Badge: [Choose Your Fit] */}
        <div className="absolute top-[8%] sm:top-[10%] left-1/2 transform -translate-x-1/2 z-30 pointer-events-none text-center">
          <div className="bg-[#2D231E] text-[#FAF8F5] px-6 py-2 sm:px-10 sm:py-3 text-xl sm:text-3xl lg:text-4xl font-extrabold font-sans tracking-tight uppercase shadow-2xl inline-block">
            Choose Your Fit
          </div>
          <p className="text-[11px] font-mono text-[#6B5E55] tracking-widest uppercase mt-2">
            SELECT UPPER SILHOUETTE
          </p>
        </div>

        {/* 3 Upper Floating Outfit Cards */}
        {upperFits.map((item) => {
          const isHovered = hoveredCard === item.id;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onSelectFit && onSelectFit(item)}
              className={`absolute ${item.positionClass} ${item.sizeClass} z-20 cursor-pointer transition-all duration-300 transform ${
                isHovered ? 'scale-110 z-40 shadow-2xl ring-4 ring-[#2D5A27]' : 'shadow-xl hover:shadow-2xl'
              } rounded-xl overflow-hidden bg-white/95 border border-[#2D231E]/20`}
            >
              <img
                src={item.image}
                alt={item.category}
                className="w-full h-full object-cover object-top transition-transform duration-500"
              />

              {/* Dark Hover Tint Overlay */}
              <div
                className={`absolute inset-0 bg-[#2D231E]/85 backdrop-blur-[2px] transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center ${
                  item.isFeatured || isHovered ? 'opacity-90' : 'opacity-0 hover:opacity-90'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-mono text-[#D0DEC6] tracking-wider uppercase font-bold">
                  {item.count}
                </span>
                <h4 className="text-sm sm:text-lg font-extrabold text-[#FAF8F5] uppercase tracking-tight mt-1 leading-tight">
                  {item.category}
                </h4>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-mono text-[#BC5A36] font-bold uppercase bg-white px-3 py-1 rounded shadow-sm">
                  <span>Explore Fit</span>
                  <ArrowUpRight size={12} />
                </span>
              </div>

              {!isHovered && !item.isFeatured && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#2D231E]/80 text-[9px] font-mono text-white rounded font-bold">
                  {item.code}
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* ========================================================================= */}
      {/* 2. ส่วนล่าง (STAGE 02: LOWER SILHOUETTES - PANTS, DENIM & CARGO) */}
      {/* ========================================================================= */}
      <div className="relative w-full h-[650px] sm:h-[800px] lg:h-[950px] flex items-center justify-center bg-white overflow-hidden">
        
        {/* Background Canvas: Lower Waist & Tailored Pants of Nude Model */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/images/studio_white_bg/standing_straight/spring/studio_straight_spring_nude_beige_tank_tailored_pants_001.jpeg"
            alt="MatchA Lower Canvas"
            className="w-full h-[200%] top-[-100%] relative object-cover sm:object-contain object-bottom opacity-95 transition-opacity"
          />
        </div>

        {/* Section Label Bottom Left */}
        <div className="absolute top-6 left-6 sm:left-12 z-30 flex items-center gap-2">
          <span className="px-3 py-1 bg-[#BC5A36] text-white text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest rounded-md shadow-md">
            PART 02 // BOTTOMS & LOWER BODY
          </span>
        </div>

        {/* Center Waistline Divider Badge */}
        <div className="absolute top-[6%] sm:top-[8%] left-1/2 transform -translate-x-1/2 z-30 pointer-events-none text-center">
          <div className="bg-[#2D231E] text-[#FAF8F5] px-6 py-2 sm:px-8 sm:py-2.5 text-base sm:text-2xl font-extrabold font-mono tracking-widest uppercase shadow-2xl inline-flex items-center gap-2">
            <Sparkles size={16} className="text-[#D0DEC6]" />
            <span>TROUSERS & BOTTOM SILHOUETTES</span>
          </div>
        </div>

        {/* 3 Lower Floating Outfit Cards */}
        {lowerFits.map((item) => {
          const isHovered = hoveredCard === item.id;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onSelectFit && onSelectFit(item)}
              className={`absolute ${item.positionClass} ${item.sizeClass} z-20 cursor-pointer transition-all duration-300 transform ${
                isHovered ? 'scale-110 z-40 shadow-2xl ring-4 ring-[#BC5A36]' : 'shadow-xl hover:shadow-2xl'
              } rounded-xl overflow-hidden bg-white/95 border border-[#2D231E]/20`}
            >
              <img
                src={item.image}
                alt={item.category}
                className="w-full h-full object-cover object-top transition-transform duration-500"
              />

              {/* Dark Hover Tint Overlay */}
              <div
                className={`absolute inset-0 bg-[#2D231E]/85 backdrop-blur-[2px] transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center ${
                  isHovered ? 'opacity-90' : 'opacity-0 hover:opacity-90'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-mono text-[#D0DEC6] tracking-wider uppercase font-bold">
                  {item.count}
                </span>
                <h4 className="text-sm sm:text-lg font-extrabold text-[#FAF8F5] uppercase tracking-tight mt-1 leading-tight">
                  {item.category}
                </h4>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-mono text-[#BC5A36] font-bold uppercase bg-white px-3 py-1 rounded shadow-sm">
                  <span>Explore Cut</span>
                  <ArrowUpRight size={12} />
                </span>
              </div>

              {!isHovered && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#2D231E]/80 text-[9px] font-mono text-white rounded font-bold">
                  {item.code}
                </div>
              )}
            </div>
          );
        })}

      </div>

    </section>
  );
}
