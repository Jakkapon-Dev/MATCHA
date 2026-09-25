/* The look's full-spread view is a real gallery.
 *
 * Its thumbnails used to be plain <div>s with no handler, and the main
 * photograph always read `heroImage`, so they looked clickable and did
 * nothing. The cover and the close-ups are now one list the thumbnails, the
 * arrows, the keyboard and the counter all step through, and opening another
 * look always starts on its cover. */
import React from 'react';
import { describe, test, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});

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

const item = (id, extra = {}) => ({
  id, productId: id, name: `Garment ${id}`, title: `Garment ${id}`, price: 50, category: 'Tops', image: `/images/${id}.jpg`,
  inStock: true, linked: true, sizes: ['M'], variants: [], x: '40%', y: '40%', ...extra
});
const look = (id, detailImages, items, extra = {}) => ({
  id, title: `Look ${id}`, season: 'Autumn', heroImage: `/images/${id}-cover.jpg`, detailImages,
  photographer: 'Studio', location: 'Tokyo', palette: [], leadQuote: 'A quote', theme: 'Theme',
  hotspots: items.map((i, n) => ({ ...i, id: `HS-${id}-${n}` })), shoppableItems: items, ...extra
});

let mockLooks;
vi.mock('../features/media/useLookbooks', () => ({
  default: () => ({ looks: mockLooks, loading: false, error: '', retry: vi.fn() })
}));

const { default: EditorialLookbookPage, lookGallery } = await import('./EditorialLookbookPage');

function Where() { return <div data-testid="where">{useLocation().pathname}</div>; }
const renderPage = () => render(
  <MemoryRouter initialEntries={['/lookbook']}>
    <Routes>
      <Route path="/lookbook" element={<EditorialLookbookPage />} />
      <Route path="/mix-match" element={<Where />} />
    </Routes>
  </MemoryRouter>
);
const spreadDialog = () => screen.getByRole('dialog', { name: /full spread/ });
const mainImage = () => within(spreadDialog()).getAllByRole('img').find(img => img.getAttribute('alt') !== '');
const thumbs = () => within(spreadDialog()).queryAllByRole('button', { name: /Show image/ });

beforeEach(() => {
  mockAddToCart.mockClear();
  mockLooks = [
    look('A', ['/images/A-1.jpg', '/images/A-2.jpg', '/images/A-3.jpg'], [item('A1'), item('A2', { sizes: ['S', 'M'] })]),
    look('B', ['/images/B-1.jpg'], [item('B1')]),
    look('C', [], []),
    look('D', ['/images/D-cover.jpg', '', '/images/D-1.jpg'], [item('D1')])
  ];
});
afterEach(cleanup);

// The first look is the cover story; the others are spreads further down.
const openCover = () => fireEvent.click(screen.getAllByRole('figure')[0]);
const openSpread = (title) => fireEvent.click(screen.getByText(title, { selector: 'h3' }).closest('article').querySelector('figure'));

describe('gallery list', () => {
  test('cover first, then close-ups, without blanks or repeats', () => {
    expect(lookGallery(mockLooks[3])).toEqual(['/images/D-cover.jpg', '/images/D-1.jpg']);
    expect(lookGallery({ heroImage: '/x.jpg' })).toEqual(['/x.jpg']);
    expect(lookGallery(null)).toEqual([]);
  });
});

