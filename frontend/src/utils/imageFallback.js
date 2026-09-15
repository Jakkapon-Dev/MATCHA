import { mediaSrc } from '../services/apiConfig';
// Standard High-Quality MatchA Image Fallback Placeholder (Minimalist Artisan Garment)
export const DEFAULT_PRODUCT_FALLBACK = '/images/products/autumn/tops/jackets/color_1_brown.jpeg';

const RASTER = /\.(jpe?g|png)$/i;

// Point a local image path at its WebP twin, which scripts/convert-images.sh
// writes beside every source. Remote URLs and anything already converted are
// returned untouched.
export const webpSrc = (src) => {
  if (typeof src !== 'string' || !src.startsWith('/images/')) return mediaSrc(src);
  return RASTER.test(src) ? src.replace(RASTER, '.webp') : src;
};

// Step back one rung at a time: a missing .webp falls back to the original file
// it was made from, and only a genuinely missing image reaches the placeholder.
// That way a half-converted image set degrades in quality rather than breaking.
export const handleImageError = (e, fallback = DEFAULT_PRODUCT_FALLBACK) => {
  const img = e?.target;
  if (!img) return;

  const original = mediaSrc(img.dataset?.originalSrc);
  if (original && img.src !== original && !img.src.endsWith(original)) {
    img.src = original;
    return;
  }

  if (img.src !== fallback) {
    img.onerror = null; // Prevent infinite loop if fallback fails
    img.src = fallback;
  }
};
