/* Every look draws its own garment pins.
 *
 * The API returned hotspots for all six looks, but only the cover photograph
 * rendered any — the other spreads drew a bare image — so the lookbook looked
 * shoppable on one photo and inert on the rest. These tests feed three looks
 * with pins and require each photograph to carry its own. */

import React from 'react';
import { describe, test, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(cleanup);

const mockAddToCart = vi.fn();
vi.mock('../context/LanguageContext.jsx', async () => {
  const { translations } = await import('../i18n/translations');
  const resolve = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  return {
    useLanguage: () => ({
      lang: 'en',
      t: (key, vars) => {
        const value = resolve(translations.en, key) ?? key;
        return typeof value === 'string' && vars ? value.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : value;
      }
    })
  };
});
vi.mock('../context/CartContext.jsx', () => ({ useCart: () => ({ addToCart: mockAddToCart }) }));
vi.mock('../context/ToastContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../components/product/ProductModal', () => ({
  default: ({ product }) => <div role="dialog" aria-label="product modal">{product.name}</div>
}));

const pin = (look, n, overrides = {}) => ({
  id: `HS-${look}-${n}`, productId: `${look}-P${n}`, title: `${look} garment ${n}`, name: `${look} garment ${n}`,
  price: 40 + n, category: 'Tops', image: '/images/p.jpg', x: `${30 + n * 10}%`, y: `${40 + n * 5}%`,
  inStock: true, linked: true, sizes: ['S', 'M'], variants: [], ...overrides
});
const look = (id, season, hotspots) => ({
  id, title: `Look ${id}`, season, heroImage: `/images/${id}.jpg`, photographer: 'Studio', location: 'Tokyo',
  palette: [], hotspots, shoppableItems: hotspots.map(h => ({ ...h, id: h.productId }))
});

const mockLooks = [
  look('L1', 'Autumn', [pin('L1', 0), pin('L1', 1)]),
  look('L2', 'Spring', [pin('L2', 0), pin('L2', 1), pin('L2', 2)]),
  // A pin whose product has since been removed: the API marks it unlinked.
  look('L3', 'Spring', [pin('L3', 0, { linked: false, inStock: false, price: 0, title: 'สินค้ายังไม่พร้อม', sizes: [] })])
];

vi.mock('../features/media/useLookbooks', () => ({
  default: () => ({ looks: mockLooks, loading: false, error: '', retry: vi.fn() })
}));

const { default: EditorialLookbookPage } = await import('./EditorialLookbookPage');
const { default: useCoverCoordinates } = await import('../features/media/useCoverCoordinates');

const renderPage = () => render(<MemoryRouter><EditorialLookbookPage /></MemoryRouter>);
const pinsFor = (title) => screen.queryAllByRole('button', { name: new RegExp(`${title}`) })
  .filter(b => b.getAttribute('aria-pressed') !== null);

describe('lookbook hotspots', () => {
  test('the cover and every other spread render their own pins', () => {
    renderPage();
    expect(pinsFor('L1 garment')).toHaveLength(2);
    expect(pinsFor('L2 garment')).toHaveLength(3);
    expect(pinsFor('สินค้ายังไม่พร้อม')).toHaveLength(1);
  });

  test('pins keep their relative coordinates', () => {
    renderPage();
    const [first] = pinsFor('L2 garment 0');
    // Before the image has been measured the authored percentages are used as-is.
    expect(first.parentElement.style.left).toBe('30%');
    expect(first.parentElement.style.top).toBe('40%');
  });

  test('a spread pin opens its garment card and routes Add to Bag through the product flow', () => {
    renderPage();
    const [target] = pinsFor('L2 garment 1');
    fireEvent.click(target);
    expect(target.getAttribute('aria-pressed')).toBe('true');
    const card = target.parentElement;
    expect(within(card).getByText('$41.00')).toBeTruthy();
    fireEvent.click(within(card).getByRole('button', { name: /add to bag/i }));
    // Two sizes, so the product modal opens to ask which one.
    expect(screen.getByRole('dialog', { name: 'product modal' }).textContent).toBe('L2 garment 1');
    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  test('a pin whose product no longer exists shows as unavailable instead of breaking', () => {
    renderPage();
    const [orphan] = pinsFor('สินค้ายังไม่พร้อม');
    fireEvent.click(orphan);
    const button = within(orphan.parentElement).getByRole('button', { name: /unavailable/i });
    expect(button.disabled).toBe(true);
  });

  test('opening a pin on one spread does not open the same pin elsewhere', () => {
    renderPage();
    fireEvent.click(pinsFor('L2 garment 0')[0]);
    const pressed = screen.getAllByRole('button').filter(b => b.getAttribute('aria-pressed') === 'true' && /garment/.test(b.getAttribute('aria-label') || ''));
    expect(pressed).toHaveLength(1);
  });
});

describe('object-fit: cover compensation', () => {
  test('a pin is moved by what the crop removed, so it stays on its garment', () => {
    const dims = { clientWidth: 400, clientHeight: 400, naturalWidth: 800, naturalHeight: 1200 };
    const saved = Object.keys(dims).map(k => [k, Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, k)]);
    for (const [k, v] of Object.entries(dims)) Object.defineProperty(HTMLImageElement.prototype, k, { configurable: true, get: () => v });
    try {
      function Probe() {
        const { imageRef, position } = useCoverCoordinates('/a.jpg', { x: 0.5, y: 0.5 });
        const p = position({ x: '50%', y: '25%' });
        return <img ref={imageRef} alt="probe" data-left={p.left} data-top={p.top} />;
      }
      render(<Probe />);
      const img = screen.getByAltText('probe');
      // Portrait 800x1200 covered into 400x400 scales to 400x600 and crops
      // 100px top and bottom: 25% of 600 = 150, minus 100 = 50 of 400 = 12.5%.
      expect(img.dataset.left).toBe('50%');
      expect(img.dataset.top).toBe('12.5%');
    } finally {
      for (const [k, d] of saved) d ? Object.defineProperty(HTMLImageElement.prototype, k, d) : delete HTMLImageElement.prototype[k];
    }
  });
});
