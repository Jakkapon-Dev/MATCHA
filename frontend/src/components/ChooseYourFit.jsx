import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function ChooseYourFit({ onSelectFit }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  // 6 Floating Silhouette / Fit Categories matching the reference design layout
  const fitItems = [
    {
      id: 1,
      category: 'Tanks & Shorts',
      count: '34 Items',
      code: 'FIT-01',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_coral_polo_shirt_001.jpeg',
      positionClass: 'top-[14%] left-[6%] sm:left-[10%] lg:left-[14%]',
      sizeClass: 'w-24 sm:w-32 lg:w-40 aspect-[3/4]',
    },
    {
      id: 2,
      category: 'Oversized Tees',
      count: '82 Tees',
      code: 'FIT-02',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_striped_tee_001.jpg',
      positionClass: 'top-[18%] left-[40%] sm:left-[42%] lg:left-[44%]',
      sizeClass: 'w-28 sm:w-36 lg:w-44 aspect-[3/4]',
      isFeatured: true,
    },
    {
      id: 3,
      category: 'Statement Sweats',
      count: '46 Looks',
      code: 'FIT-03',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_crew_001.jpg',
      positionClass: 'top-[16%] right-[6%] sm:right-[10%] lg:right-[14%]',
      sizeClass: 'w-24 sm:w-32 lg:w-40 aspect-[3/4]',
    },
    {
      id: 4,
      category: 'Baggy Denim',
      count: '58 Fits',
      code: 'FIT-04',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_minimal_tee_001.jpg',
      positionClass: 'bottom-[12%] left-[8%] sm:left-[14%] lg:left-[18%]',
      sizeClass: 'w-24 sm:w-32 lg:w-40 aspect-[3/4]',
    },
    {
      id: 5,
      category: 'Tailored Suits',
      count: '29 Tailored',
      code: 'FIT-05',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_green_suit_001.jpeg',
      positionClass: 'bottom-[8%] left-[42%] sm:left-[44%] lg:left-[46%]',
      sizeClass: 'w-24 sm:w-32 lg:w-40 aspect-[3/4]',
    },
    {
      id: 6,
      category: 'Utility Hoodies',
      count: '64 Hoodies',
      code: 'FIT-06',
      image: '/images/studio_white_bg/standing_straight/autumn/studio_straight_autumn_matcha_hoodie_terracotta_001.jpg',
      positionClass: 'bottom-[12%] right-[8%] sm:right-[14%] lg:right-[18%]',
      sizeClass: 'w-24 sm:w-32 lg:w-40 aspect-[3/4]',
    },
  ];

  return (
    <section className="relative w-full bg-[#FAF8F5] overflow-hidden select-none py-12 sm:py-20 border-b border-[#D9D3C7]">
      
      {/* 1. Main Canvas Stage with Giant Center Nude Model Background */}
      <div className="relative max-w-5xl mx-auto w-full h-[620px] sm:h-[750px] lg:h-[880px] flex items-center justify-center">
        
        {/* Giant Nude Beige Background Model (Centered 100%) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/images/studio_white_bg/standing_straight/spring/studio_straight_spring_nude_beige_tank_tailored_pants_001.jpeg"
            alt="MatchA Fit Canvas"
            className="w-full h-full object-cover sm:object-contain object-top opacity-95 transition-opacity duration-700"
          />
        </div>

        {/* 2. Iconic Header Badge: [Choose Your Fit] centered over the head */}
        <div className="absolute top-[8%] sm:top-[10%] left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-[#2D231E] text-[#FAF8F5] px-4 py-1.5 sm:px-6 sm:py-2 text-base sm:text-2xl lg:text-3xl font-extrabold font-sans tracking-tight uppercase shadow-2xl">
            Choose Your Fit
          </div>
        </div>

        {/* 3. Six Floating Full-Body Outfit Cards Scattered around the Body */}
        {fitItems.map((item) => {
          const isHovered = hoveredCard === item.id;
          
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onSelectFit && onSelectFit(item)}
              className={`absolute ${item.positionClass} ${item.sizeClass} z-20 cursor-pointer transition-all duration-300 transform ${
                isHovered ? 'scale-110 z-40 shadow-2xl ring-2 ring-[#2D5A27]' : 'shadow-xl hover:shadow-2xl'
              } rounded-lg overflow-hidden bg-white/90 border border-[#2D231E]/20`}
            >
              {/* Outfit Photo */}
              <img
                src={item.image}
                alt={item.category}
                className="w-full h-full object-cover object-top transition-transform duration-500"
              />

              {/* Dark Hover Tint Overlay with Category Text & Item Count */}
              <div
                className={`absolute inset-0 bg-[#2D231E]/80 backdrop-blur-[2px] transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center ${
                  item.isFeatured || isHovered ? 'opacity-90' : 'opacity-0 hover:opacity-90'
                }`}
              >
                <span className="text-[9px] sm:text-[10px] font-mono text-[#D0DEC6] tracking-wider uppercase font-bold">
                  {item.count}
                </span>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#FAF8F5] uppercase tracking-tight mt-0.5 leading-tight">
                  {item.category}
                </h4>
                <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-mono text-[#BC5A36] font-bold uppercase bg-white px-2 py-0.5 rounded">
                  <span>Explore</span>
                  <ArrowUpRight size={10} />
                </span>
              </div>

              {/* Minimal Code Label in Corner when not hovered */}
              {!isHovered && !item.isFeatured && (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#2D231E]/70 text-[8px] font-mono text-white rounded">
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
