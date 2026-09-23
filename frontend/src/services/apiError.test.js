/* A refused order used to arrive at the checkout with nothing left of it.
 *
 * POST /api/orders answers 409 with the sentence "สินค้าบางรายการเหลือไม่พอ"
 * and a `shortfall` naming the one garment at fault. 409 was not in
 * SERVER_MESSAGE_WINS, so all of that was replaced with the key
 * `errors.unknown` and the shopper read "Something went wrong. Please try
 * again." — untrue, because retrying can never work, and unactionable, because
 * the page never said which garment to remove. Measured on production: a bag
 * with one unavailable line could not be checked out, and the console logged
 * `Order creation failed: errors.unknown`.
 *
 * "names the garment the server refused" below is the regression test.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../data/productsData', () => ({ productsData: [] }));
// A configured origin, so a refused request is not retried against localhost.
vi.mock('./apiConfig', () => ({
  API_ORIGIN: 'https://api.example.test',
  API_BASE: 'https://api.example.test/api',
  mediaSrc: (s) => s
}));

const { api, apiErrorText } = await import('./api');

// The dictionary shape the real `t` has, so a missing key would show up here.
const t = (key, vars) => {
  const dict = {
    'errors.unknown': 'Something went wrong. Please try again.',
    'errors.badRequest': 'Something in that form was not right.',
    'errors.outOfStockItem': '"{name}" is no longer available. Remove it from your bag to place the order.',
    'errors.outOfStockItemSize': '"{name}" in size {size} is no longer available. Remove it or pick another size to place the order.'
  };
  const value = dict[key];
  if (value === undefined) return `MISSING:${key}`;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined ? m : String(vars[name])));
};

/* The other half of the same bug: the detail has to survive the request before
   apiErrorText can use it. 409 was not in SERVER_MESSAGE_WINS, so the thrown
   Error carried the key `errors.unknown` and no shortfall at all. */
describe('a refused order', () => {
  const REFUSAL = {
    success: false,
    message: 'สินค้าบางรายการเหลือไม่พอ กรุณาตรวจสอบตะกร้าอีกครั้ง',
    shortfall: { productId: 'AUT-BOT-004', name: 'MatchA Autumn Jeans', size: 'L', requested: 1 }
  };

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => REFUSAL
    });
  });

  afterEach(() => vi.restoreAllMocks());

  test('reaches the checkout with the garment the server named', async () => {
    const err = await api.createOrder({ items: [] }).then(
      () => { throw new Error('the request should have been refused'); },
      (e) => e
    );

    expect(err.status).toBe(409);
    expect(err.shortfall?.name).toBe('MatchA Autumn Jeans');
    expect(err.i18nKey).toBeUndefined();
    expect(apiErrorText(err, t)).toContain('MatchA Autumn Jeans');
  });
});

describe('apiErrorText', () => {
  test('names the garment the server refused', () => {
    const err = Object.assign(new Error('สินค้าบางรายการเหลือไม่พอ'), {
      status: 409,
      shortfall: { productId: 'AUT-BOT-004', name: 'MatchA Autumn Jeans', size: 'L', requested: 1 }
    });

    const text = apiErrorText(err, t);
    expect(text).toContain('MatchA Autumn Jeans');
    expect(text).toContain('L');
    expect(text).not.toContain('Something went wrong');
    expect(text).not.toMatch(/MISSING:/);
  });

  test('a garment sold as one thing is not described by its bucket name', () => {
    // `ONE` is the backend's internal bucket for a sizeless garment, not a size
    // any shopper ever chose. Showing it would read as nonsense.
    const err = Object.assign(new Error('สินค้าบางรายการเหลือไม่พอ'), {
      status: 409,
      shortfall: { productId: 'AUT-ACC-001', name: 'MatchA Autumn Bags', size: 'ONE', requested: 1 }
    });

    const text = apiErrorText(err, t);
    expect(text).toContain('MatchA Autumn Bags');
    expect(text).not.toContain('ONE');
  });

  test('without a shortfall the keyed message is still used', () => {
    const err = Object.assign(new Error('errors.badRequest'), { i18nKey: 'errors.badRequest' });
    expect(apiErrorText(err, t)).toBe('Something in that form was not right.');
  });

  test('an error from anywhere else still reads properly', () => {
    expect(apiErrorText(new Error('Stripe declined the card'), t)).toBe('Stripe declined the card');
  });

  test('with no translator to hand it does not crash', () => {
    const err = Object.assign(new Error('nope'), {
      shortfall: { name: 'MatchA Autumn Jeans', size: 'L' }
    });
    expect(apiErrorText(err)).toBe('nope');
  });
});
