import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function ChooseYourFit({ onSelectFit }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  // 6 Uniform Large Fit Cards positioned symmetrically in the spacious white space on Left and Right
  const fitItems = [
    // --- Left Side (3 Cards) ---
    {
      id: 1,
      category: 'Tanks & Polos',
      count: '34 Items',
      code: 'FIT-01',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_coral_polo_shirt_001.jpeg',
      positionClass: 'top-[14%] left-[2%] sm:left-[5%] lg:left-[8%]',
    },
    {
      id: 2,
      category: 'Oversized Tees',
      count: '82 Tees',
      code: 'FIT-02',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_striped_tee_001.jpg',
      positionClass: 'top-[44%] left-[1%] sm:left-[3%] lg:left-[5%]',
      isFeatured: true,
    },
    {
      id: 3,
      category: 'Baggy Denim',
      count: '58 Fits',
      code: 'FIT-03',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_minimal_tee_001.jpg',
      positionClass: 'bottom-[10%] left-[2%] sm:left-[5%] lg:left-[8%]',
    },

    // --- Right Side (3 Cards) ---
    {
      id: 4,
      category: 'Statement Sweats',
      count: '46 Looks',
      code: 'FIT-04',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_crew_001.jpg',
      positionClass: 'top-[14%] right-[2%] sm:right-[5%] lg:right-[8%]',
    },
    {
      id: 5,
      category: 'Tailored Suits',
      count: '29 Tailored',
      code: 'FIT-05',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_green_suit_001.jpeg',
      positionClass: 'top-[44%] right-[1%] sm:right-[3%] lg:right-[5%]',
    },
    {
      id: 6,
      category: 'Utility Outerwear',
      count: '64 Bottoms',
      code: 'FIT-06',
      image: '/images/studio_white_bg/standing_straight/autumn/studio_straight_autumn_matcha_hoodie_terracotta_001.jpg',
      positionClass: 'bottom-[10%] right-[2%] sm:right-[5%] lg:right-[8%]',
    },
  ];

  return (
    <section className="relative w-full min-h-[900px] lg:min-h-screen bg-[#FFFFFF] overflow-hidden select-none flex items-center justify-center border-b border-[#D9D3C7] py-20">
      
      {/* 1. Full-Bleed Center Model Canvas (Unobstructed in Center) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src="/images/studio_white_bg/standing_straight/spring/studio_straight_spring_nude_beige_wide_banner_2k_001.jpeg"
          alt="MatchA Choose Your Fit"
          className="w-full h-full object-cover sm:object-contain object-center opacity-95 transition-opacity"
        />
      </div>

      {/* 2. Black Badge Header: Positioned high above head in clear white space */}
      <div className="absolute top-6 sm:top-10 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none text-center">
        <div className="bg-black text-white px-6 py-2 sm:px-10 sm:py-2.5 text-lg sm:text-2xl lg:text-3xl font-extrabold font-sans tracking-tight uppercase shadow-xl inline-block">
          Choose Your Fit
        </div>
        <p className="text-[10px] sm:text-xs font-mono text-[#6B5E55] tracking-[0.25em] uppercase mt-2 font-bold">
          SIGNATURE SILHOUETTES & FIT MATRIX
        </p>
      </div>

      {/* 3. Six Uniform Large Floating Cards Framed around Left & Right */}
      <div className="relative w-full max-w-[1550px] mx-auto h-[780px] sm:h-[860px] lg:h-[920px] px-4">
        {fitItems.map((item) => {
          const isHovered = hoveredCard === item.id;
          
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onSelectFit && onSelectFit(item)}
              className={`absolute ${item.positionClass} w-32 sm:w-44 lg:w-56 xl:w-60 aspect-[3/4] z-20 cursor-pointer transition-all duration-300 transform ${
                isHovered ? 'scale-108 z-40 shadow-2xl ring-2 ring-black -translate-y-1' : 'shadow-xl hover:shadow-2xl'
              } rounded-xl overflow-hidden bg-white border border-[#2D231E]/15`}
            >
              {/* Outfit Photo */}
              <img
                src={item.image}
                alt={item.category}
                className="w-full h-full object-cover object-top transition-transform duration-500"
              />

              {/* Dark Hover Tint Overlay with Uniform Clean Typography */}
              <div
                className={`absolute inset-0 bg-black/80 backdrop-blur-[2px] transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center ${
                  item.isFeatured && !isHovered
                    ? 'opacity-85'
                    : isHovered
                    ? 'opacity-90'
                    : 'opacity-0 hover:opacity-90'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-mono text-[#D0DEC6] tracking-wider uppercase font-bold">
                  {item.count}
                </span>
                <h4 className="text-xs sm:text-base font-extrabold text-white uppercase tracking-tight mt-1 leading-tight">
                  {item.category}
                </h4>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-mono text-[#2D231E] font-bold uppercase bg-white px-3 py-1 rounded shadow-sm">
                  <span>Explore Fit</span>
                  <ArrowUpRight size={11} />
                </span>
              </div>

              {/* Code Label in Top Left Corner */}
              {!isHovered && !item.isFeatured && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 text-[9px] sm:text-[10px] font-mono text-white rounded font-bold shadow-sm">
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
