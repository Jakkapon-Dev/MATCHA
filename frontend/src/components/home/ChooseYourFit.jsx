import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Parallax, Reveal } from '../motion';
import { webpSrc, handleImageError } from '../../utils/imageFallback';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function ChooseYourFit({ onSelectFit }) {
  const { t } = useLanguage();
  // Hover state controls the raised card and its overlay; selection is delegated to
  // the parent so it can translate a fit card into catalog navigation/filtering.
  const [hoveredCard, setHoveredCard] = useState(null);

  // 6 Uniform Large Fit Cards spread widely across the left and right quadrants (ZERO overlap)
  // `code` keys the translated category/count copy; `catalogCategory` is the catalog
  // filter this card opens, kept as data so it survives translation.
  const fitItems = [
    // --- ฝั่งซ้าย (3 ใบ: เรียงเฉียงสับหว่างเข้าหาศูนย์กลางอย่างมีระยะปลอดภัย) ---
    {
      id: 1,
      code: "FIT-01",
      catalogCategory: "Tops",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_coral_polo_shirt_001.jpeg",
      positionClass: "top-[10%] left-[3%] sm:left-[5%] lg:left-[6%]",
    },
    {
      id: 2,
      code: "FIT-02",
      catalogCategory: "Tops",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_striped_tee_001.jpg",
      positionClass: "top-[40%] left-[7%] sm:left-[9%] lg:left-[11%]",
    },
    {
      id: 3,
      code: "FIT-03",
      catalogCategory: "Bottoms",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_minimal_tee_001.jpg",
      positionClass: "bottom-[8%] left-[11%] sm:left-[13%] lg:left-[15%]",
    },

    // --- ฝั่งขวา (3 ใบ: เรียงเฉียงสับหว่างเข้าหาศูนย์กลางอย่างมีระยะปลอดภัย) ---
    {
      id: 4,
      code: "FIT-04",
      catalogCategory: "Tops",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_matcha_crew_001.jpg",
      positionClass: "top-[10%] right-[3%] sm:right-[5%] lg:right-[6%]",
    },
    {
      id: 5,
      code: "FIT-05",
      catalogCategory: "Bottoms",
      image:
        "/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_green_suit_001.jpeg",
      positionClass: "top-[40%] right-[7%] sm:right-[9%] lg:right-[11%]",
    },
    {
      id: 6,
      code: "FIT-06",
      catalogCategory: "Outerwear",
      image:
        "/images/studio_white_bg/standing_straight/autumn/studio_straight_autumn_matcha_hoodie_terracotta_001.jpg",
      positionClass: "bottom-[8%] right-[11%] sm:right-[13%] lg:right-[15%]",
    },
  ];

  return (
    <section className="relative w-full min-h-240 lg:min-h-screen bg-white overflow-hidden select-none flex items-center justify-center border-b border-[#DCDCDC] py-12">
      {/* 1. Full-Bleed Center Model Canvas (เห็นครบทั้งตัว 100% ไม่ขาด)
          รูปแบนเนอร์อยู่ชั้นหลังสุด จึงเลื่อนช้าที่สุดในหน้านี้ */}
      <Parallax
        distance={40}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 flex items-center justify-center p-2 sm:p-6"
        innerClassName="w-full h-full"
      >
        <img
          src={webpSrc("/images/studio_white_bg/standing_straight/spring/studio_straight_spring_nude_beige_wide_banner_2k_001.jpeg")}
          data-original-src="/images/studio_white_bg/standing_straight/spring/studio_straight_spring_nude_beige_wide_banner_2k_001.jpeg"
          onError={handleImageError}
          loading="lazy"
          decoding="async"
          alt={t('fit.bannerAlt')}
          className="w-full h-full object-contain object-center opacity-100"
        />
      </Parallax>

      {/* 2. Independent Title & Badge: จัดกึ่งกลางเหนือศีรษะนางแบบอย่างสง่างาม */}
      <Reveal x={0} y={-20} duration={0.8} amount={0.1} className="absolute top-8 sm:top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center">
        <div className="bg-[#0A0A0A] px-5 py-2 sm:px-8 sm:py-2.5 text-base sm:text-2xl lg:text-3xl font-extrabold font-sans tracking-tight uppercase inline-block border-l-4 border-[#C91D1D] shadow-xl">
          <span className="animate-text-shimmer-light inline-block">
            {t('fit.title')}
          </span>
        </div>
        <p className="text-[10px] sm:text-xs font-mono text-[#C91D1D] tracking-[0.25em] uppercase mt-1.5 font-bold">
          {t('fit.subtitle')}
        </p>
      </Reveal>

      {/* 3. Floating Cards Layer (แอนิเมชันลอย 3 มิติ Ambient Floating) */}
      <div className="relative w-full max-w-[1700px] mx-auto h-215 sm:h-230 lg:h-245 px-5 sm:px-8 z-10 pointer-events-auto">
        {fitItems.map((item, index) => {
          // Only one card can receive the elevated hover treatment at a time.
          const isHovered = hoveredCard === item.id;
          const copy = t(`fit.items.${item.code}`);

          return (
            // การ์ดสลับกันเลื่อนเร็ว/ช้า ใบคี่กับใบคู่จึงแยกชั้นความลึกออกจากกัน
            // แทนที่จะลอยขึ้นมาพร้อมกันทั้งแถบ
            //
            // z-index ตอน hover ต้องอยู่ที่กล่องนอกสุด เพราะ z-index บนกล่องนอก
            // สร้าง stacking context ใหม่ — ถ้าไปใส่ที่ตัวการ์ดข้างใน มันจะยกตัวเอง
            // ขึ้นเหนือการ์ดใบอื่นไม่ได้
            <Parallax
              key={item.id}
              distance={index % 2 === 0 ? 28 : 48}
              style={{ zIndex: isHovered ? 40 : 20 }}
              className={`absolute ${item.positionClass} w-32 sm:w-40 md:w-48 lg:w-52 xl:w-56 aspect-3/4`}
              innerClassName="w-full h-full"
            >
            <Reveal y={38} scale={0.92} delay={index * 0.07} amount={0.1} className="w-full h-full">
            <div
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onSelectFit && onSelectFit(item)}
              className={`relative w-full h-full cursor-pointer transition-all duration-300 transform ${
                isHovered
                  ? "scale-105 -translate-y-1.5 ring-2 ring-[#C91D1D]"
                  : ""
              } overflow-hidden bg-transparent border-0`}
            >
              {/* Outfit Photo */}
              <img
                src={webpSrc(item.image)} data-original-src={item.image}
                alt={copy.category}
                className="w-full h-full object-cover object-top transition-transform duration-500"
              />

              {/* Dark Hover Tint Overlay (คุมโทนสี MatchA Espresso & Terracotta) */}
              <div
                className={`absolute inset-0 bg-[#000000]/90 backdrop-blur-[2px] transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center ${
                  isHovered ? "opacity-95" : "opacity-0"
                }`}
              >
                <span className="text-[10px] sm:text-xs font-mono text-[#518F5C] tracking-wider uppercase font-bold">
                  {copy.count}
                </span>
                <h4 className="text-xs sm:text-base font-extrabold text-[#F1F1F1] uppercase tracking-tight mt-1 leading-tight">
                  {copy.category}
                </h4>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-mono text-white uppercase tracking-wider bg-[#C91D1D] px-3 py-1 transition-colors">
                  <span>{t('fit.explore')}</span>
                  <ArrowUpRight size={11} />
                </span>
              </div>

              {/* Code Label in Top Left Corner */}
              {!isHovered && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#0A0A0A]/90 text-[9px] sm:text-[10px] font-mono text-[#518F5C] tracking-wider">
                  {item.code}
                </div>
              )}
            </div>
            </Reveal>
            </Parallax>
          );
        })}
      </div>
    </section>
  );
}
