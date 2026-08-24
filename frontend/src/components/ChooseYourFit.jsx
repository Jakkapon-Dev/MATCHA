import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export default function ChooseYourFit({ onSelectFit }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  // 6 Uniform Large Fit Cards spread widely across the left and right quadrants (ZERO overlap)
  const fitItems = [
    // --- ฝั่งซ้าย (3 ใบ) ---
    {
      id: 1,
      category: "Tanks & Polos",
      count: "34 Items",
      code: "FIT-01",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_coral_polo_shirt_001.jpeg",
      positionClass: "top-[8%] left-[4%]",
    },
    {
      id: 2,
      category: "Oversized Tees",
      count: "82 Tees",
      code: "FIT-02",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_striped_tee_001.jpg",
      positionClass: "top-[40%] left-[12%]",
    },
    {
      id: 3,
      category: "Baggy Denim",
      count: "58 Fits",
      code: "FIT-03",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_minimal_tee_001.jpg",
      positionClass: "bottom-[6%] left-[20%]",
    },

    // --- ฝั่งขวา (3 ใบ) ---
    {
      id: 4,
      category: "Statement Sweats",
      count: "46 Looks",
      code: "FIT-04",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_crew_001.jpg",
      positionClass: "top-[8%] right-[4%]",
    },
    {
      id: 5,
      category: "Tailored Suits",
      count: "29 Tailored",
      code: "FIT-05",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_green_suit_001.jpeg",
      positionClass: "top-[40%] right-[12%]",
    },
    {
      id: 6,
      category: "Utility Outerwear",
      count: "64 Bottoms",
      code: "FIT-06",
      image:
        "/images/studio_white_bg/standing_straight/autumn/studio_straight_autumn_matcha_hoodie_terracotta_001.jpg",
      positionClass: "bottom-[6%] right-[20%]",
    },
  ];

  return (
    <section className="relative w-full min-h-[960px] lg:min-h-screen bg-white overflow-hidden select-none flex items-center justify-center border-b border-[#D9D3C7] py-12">
      {/* 1. Full-Bleed Center Model Canvas (เต็มจอ 100% เป็นพื้นหลังเต็มๆ) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <img
          src="/images/studio_white_bg/standing_straight/spring/studio_straight_spring_nude_beige_wide_banner_2k_001.jpeg"
          alt="MatchA Choose Your Fit"
          className="w-full h-full object-cover object-center opacity-100"
        />
      </div>

      {/* 2. Independent Title & Badge: ปรับตำแหน่งอิสระได้ที่นี่โดยตรง */}
      <div className="absolute top-12 left-[24%] z-30 pointer-events-none">
        <div className="bg-black text-white px-5 py-2 sm:px-8 sm:py-2.5 text-base sm:text-2xl lg:text-3xl font-extrabold font-sans tracking-tight uppercase shadow-xl inline-block">
          Choose Your Fit
        </div>
        <p className="text-[10px] sm:text-xs font-mono text-[#6B5E55] tracking-[0.25em] uppercase mt-1.5 font-bold">
          SIGNATURE SILHOUETTES & FIT GUIDE
        </p>
      </div>

      {/* 3. Floating Cards Layer (ขนาดใหญ่ขึ้น สวยงามเท่ากันทุกใบ) */}
      <div className="relative w-full max-w-[1700px] mx-auto h-[860px] sm:h-[920px] lg:h-[980px] px-4 sm:px-8 z-10 pointer-events-auto">
        {fitItems.map((item) => {
          const isHovered = hoveredCard === item.id;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onSelectFit && onSelectFit(item)}
              className={`absolute ${item.positionClass} w-36 sm:w-48 lg:w-56 xl:w-60 aspect-[3/4] z-20 cursor-pointer transition-all duration-300 transform ${
                isHovered
                  ? "scale-108 z-40 shadow-2xl -translate-y-1.5 ring-2 ring-black"
                  : "shadow-md hover:shadow-xl"
              } overflow-hidden bg-transparent border-0`}
            >
              {/* Outfit Photo */}
              <img
                src={item.image}
                alt={item.category}
                className="w-full h-full object-cover object-top transition-transform duration-500"
              />

              {/* Dark Hover Tint Overlay (แสดงเมื่อ Hover เมาส์) */}
              <div
                className={`absolute inset-0 bg-black/80 backdrop-blur-[2px] transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center ${
                  isHovered ? "opacity-95" : "opacity-0"
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
              {!isHovered && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 text-[9px] sm:text-[10px] font-mono text-white font-bold shadow-sm">
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
