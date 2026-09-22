/* The public storefront URL used in links sent by the backend.

   FRONTEND_URL is the explicit setting. CORS_ORIGINS is a safe fallback for
   deployments that already configured the browser allowlist but forgot to
   duplicate the same URL in a second variable. Wildcard CORS entries are not
   valid destinations for a customer-facing link, so they are ignored. */
export function getFrontendUrl(env = process.env) {
  const explicit = String(env.FRONTEND_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const configuredOrigin = String(env.CORS_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .find(value => value && !value.includes('*'));

  return (configuredOrigin || 'http://localhost:5173').replace(/\/+$/, '');
}

export default getFrontendUrl;
