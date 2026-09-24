/* Mix & Match chose sizes for the shopper, and chose ones that do not exist.

   The slots started at { tops: 'M', bottoms: '32', footwear: 'EU 41' }. No
   bottom in the archive is cut in a 32, so every bundle put its trousers in the
   bag in a size the order API has no stock bucket for; garments with no size on
   record went in as M. A slot's size now comes from the garment's own sizes in
   the live catalogue, and has to be picked when there is more than one. */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { productsData } from '../data/productsData';

const addToCart = vi.fn();
const showToast = vi.fn();
let live = [];

vi.mock('../context/CartContext.jsx', () => ({ useCart: () => ({ addToCart }) }));
vi.mock('../context/ToastContext.jsx', () => ({ useToast: () => ({ showToast }) }));
vi.mock('../context/LanguageContext.jsx', () => ({ useLanguage: () => ({ t: (k) => k }) }));
vi.mock('../hooks/useChangeMotion', () => ({ default: () => ({ current: null }) }));
vi.mock('../hooks/useStreetProducts', () => ({ default: () => ({ products: live, loading: false, error: false }) }));

globalThis.ResizeObserver = globalThis.ResizeObserver || class { observe() {} disconnect() {} };

const MixMatchStudioPage = (await import('./MixMatchStudioPage.jsx')).default;

// The first preset: Autumn hoodie, chinos, boots and bag.
const PRESET = ['AUT-TOP-009', 'AUT-BOT-003', 'AUT-ACC-007', 'AUT-ACC-001'];
const byId = (id) => productsData.find((p) => p.id === id);

const renderStudio = () => render(<MemoryRouter><MixMatchStudioPage /></MemoryRouter>);
const slot = (key) => document.querySelector(`[data-motion-slot="${key}"]`);
const pick = (key, size) => fireEvent.click(within(slot(key)).getByRole('button', { name: size }));
const addButton = () => screen.getAllByRole('button').find((b) => /Add (Complete Outfit|\d+ Available)/.test(b.textContent));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  live = PRESET.map((id) => ({ ...byId(id), inStock: true }));
});
afterEach(cleanup);

describe('Mix & Match sizes', () => {
  test('nothing goes in the bag until every slot that has a choice of size has one', () => {
    renderStudio();
    fireEvent.click(addButton());
    expect(addToCart).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('mixMatch.chooseSizes', 'info');
    expect(screen.getByText('mixMatch.chooseSizes')).toBeTruthy();
  });

  test('the bag gets the sizes that were picked, all of them sizes the garment is made in', () => {
    renderStudio();
    pick('tops', 'L');
    pick('bottoms', 'M');
    pick('footwear', 'EU 42');
    fireEvent.click(addButton());

    expect(addToCart).toHaveBeenCalledTimes(4);
    const sent = Object.fromEntries(addToCart.mock.calls.map(([line]) => [line.id, line.size]));
    expect(sent).toEqual({ 'AUT-TOP-009': 'L', 'AUT-BOT-003': 'M', 'AUT-ACC-007': 'EU 42', 'AUT-ACC-001': 'OS' });
    for (const [line] of addToCart.mock.calls) {
      const sizes = byId(line.id).sizes;
      expect(sizes).toContain(line.size);
    }
  });

  test('no slot offers a size the garment is not made in', () => {
    renderStudio();
    const bottomSizes = within(slot('bottoms')).getAllByRole('button').map((b) => b.textContent);
    expect(bottomSizes).toEqual(byId('AUT-BOT-003').sizes);
    expect(bottomSizes).not.toContain('32');
  });

  test('sizes come from the live catalogue when it differs from the bundled list', () => {
    live = live.map((p) => (p.id === 'AUT-BOT-003' ? { ...p, sizes: ['S', 'M'] } : p));
    renderStudio();
    expect(within(slot('bottoms')).getAllByRole('button').map((b) => b.textContent)).toEqual(['S', 'M']);
  });

  test('a garment with no size on record is left out instead of going in as M', () => {
    live = live.map((p) => (p.id === 'AUT-TOP-009' ? { ...p, sizes: [] } : p));
    renderStudio();
    expect(within(slot('tops')).getByText('mixMatch.noSizes')).toBeTruthy();
    pick('bottoms', 'M');
    pick('footwear', 'EU 40');
    fireEvent.click(addButton());

    const ids = addToCart.mock.calls.map(([line]) => line.id);
    expect(ids).not.toContain('AUT-TOP-009');
    expect(ids).toHaveLength(3);
  });
});
