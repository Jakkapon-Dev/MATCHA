/* A wrong guess used to be worth a discount.
 *
 * Applying an unknown code answered "Invalid promo code. Try MATCHA15 or
 * FREESHIP". MATCHA15 is advertised on the front page and sits in the promo
 * box's own placeholder, so naming it cost nothing — but FREESHIP is published
 * nowhere else on the site, and that message was the only place it could be
 * found. Typing one wrong code handed it over. Measured on production: entering
 * BOGUSXYZ returned exactly that sentence.
 *
 * "no message names a code that works" below is the regression test.
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { normaliseCode, storePendingCoupon, takePendingCoupon } from './coupons';

// vitest runs with the frontend package as its root.
const srcFile = (rel) => readFileSync(path.resolve(process.cwd(), 'src', rel), 'utf8');

/* Comments explain the rule and may well name the code the rule is about;
   only what can reach a screen is under test here. */
const withoutComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('promo codes', () => {
  /* The browser used to keep its own copy of the coupon table and do the
     discount arithmetic itself. Coupons now live in MongoDB and are priced by
     POST /api/coupons/quote, so there is no table here to drift from the
     server — and no discount value for anyone to read out of the bundle. */
  test('the browser holds no coupon table or discount arithmetic', () => {
    const couponsSource = withoutComments(srcFile('config/coupons.js'));
    expect(couponsSource).not.toMatch(/export (const|function) (COUPONS|couponFor|discountFor)/);
    expect(couponsSource).not.toContain('MATCHA15');
    const paymentPage = withoutComments(srcFile('pages/PaymentPage.jsx'));
    expect(paymentPage).toContain('api.quoteCoupon');
    expect(paymentPage).not.toMatch(/couponFor|discountFor/);
  });

  test('codes are normalised the way the server normalises them', () => {
    expect(normaliseCode(' matcha15 ')).toBe('MATCHA15');
    expect(normaliseCode(null)).toBe('');
  });

  test('a held code comes back once, as a code only, and junk is dropped', () => {
    expect(storePendingCoupon(' matcha15 ')).toBe(true);
    expect(takePendingCoupon()).toBe('MATCHA15');
    expect(takePendingCoupon()).toBeNull();
    // A value left by an older version of the site, or edited by hand.
    localStorage.setItem('matcha_applied_coupon', '{"discount":99}');
    expect(takePendingCoupon()).toBeNull();
  });
});

describe('the checkout copy', () => {
  /* Read as text on purpose: the point is that no code reaches a shopper's
     screen, whichever language they are reading. */
  const translations = withoutComments(srcFile('i18n/translations.js'));
  const paymentPage = withoutComments(srcFile('pages/PaymentPage.jsx'));

  test('no message names a code that works', () => {
    // FREESHIP is not advertised anywhere, so it must not appear in copy at all.
    expect(translations).not.toContain('FREESHIP');
    expect(paymentPage).not.toContain('FREESHIP');
  });

  test('the checkout has no list of working codes to put in a message', () => {
    /* The old message did not spell FREESHIP out; it interpolated
       FEATURED_CODES, a list kept in coupons.js for exactly that purpose. The
       list is what has to go, or the sentence comes back. */
    const couponsSource = withoutComments(srcFile('config/coupons.js'));
    expect(couponsSource).not.toContain('FEATURED_CODES');
    expect(paymentPage).not.toContain('FEATURED_CODES');
  });

  test('the invalid-code message is translated rather than hard-coded English', () => {
    expect(paymentPage).not.toContain('Invalid promo code');
    expect(translations).toContain('promoInvalid');
  });
});
