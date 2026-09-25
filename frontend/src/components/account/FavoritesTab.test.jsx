/* The saved archive used to be furnished with two invented garments.
 *
 * FavoritesTab took a `favorites` prop, UserAccount rendered <FavoritesTab />
 * with no props at all, so the list was always empty and always fell back to
 * two hard-coded products — ids 101 and 102, in no catalogue and no database.
 * Their add-to-bag button worked, and POST /api/orders then answered 409
 * "insufficient stock" for the phantom id and rejected the WHOLE order, real
 * garments included. Measured on production: a bag holding one real pair of
 * jeans plus saved id 102 could not be checked out at all, and the page said
 * only "Something went wrong".
 *
 * "a saved id the catalogue does not know is dropped" and "no invented garment
 * is ever shown" below are the regression tests: against the old component the
 * first cannot pass at all and the second sees the two phantoms.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

import FavoritesTab, { readWishlistIds, matchSavedProducts, WISHLIST_STORAGE_KEY } from './FavoritesTab';

vi.mock('../../services/api', () => ({
  api: { getProducts: vi.fn() }
}));

const addToCart = vi.fn();
vi.mock('../../context/CartContext.jsx', () => ({
  useCart: () => ({ addToCart })
}));

vi.mock('../../context/LanguageContext.jsx', () => ({
  useLanguage: () => ({ t: (key) => key })
}));

const { api } = await import('../../services/api');

/* Two real garments, shaped the way GET /api/products returns them: with the
   `sizes` the order API needs to find a stock bucket. */
const CATALOGUE = [
  {
    _id: '6a9e2d368a9fe739d6d88f24',
    id: 'AUT-BOT-004',
    name: 'MatchA Autumn Jeans',
    price: 70.99,
    color: 'Brown',
    image: '/images/products/autumn/bottoms/jeans/color_1_brown.jpeg',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    category: 'Bottoms'
  },
  {
    _id: '6a9e2d368a9fe739d6d88f31',
    id: 'SPR-TOP-002',
    name: 'MatchA Spring Shirts',
    price: 55.99,
    color: 'Coral',
    image: '/images/products/spring/tops/band-collar-shirts/color_1_coral.webp',
    sizes: ['S', 'M', 'L'],
    category: 'Tops'
  }
];

const setWishlist = (entries) =>
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(entries));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  api.getProducts.mockResolvedValue({ data: CATALOGUE });
});

// This project does not run vitest with `globals`, so Testing Library's own
// auto-cleanup is never registered and renders would pile up in one document.
afterEach(cleanup);

describe('readWishlistIds', () => {
  test('reads the ids the product modal saved', () => {
    setWishlist([{ id: 'AUT-BOT-004', name: 'MatchA Autumn Jeans' }, { id: 'SPR-TOP-002' }]);
    expect(readWishlistIds()).toEqual(['AUT-BOT-004', 'SPR-TOP-002']);
  });

  test('a blocked or corrupted store reads as an empty archive rather than throwing', () => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, '{not json');
    expect(readWishlistIds()).toEqual([]);

    const throwing = { getItem: () => { throw new Error('storage disabled'); } };
    expect(readWishlistIds(throwing)).toEqual([]);
  });

  test('entries without an id cannot become a cart line', () => {
    setWishlist([{ name: 'no id here' }, { id: 'AUT-BOT-004' }, null]);
    expect(readWishlistIds()).toEqual(['AUT-BOT-004']);
  });
});

describe('matchSavedProducts', () => {
  test('a saved id the catalogue does not know is dropped', () => {
    // 102 is exactly the phantom that made POST /api/orders answer 409.
    expect(matchSavedProducts([102, 'AUT-BOT-004'], CATALOGUE)).toEqual([CATALOGUE[0]]);
  });

  test('matches on the mongo _id as well as the sku', () => {
    expect(matchSavedProducts(['6a9e2d368a9fe739d6d88f31'], CATALOGUE)).toEqual([CATALOGUE[1]]);
  });

  test('the same garment saved twice is listed once', () => {
    expect(matchSavedProducts(['AUT-BOT-004', 'AUT-BOT-004'], CATALOGUE)).toEqual([CATALOGUE[0]]);
  });

  test('every garment it returns carries the sizes the order API needs', () => {
    const matched = matchSavedProducts(['AUT-BOT-004', 'SPR-TOP-002'], CATALOGUE);
    expect(matched).toHaveLength(2);
    matched.forEach((product) => {
      expect(Array.isArray(product.sizes)).toBe(true);
      expect(product.sizes.length).toBeGreaterThan(0);
    });
  });
});

