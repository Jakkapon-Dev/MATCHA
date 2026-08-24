import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function ChooseYourFit({ onSelectFit }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  // 6 Floating Outfit Cards matching the exact layout & proportions of the reference
  const fitItems = [
    {
      id: 1,
      category: 'Tanks & Shorts',
      count: '34 Items',
      code: 'FIT-01',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_coral_polo_shirt_001.jpeg',
      positionClass: 'top-[20%] left-[8%] sm:left-[14%] lg:left-[20%]',
      sizeClass: 'w-20 sm:w-28 lg:w-36 aspect-[3/4]',
    },
    {
      id: 2,
      category: 'Oversized Tees',
      count: '82',
      subtext: 'Tees',
      code: 'FIT-02',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_striped_tee_001.jpg',
      positionClass: 'top-[22%] left-[38%] sm:left-[41%] lg:left-[43%]',
      sizeClass: 'w-24 sm:w-32 lg:w-42 aspect-[3/4]',
      isFeatured: true,
    },
    {
      id: 3,
      category: 'Statement Sweats',
      count: '46 Looks',
      code: 'FIT-03',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_crew_001.jpg',
      positionClass: 'top-[20%] right-[8%] sm:right-[14%] lg:right-[20%]',
      sizeClass: 'w-20 sm:w-28 lg:w-36 aspect-[3/4]',
    },
    {
      id: 4,
      category: 'Baggy Denim',
      count: '58 Fits',
      code: 'FIT-04',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_minimal_tee_001.jpg',
      positionClass: 'bottom-[14%] left-[12%] sm:left-[18%] lg:left-[25%]',
      sizeClass: 'w-20 sm:w-28 lg:w-36 aspect-[3/4]',
    },
    {
      id: 5,
      category: 'Tailored Cuts',
      count: '29 Looks',
      code: 'FIT-05',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_green_suit_001.jpeg',
      positionClass: 'bottom-[14%] left-[41%] sm:left-[43%] lg:left-[45%]',
      sizeClass: 'w-20 sm:w-28 lg:w-36 aspect-[3/4]',
    },
    {
      id: 6,
      category: 'Utility Outerwear',
      count: '64 Items',
      code: 'FIT-06',
      image: '/images/studio_white_bg/standing_straight/autumn/studio_straight_autumn_matcha_hoodie_terracotta_001.jpg',
      positionClass: 'bottom-[14%] right-[12%] sm:right-[18%] lg:right-[25%]',
      sizeClass: 'w-20 sm:w-28 lg:w-36 aspect-[3/4]',
    },
  ];

  return (
    <section className="relative w-full min-h-screen bg-[#FFFFFF] overflow-hidden select-none flex items-center justify-center border-b border-[#D9D3C7] py-16 sm:py-24">
      
      {/* 1. Full-Bleed Center Model Canvas (เต็มจอ 100% ไร้กรอบขอบ) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src="/images/studio_white_bg/standing_straight/spring/studio_straight_spring_nude_beige_wide_banner_2k_001.jpeg"
          alt="MatchA Choose Your Fit"
          className="w-full h-full object-cover sm:object-contain object-top opacity-95 transition-opacity"
        />
      </div>

      {/* 2. Iconic Black Label Header: [Choose Your Fit] centered over forehead */}
      <div className="absolute top-[8%] sm:top-[10%] left-1/2 transform -translate-x-1/2 z-30 pointer-events-none text-center">
        <div className="bg-black text-white px-4 py-1 sm:px-6 sm:py-1.5 text-base sm:text-2xl lg:text-3xl font-extrabold font-sans tracking-tight uppercase shadow-2xl">
          Choose Your Fit
        </div>
      </div>

      {/* 3. The 6 Floating Outfit Cards Scattered on Full Screen */}
      <div className="relative w-full max-w-7xl mx-auto h-[600px] sm:h-[750px] lg:h-[880px]">
        {fitItems.map((item) => {
          const isHovered = hoveredCard === item.id;
          
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onSelectFit && onSelectFit(item)}
              className={`absolute ${item.positionClass} ${item.sizeClass} z-20 cursor-pointer transition-all duration-300 transform ${
                isHovered ? 'scale-110 z-40 shadow-2xl ring-2 ring-black' : 'shadow-lg hover:shadow-2xl'
              } rounded-none overflow-hidden bg-white/95 border border-black/10`}
            >
              {/* Outfit Photo */}
              <img
                src={item.image}
                alt={item.category}
                className="w-full h-full object-cover object-top transition-transform duration-500"
              />

              {/* Dark Hover Tint Overlay with Category Text & Item Count */}
              <div
                className={`absolute inset-0 bg-black/75 backdrop-blur-[1px] transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center ${
                  item.isFeatured && !isHovered
                    ? 'opacity-85'
                    : isHovered
                    ? 'opacity-90'
                    : 'opacity-0 hover:opacity-90'
                }`}
              >
                {item.isFeatured && !isHovered ? (
                  <div className="text-center">
                    <span className="text-sm sm:text-lg font-mono font-bold text-white block">
                      {item.count}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold font-sans text-white uppercase tracking-wider block">
                      {item.subtext}
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="text-[9px] sm:text-[10px] font-mono text-[#D0DEC6] tracking-wider uppercase font-bold">
                      {item.count}
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-tight mt-0.5 leading-tight">
                      {item.category}
                    </h4>
                    <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-mono text-[#2D231E] font-bold uppercase bg-white px-2 py-0.5 rounded shadow-sm">
                      <span>Explore</span>
                      <ArrowUpRight size={10} />
                    </span>
                  </>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
}
