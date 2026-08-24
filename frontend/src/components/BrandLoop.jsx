import React from 'react';

/**
 * ReactVibe-inspired BrandLoop:
 * Smooth continuous infinite ticker with edge mask fade.
 */
export default function BrandLoop() {
  const items = [
    '✦ MATCHA APPAREL',
    'TOKYO // PARIS',
    '✦ ARTISAN STREETWEAR',
    'LIMITED DROP 2026',
    '✦ ORGANIC JAPANESE COTTON',
    'PERSONAL COLOR FORMULAS',
    '✦ 100% SUSTAINABLE TEXTURES',
    'HAUTE ARCHIVE PIECES',
  ];

  return (
    <div className="relative w-full overflow-hidden bg-[#2D231E] py-4 border-y border-[#3D312A] select-none">
      
      {/* Left and Right Edge Fade Masks */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-[#2D231E] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-[#2D231E] to-transparent z-10" />

      {/* Infinite Scrolling Ticker Track */}
      <div className="flex w-max animate-marquee space-x-8 font-mono text-xs sm:text-sm font-bold tracking-[0.25em] uppercase text-[#D0DEC6]">
        {[...items, ...items, ...items].map((text, idx) => (
          <div key={idx} className="flex items-center gap-6">
            <span className={idx % 2 === 0 ? 'text-[#FAF8F5]' : 'text-[#BC5A36]'}>
              {text}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
