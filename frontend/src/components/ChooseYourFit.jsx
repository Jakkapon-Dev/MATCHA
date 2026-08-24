import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function ChooseYourFit({ onSelectFit }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  // All 6 Signature Fit Cards combined into the main Choose Your Fit Canvas
  const allFits = [
    // Top Row: Tops & Sweats
    {
      id: 1,
      category: 'Tanks & Polos',
      count: '34 Items',
      code: 'FIT-01',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_coral_polo_shirt_001.jpeg',
      positionClass: 'top-[16%] left-[4%] sm:left-[8%] lg:left-[10%]',
      sizeClass: 'w-24 sm:w-36 lg:w-44 aspect-[3/4]',
    },
    {
      id: 2,
      category: 'Oversized Tees',
      count: '82 Tees',
      code: 'FIT-02',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_striped_tee_001.jpg',
      positionClass: 'top-[20%] left-[38%] sm:left-[41%] lg:left-[43%]',
      sizeClass: 'w-28 sm:w-40 lg:w-52 aspect-[3/4]',
      isFeatured: true,
    },
    {
      id: 3,
      category: 'Statement Sweats',
      count: '46 Looks',
      code: 'FIT-03',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_crew_001.jpg',
      positionClass: 'top-[16%] right-[4%] sm:right-[8%] lg:right-[10%]',
      sizeClass: 'w-24 sm:w-36 lg:w-44 aspect-[3/4]',
    },

    // Bottom Row: Denim, Tailored & Cargo
    {
      id: 4,
      category: 'Baggy Denim',
      count: '58 Fits',
      code: 'FIT-04',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_minimal_tee_001.jpg',
      positionClass: 'bottom-[8%] left-[6%] sm:left-[10%] lg:left-[14%]',
      sizeClass: 'w-24 sm:w-36 lg:w-44 aspect-[3/4]',
    },
    {
      id: 5,
      category: 'Tailored Suits',
      count: '29 Tailored',
      code: 'FIT-05',
      image: '/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_green_suit_001.jpeg',
      positionClass: 'bottom-[6%] left-[39%] sm:left-[42%] lg:left-[44%]',
      sizeClass: 'w-26 sm:w-38 lg:w-48 aspect-[3/4]',
    },
    {
      id: 6,
      category: 'Utility Cargo',
      count: '64 Bottoms',
      code: 'FIT-06',
      image: '/images/studio_white_bg/standing_straight/autumn/studio_straight_autumn_matcha_hoodie_terracotta_001.jpg',
      positionClass: 'bottom-[8%] right-[6%] sm:right-[10%] lg:right-[14%]',
      sizeClass: 'w-24 sm:w-36 lg:w-44 aspect-[3/4]',
    },
  ];

  return (
    <section className="relative w-full bg-[#FAF8F5] text-[#2D231E] border-b border-[#D9D3C7] overflow-hidden select-none py-10 sm:py-16">
      
      {/* Main Large Canvas Stage (ครึ่งตัวบน-กลางตัว พร้อมการ์ดทั้ง 6 ใบ) */}
      <div className="relative max-w-6xl mx-auto w-full h-[680px] sm:h-[820px] lg:h-[950px] flex items-center justify-center rounded-3xl overflow-hidden bg-white border border-[#2D231E]/15 shadow-2xl">
        
        {/* Background Canvas: Female Nude Model (ครึ่งตัวถึงช่วงเอวเด่นชัดเต็มเฟรม) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/images/studio_white_bg/standing_straight/spring/studio_straight_spring_nude_beige_tank_tailored_pants_001.jpeg"
            alt="MatchA Fit Canvas"
            className="w-full h-full object-cover sm:object-contain object-top opacity-95 transition-opacity"
          />
        </div>

        {/* Iconic Header Badge: [Choose Your Fit] centered over the head */}
        <div className="absolute top-[8%] sm:top-[10%] left-1/2 transform -translate-x-1/2 z-30 pointer-events-none text-center">
          <div className="bg-[#2D231E] text-[#FAF8F5] px-6 py-2 sm:px-10 sm:py-3 text-xl sm:text-3xl lg:text-4xl font-extrabold font-sans tracking-tight uppercase shadow-2xl inline-block">
            Choose Your Fit
          </div>
          <p className="text-[10px] sm:text-xs font-mono text-[#6B5E55] tracking-[0.2em] uppercase mt-2 font-bold">
            SIGNATURE SILHOUETTES & APPAREL FITS
          </p>
        </div>

        {/* 6 Floating Full-Body Outfit Cards (Tops, Denim, Tailored & Cargo) */}
        {allFits.map((item) => {
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
              {/* Outfit Photo */}
              <img
                src={item.image}
                alt={item.category}
                className="w-full h-full object-cover object-top transition-transform duration-500"
              />

              {/* Dark Hover Tint Overlay with Category Text & Item Count */}
              <div
                className={`absolute inset-0 bg-[#2D231E]/85 backdrop-blur-[2px] transition-opacity duration-300 flex flex-col items-center justify-center p-2.5 text-center ${
                  item.isFeatured || isHovered ? 'opacity-90' : 'opacity-0 hover:opacity-90'
                }`}
              >
                <span className="text-[9px] sm:text-xs font-mono text-[#D0DEC6] tracking-wider uppercase font-bold">
                  {item.count}
                </span>
                <h4 className="text-xs sm:text-base font-extrabold text-[#FAF8F5] uppercase tracking-tight mt-0.5 leading-tight">
                  {item.category}
                </h4>
                <span className="mt-2 inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-[#BC5A36] font-bold uppercase bg-white px-2.5 py-0.5 rounded shadow-sm">
                  <span>Explore Fit</span>
                  <ArrowUpRight size={11} />
                </span>
              </div>

              {/* Minimal Code Label in Corner when not hovered */}
              {!isHovered && !item.isFeatured && (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#2D231E]/80 text-[8px] sm:text-[9px] font-mono text-white rounded font-bold">
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
