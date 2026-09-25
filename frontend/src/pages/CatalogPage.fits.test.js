import { describe, test, expect, vi } from 'vitest';

vi.mock('../services/api', () => ({ api: {} }));
const { fitOptionsFor } = await import('./CatalogPage.jsx');

describe('catalog fit filter', () => {
  test('offers every fit the archive carries, Regular included', () => {
    const products = [{ fit: 'Relaxed' }, { fit: 'Regular' }, { fit: 'Wide Leg' }, { fit: 'Regular' }, { fit: 'Oversized' }, {}];
    expect(fitOptionsFor(products)).toEqual(['ALL', 'Oversized', 'Relaxed', 'Regular', 'Wide Leg']);
  });

  test('a fit the order does not know still appears, after the known ones', () => {
    expect(fitOptionsFor([{ fit: 'Cropped' }, { fit: 'Tailored' }])).toEqual(['ALL', 'Tailored', 'Cropped']);
  });

  test('with nothing loaded it offers only Any fit', () => {
    expect(fitOptionsFor([])).toEqual(['ALL']);
  });
});
