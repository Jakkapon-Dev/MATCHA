// Send a copy of the product photo arcing into the cart icon, so an add reads
// as something arriving somewhere rather than a number quietly changing.
// Purely decorative: every failure path returns without touching the page.
export function flyToCart(sourceEl) {
  if (typeof document === 'undefined' || !sourceEl) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const image = sourceEl.tagName === 'IMG' ? sourceEl : sourceEl.querySelector('img');
  const target = document.querySelector('[data-cart-target]');
  if (!image || !target) return;

  const from = image.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !to.width) return;

  const clone = image.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  Object.assign(clone.style, {
    position: 'fixed',
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: '0',
    objectFit: 'cover',
    borderRadius: '18px',
    boxShadow: '0 18px 40px rgba(45, 35, 30, 0.28)',
    pointerEvents: 'none',
    zIndex: '9999',
  });
  document.body.appendChild(clone);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  const duration = 760;
  const flight = clone.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.3 - 70}px) scale(0.55)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(0.1)`, opacity: 0.2 },
  ], { duration, easing: 'cubic-bezier(0.35, 0, 0.2, 1)' });

  // A backgrounded tab pauses the animation, so onfinish may never arrive and
  // the clone would sit on the page. The timer sweeps it up either way.
  const sweep = setTimeout(() => clone.remove(), duration + 400);
  const cleanup = () => {
    clearTimeout(sweep);
    clone.remove();
  };
  flight.onfinish = cleanup;
  flight.oncancel = cleanup;
}
