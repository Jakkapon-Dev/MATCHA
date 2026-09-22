// A blank origin uses Vite's /api proxy. Deployed builds use the configured API.
export const API_ORIGIN = (import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '');
export const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

// Keep catalogue paths unchanged for editing/saving; resolve only when rendering.
export function mediaSrc(src) {
  return typeof src === 'string' && src.startsWith('/api/media/files/')
    ? `${API_ORIGIN}${src}` : src;
}
