// Standard High-Quality MatchA Image Fallback Placeholder
export const DEFAULT_PRODUCT_FALLBACK = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';

export const handleImageError = (e, fallback = DEFAULT_PRODUCT_FALLBACK) => {
  if (e?.target && e.target.src !== fallback) {
    e.target.onerror = null; // Prevent infinite loop if fallback fails
    e.target.src = fallback;
  }
};
