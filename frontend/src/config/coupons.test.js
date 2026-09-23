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
import { COUPONS, couponFor, normaliseCode } from './coupons';

// vitest runs with the frontend package as its root.
const srcFile = (rel) => readFileSync(path.resolve(process.cwd(), 'src', rel), 'utf8');

/* Comments explain the rule and may well name the code the rule is about;
   only what can reach a screen is under test here. */
const withoutComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const WORKING_CODES = Object.keys(COUPONS);

describe('promo codes', () => {
  test('the codes this file knows about are still the ones under test', () => {
    // If a code is added, this test is the reminder to check it is not being
    // named in user-facing copy.
    expect(WORKING_CODES.length).toBeGreaterThan(0);
    expect(WORKING_CODES).toContain('FREESHIP');
  });

  test('an unknown code is simply unknown', () => {
    expect(couponFor(normaliseCode('BOGUSXYZ'))).toBeFalsy();
    expect(couponFor(normaliseCode(''))).toBeFalsy();
    // Guessable sequences removed in PR #96 must stay gone.
    expect(couponFor(normaliseCode('01'))).toBeFalsy();
    expect(couponFor(normaliseCode('02'))).toBeFalsy();
  });

  test('a working code is still accepted, whatever case it is typed in', () => {
    expect(couponFor(normaliseCode(' matcha15 '))).toBeTruthy();
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