describe('FavoritesTab', () => {
  test('no invented garment is ever shown', async () => {
    render(<FavoritesTab />);

    await waitFor(() => {
      expect(screen.getByText('account.favoritesEmptyTitle')).toBeTruthy();
    });

    expect(screen.queryByText(/Signature Heavyweight Boxy Tee/)).toBeNull();
    expect(screen.queryByText(/Pleated Relaxed Trousers/)).toBeNull();
    // Nothing to buy means the catalogue is not even asked for.
    expect(api.getProducts).not.toHaveBeenCalled();
  });

  test('saved garments are read back from the catalogue', async () => {
    setWishlist([{ id: 'AUT-BOT-004' }, { id: 'SPR-TOP-002' }]);
    render(<FavoritesTab />);

    await waitFor(() => {
      expect(screen.getByText('MatchA Autumn Jeans')).toBeTruthy();
    });
    expect(screen.getByText('MatchA Spring Shirts')).toBeTruthy();
    expect(screen.getByText('accountUi.favoritesTitle')).toBeTruthy();
  });

  test('a saved garment that has left the archive is not offered for sale', async () => {
    setWishlist([{ id: 102, name: 'MatchA Pleated Relaxed Trousers' }, { id: 'AUT-BOT-004' }]);
    render(<FavoritesTab />);

    await waitFor(() => {
      expect(screen.getByText('MatchA Autumn Jeans')).toBeTruthy();
    });
    expect(screen.queryByText(/Pleated Relaxed Trousers/)).toBeNull();
    expect(screen.getByText('accountUi.favoritesTitle')).toBeTruthy();
  });

  test('the bag receives the catalogue garment, not the thin saved record', async () => {
    setWishlist([{ id: 'AUT-BOT-004', name: 'stale name', price: 1 }]);
    render(<FavoritesTab />);

    await waitFor(() => {
      expect(screen.getByText('MatchA Autumn Jeans')).toBeTruthy();
    });

    screen.getByTitle('account.addToCart').click();
    expect(addToCart).toHaveBeenCalledTimes(1);

    const sent = addToCart.mock.calls[0][0];
    expect(sent.id).toBe('AUT-BOT-004');
    expect(sent.price).toBe(70.99);
    expect(sent.sizes).toEqual(['S', 'M', 'L', 'XL', 'XXL']);
  });

  /* GET /api/products puts the stock count in `quantity`. Handed over as it
     was, a garment with 47 in stock went into the bag 47 times. */
  test('adding a saved garment asks for one, whatever its stock', async () => {
    api.getProducts.mockResolvedValue({ data: [{ ...CATALOGUE[0], quantity: 47, stock: 47 }] });
    setWishlist([{ id: 'AUT-BOT-004' }]);
    render(<FavoritesTab />);

    await waitFor(() => expect(screen.getByText('MatchA Autumn Jeans')).toBeTruthy());
    screen.getByTitle('account.addToCart').click();
    expect(addToCart).toHaveBeenCalledWith(expect.objectContaining({ id: 'AUT-BOT-004' }), 1);
  });

  test('when the catalogue cannot be reached nothing buyable is rendered', async () => {
    setWishlist([{ id: 'AUT-BOT-004' }]);
    api.getProducts.mockRejectedValue(new Error('offline'));
    render(<FavoritesTab />);

    await waitFor(() => {
      expect(screen.getByText('account.favoritesUnavailable')).toBeTruthy();
    });
    expect(screen.queryByTitle('account.addToCart')).toBeNull();
  });

  test('an explicit favorites prop still wins, for a server-backed source later', async () => {
    setWishlist([{ id: 'AUT-BOT-004' }]);
    render(<FavoritesTab favorites={[CATALOGUE[1]]} />);

    await waitFor(() => {
      expect(screen.getByText('MatchA Spring Shirts')).toBeTruthy();
    });
    expect(screen.queryByText('MatchA Autumn Jeans')).toBeNull();
    expect(api.getProducts).not.toHaveBeenCalled();
  });
});