describe('look detail gallery', () => {
  test('opens on the cover with one thumbnail per photograph', () => {
    renderPage();
    openCover();
    expect(mainImage().getAttribute('data-original-src')).toBe('/images/A-cover.jpg');
    expect(thumbs()).toHaveLength(4);
    expect(thumbs()[0].getAttribute('aria-current')).toBe('true');
    expect(within(spreadDialog()).getByText('1 / 4')).toBeTruthy();
  });

  test('a thumbnail changes the main photograph and becomes the active one', () => {
    renderPage();
    openCover();
    fireEvent.click(thumbs()[2]);
    expect(mainImage().getAttribute('data-original-src')).toBe('/images/A-2.jpg');
    expect(thumbs()[2].getAttribute('aria-current')).toBe('true');
    expect(thumbs()[0].getAttribute('aria-current')).toBeNull();
    expect(within(spreadDialog()).getByText('3 / 4')).toBeTruthy();
  });

  test('previous and next buttons step through and stop at the ends', () => {
    renderPage();
    openCover();
    const prev = within(spreadDialog()).getByRole('button', { name: 'Previous image' });
    const next = within(spreadDialog()).getByRole('button', { name: 'Next image' });
    expect(prev.disabled).toBe(true);
    fireEvent.click(next);
    expect(mainImage().getAttribute('data-original-src')).toBe('/images/A-1.jpg');
    fireEvent.click(next); fireEvent.click(next);
    expect(next.disabled).toBe(true);
    fireEvent.click(next);
    expect(mainImage().getAttribute('data-original-src')).toBe('/images/A-3.jpg');
    fireEvent.click(prev);
    expect(mainImage().getAttribute('data-original-src')).toBe('/images/A-2.jpg');
  });

  test('arrow keys step through the photographs, then turn to the next look on its cover', () => {
    renderPage();
    openCover();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mainImage().getAttribute('data-original-src')).toBe('/images/A-1.jpg');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(mainImage().getAttribute('data-original-src')).toBe('/images/A-cover.jpg');
    for (let i = 0; i < 3; i++) fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mainImage().getAttribute('data-original-src')).toBe('/images/A-3.jpg');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(spreadDialog().getAttribute('aria-label')).toMatch(/^Look B/);
    expect(mainImage().getAttribute('data-original-src')).toBe('/images/B-cover.jpg');
  });

  test('switching look resets to the cover and never reads past a shorter gallery', () => {
    renderPage();
    openCover();
    fireEvent.click(thumbs()[3]); // index 3 of look A
    fireEvent.click(within(spreadDialog()).getByRole('button', { name: 'Next spread' }));
    expect(spreadDialog().getAttribute('aria-label')).toMatch(/^Look B/);
    expect(mainImage().getAttribute('data-original-src')).toBe('/images/B-cover.jpg');
    expect(thumbs()).toHaveLength(2);
    expect(thumbs()[0].getAttribute('aria-current')).toBe('true');
  });

  test('reopening the same look starts on its cover again', () => {
    renderPage();
    openCover();
    fireEvent.click(thumbs()[2]);
    fireEvent.click(within(spreadDialog()).getByRole('button', { name: 'Close' }));
    openCover();
    expect(mainImage().getAttribute('data-original-src')).toBe('/images/A-cover.jpg');
  });

  test('a look with one photograph and no pieces opens without gallery controls or errors', () => {
    renderPage();
    openSpread('Look C');
    expect(mainImage().getAttribute('data-original-src')).toBe('/images/C-cover.jpg');
    expect(thumbs()).toHaveLength(0);
    expect(within(spreadDialog()).queryByRole('button', { name: 'Next image' })).toBeNull();
    expect(within(spreadDialog()).getByText('No pieces are linked to this look yet.')).toBeTruthy();
    expect(within(spreadDialog()).getByRole('button', { name: /Add the whole look/i }).disabled).toBe(true);
  });

  test('the close-ups carry no garment pins; the cover pins on the page are untouched', () => {
    renderPage();
    const pinsBefore = screen.getAllByRole('button', { name: /Garment A1/ }).filter(b => b.getAttribute('aria-pressed') !== null).length;
    expect(pinsBefore).toBe(1);
    openCover();
    fireEvent.click(thumbs()[1]);
    expect(within(spreadDialog()).queryAllByRole('button', { pressed: false }).filter(b => /Highlight/i.test(b.getAttribute('aria-label') || ''))).toHaveLength(0);
    fireEvent.click(within(spreadDialog()).getByRole('button', { name: 'Close' }));
    expect(screen.getAllByRole('button', { name: /Garment A1/ }).filter(b => b.getAttribute('aria-pressed') !== null)).toHaveLength(pinsBefore);
  });
});

describe('pieces and actions in the detail view', () => {
  test('a one-size piece is added from its row; a multi-size piece opens the product modal', () => {
    renderPage();
    openCover();
    const dialog = spreadDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add — Garment A1' }));
    expect(mockAddToCart).toHaveBeenCalledWith(expect.objectContaining({ id: 'A1', size: 'M' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add — Garment A2' }));
    expect(screen.getByRole('dialog', { name: 'product modal' }).textContent).toBe('Garment A2');
  });

  test('a sold-out piece says so and cannot be added', () => {
    mockLooks[0].shoppableItems = [item('A1', { inStock: false })];
    renderPage();
    openCover();
    const button = within(spreadDialog()).getByRole('button', { name: 'Sold out — Garment A1' });
    expect(button.disabled).toBe(true);
  });

  test('Add the whole look still adds the pieces', () => {
    mockLooks[0].shoppableItems = [item('A1'), item('A3')];
    renderPage();
    openCover();
    fireEvent.click(within(spreadDialog()).getByRole('button', { name: /Add the whole look/i }));
    expect(mockAddToCart).toHaveBeenCalledTimes(2);
  });

  test('Open in Mix & Match Studio still navigates', () => {
    renderPage();
    openCover();
    fireEvent.click(within(spreadDialog()).getByRole('button', { name: /Open in Mix & Match Studio/i }));
    expect(screen.getByTestId('where').textContent).toBe('/mix-match');
  });
});
