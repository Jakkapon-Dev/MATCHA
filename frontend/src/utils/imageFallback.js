import { mediaSrc } from '../services/apiConfig';

// Standard High-Quality MatchA Image Fallback Placeholder (Minimalist Artisan Garment)
export const DEFAULT_PRODUCT_FALLBACK = '/images/products/autumn/tops/jackets/color_1_brown.jpeg';

// Self-contained, zero-network SVG fallback that never fails even during offline / total asset outages
export const FALLBACK_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="%23F6F6F4"/><path d="M280 340 L400 300 L520 340 L500 700 L300 700 Z" stroke="%232D5A27" stroke-width="12" fill="none" stroke-linejoin="round" opacity="0.45"/><circle cx="400" cy="460" r="50" fill="%232D5A27" opacity="0.25"/><text x="400" y="770" font-family="monospace" font-size="22" font-weight="bold" fill="%230A0A0A" text-anchor="middle" letter-spacing="4">MATCHA ARCHIVE</text><text x="400" y="805" font-family="monospace" font-size="14" fill="%23888888" text-anchor="middle" letter-spacing="2">IMAGE UNAVAILABLE</text></svg>';

const RASTER = /\.(jpe?g|png)$/i;

// Point a local image path at its WebP twin, which scripts/convert-images.sh
// writes beside every source. Remote URLs and anything already converted are
// returned untouched.
export const webpSrc = (src) => {
  if (typeof src !== 'string' || !src.startsWith('/images/')) return mediaSrc(src);
  return RASTER.test(src) ? src.replace(RASTER, '.webp') : src;
};

// Step back one rung at a time: a missing .webp falls back to the original file
// it was made from, then to the default placeholder image, and finally to the
// self-contained SVG fallback so a broken image icon is never shown.
export const handleImageError = (e, fallback = DEFAULT_PRODUCT_FALLBACK) => {
  const img = e?.target;
  if (!img) return;

  const original = mediaSrc(img.dataset?.originalSrc);
  // 1. If WebP failed, try the original file format
  if (original && img.src !== original && !img.src.endsWith(original)) {
    img.src = original;
    return;
  }

  // 2. If original also failed, try the static fallback product photo
  if (img.src !== fallback && !img.src.endsWith(fallback)) {
    img.onerror = () => {
      // 3. If fallback asset fails (offline or deleted), degrade to inline SVG
      img.onerror = null;
      img.src = FALLBACK_SVG;
    };
    img.src = fallback;
    return;
  }

  // 3. Fallback already failed, use inline SVG
  img.onerror = null;
  img.src = FALLBACK_SVG;
};
