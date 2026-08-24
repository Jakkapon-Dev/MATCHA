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
      positionClass: "top-[10%] left-[6%]", // 👈 ปรับตำแหน่งใบที่ 1 (บนซ้าย)
    },
    {
      id: 2,
      category: "Oversized Tees",
      count: "82 Tees",
      code: "FIT-02",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_striped_tee_001.jpg",
      positionClass: "top-[42%] left-[14%]", // 👈 ปรับตำแหน่งใบที่ 2 (กลางซ้าย)
      isFeatured: true,
    },
    {
      id: 3,
      category: "Baggy Denim",
      count: "58 Fits",
      code: "FIT-03",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_minimal_tee_001.jpg",
      positionClass: "bottom-[8%] left-[22%]", // 👈 ปรับตำแหน่งใบที่ 3 (ล่างซ้าย)
    },

    // --- ฝั่งขวา (3 ใบ) ---
    {
      id: 4,
      category: "Statement Sweats",
      count: "46 Looks",
      code: "FIT-04",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_crew_001.jpg",
      positionClass: "top-[10%] right-[6%]", // 👈 ปรับตำแหน่งใบที่ 4 (บนขวา)
    },
    {
      id: 5,
      category: "Tailored Suits",
      count: "29 Tailored",
      code: "FIT-05",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_green_suit_001.jpeg",
      positionClass: "top-[42%] right-[14%]", // 👈 ปรับตำแหน่งใบที่ 5 (กลางขวา)
    },
    {
      id: 6,
      category: "Utility Outerwear",
      count: "64 Bottoms",
      code: "FIT-06",
      image:
        "/images/studio_white_bg/standing_straight/autumn/studio_straight_autumn_matcha_hoodie_terracotta_001.jpg",
      positionClass: "bottom-[8%] right-[22%]", // 👈 ปรับตำแหน่งใบที่ 6 (ล่างขวา)
    },
  ];

  return (
    <section className="relative w-full min-h-[920px] lg:min-h-screen bg-white overflow-hidden select-none flex items-center justify-center border-b border-[#D9D3C7] py-12">
      
      {/* 1. Full-Bleed Center Model Canvas (เลเยอร์รูปภาพหลัก) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <img
          src="/images/studio_white_bg/standing_straight/spring/studio_straight_spring_nude_beige_wide_banner_2k_001.jpeg"
          alt="MatchA Choose Your Fit"
          className="w-full h-full object-cover sm:object-contain object-center opacity-95 transition-opacity"
        />
      </div>

      {/* 2. Independent Title & Badge: ปรับตำแหน่งอิสระได้ที่นี่โดยตรง (ไม่มี sm: หรือ lg: มาขัดขวาง) */}
      <div className="absolute top-35 left-[33%] z-30 pointer-events-none">
        <div className="bg-black text-white px-5 py-2 sm:px-8 sm:py-2.5 text-base sm:text-2xl lg:text-3xl font-extrabold font-sans tracking-tight uppercase shadow-xl inline-block">
          Choose Your Fit
        </div>
        <p className="text-[10px] sm:text-xs font-mono text-[#6B5E55] tracking-[0.25em] uppercase mt-1.5 font-bold">
          SIGNATURE SILHOUETTES & FIT GUIDE
        </p>
      </div>

      {/* 3. Floating Cards Layer (เลเยอร์การ์ดแยกต่างหากอย่างอิสระ) */}
      <div className="relative w-full max-w-[1700px] mx-auto h-[860px] sm:h-[920px] lg:h-[980px] px-4 sm:px-8 z-10 pointer-events-auto">
        {fitItems.map((item) => {
          const isHovered = hoveredCard === item.id;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onSelectFit && onSelectFit(item)}
              className={`absolute ${item.positionClass} w-28 sm:w-36 lg:w-44 xl:w-48 aspect-[3/4] z-20 cursor-pointer transition-all duration-300 transform ${
                isHovered
                  ? "scale-110 z-40 shadow-2xl -translate-y-1 ring-2 ring-black"
                  : "shadow-md hover:shadow-xl"
              } overflow-hidden bg-transparent border-0`}
            >
              {/* Outfit Photo */}
              <img
                src={item.image}
                alt={item.category}
                className="w-full h-full object-cover object-top transition-transform duration-500"
              />

              {/* Dark Hover Tint Overlay */}
              <div
                className={`absolute inset-0 bg-black/80 backdrop-blur-[2px] transition-opacity duration-300 flex flex-col items-center justify-center p-2.5 text-center ${
                  item.isFeatured && !isHovered
                    ? "opacity-85"
                    : isHovered
                      ? "opacity-90"
                      : "opacity-0 hover:opacity-90"
                }`}
              >
                <span className="text-[9px] sm:text-[10px] font-mono text-[#D0DEC6] tracking-wider uppercase font-bold">
                  {item.count}
                </span>
                <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-tight mt-0.5 leading-tight">
                  {item.category}
                </h4>
                <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-mono text-[#2D231E] font-bold uppercase bg-white px-2 py-0.5 rounded shadow-sm">
                  <span>Explore Fit</span>
                  <ArrowUpRight size={10} />
                </span>
              </div>

              {/* Code Label in Top Left Corner */}
              {!isHovered && !item.isFeatured && (
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/75 text-[8px] sm:text-[9px] font-mono text-white font-bold shadow-sm">
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
