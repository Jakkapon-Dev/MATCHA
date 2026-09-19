import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

/**
 * ReactVibe-inspired BrandLoop:
 * Smooth continuous infinite ticker with edge mask fade.
 */
export default function BrandLoop() {
  const { t } = useLanguage();
  const items = t('loop');

  return (
    <div className="relative w-full overflow-hidden bg-matcha-text py-4 border-y border-[#3D312A] select-none">
      
      {/* Left and Right Edge Fade Masks */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-matcha-text to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-matcha-text to-transparent z-10" />

      {/* Repeating the same sequence three times lets the CSS marquee loop without a visible gap. */}
      <div className="flex w-max animate-marquee space-x-8 font-mono text-xs sm:text-sm font-bold tracking-[0.25em] uppercase text-matcha-secondary">
        {[...items, ...items, ...items].map((text, idx) => (
          <div key={idx} className="flex items-center gap-6">
            <span className={idx % 2 === 0 ? 'text-matcha-bg' : 'text-matcha-accent'}>
              {text}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
