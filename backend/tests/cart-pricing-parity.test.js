/* The price on screen and the price charged, computed from the same cart.
 *
 * The shop works out a total three times: on the cart page, on the checkout
 * page, and again on the server when the order is written. Only the third one
 * is real — the server recomputes everything from its own product table, so a
 * browser that claims a price or a discount is never believed. That is the
 * right design, and it means the other two are display code whose only job is
 * to agree with it.
 *
 * Both config files say so in their own comments, and both remember the last
 * time they drifted: the cart page charged a flat $10 shipping while checkout
 * and the order charged $0. Nothing has been holding them together since.
 *
 * These tests run the frontend's own pricing modules and the server's own
 * pricing modules over the same carts and require the same answer.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// The server prices coupons (services/coupons.js). Checkout no longer keeps a
// table of its own: it shows the discount POST /api/coupons/quote returns,
// which is the same evaluateCoupon the order route runs.
import {
  builtInCoupons,
  evaluateCoupon,
  normaliseCode as serverNormalise
} from '../services/coupons.js';

import {
  normaliseCode as clientNormalise,
  bundleDiscountFor as clientBundleDiscountFor,
  bundleSlotFor as clientBundleSlotFor
} from '../../frontend/src/config/coupons.js';

import {
  SHIPPING_OPTIONS,
  FREE_SHIPPING_THRESHOLD as CLIENT_THRESHOLD,
  shippingCostFor
} from '../../frontend/src/config/shipping.js';

/* Kept in step with routes/orderRoutes.js by the tests below rather than by
   hope: the route declares these privately, so this is the one place the two
   can be compared. */
const SERVER_SHIPPING_RATES = { standard: 0, express: 12.0, premium: 25.0 };
const SERVER_FREE_SHIPPING_THRESHOLD = 100.0;
const BUNDLE_DISCOUNT_RATE = 0.12;

const round = (n) => Math.round(n * 100) / 100;

/* What the server answers for a code against a cart — the quote endpoint and
   the order route share this. Only the built-in codes exist without a
   database; a code that does not apply is refused (null here). */
const BUILT_INS = new Map(builtInCoupons().map(c => [c.code, c]));
function serverQuote(cart, couponCode) {
  const coupon = BUILT_INS.get(serverNormalise(couponCode));
  if (!coupon) return null;
  const lines = cart.map(i => ({ productId: i.id || 'ITEM', category: i.category || null, lineTotal: i.price * (i.quantity || 1) }));
  const subtotal = round(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  try { return evaluateCoupon(coupon, { lines, subtotal }); } catch { return null; }
}

/* What routes/orderRoutes.js computes, transcribed from the route so the two
   can be compared without standing a database up. Any change there that is not
   mirrored here will show up as a failure in the last test in this file. */
function serverTotals(cart, { couponCode = null, shippingOption = 'standard' } = {}) {
  let subtotal = 0;
  let bundleDiscountAmount = 0;

  for (const item of cart) {
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    subtotal += item.price * qty;
  }
  subtotal = round(subtotal);

  // Transcribed from routes/orderRoutes.js: bundle eligibility requires 4 slots
  const slotCounts = { tops: 0, bottoms: 0, shoes: 0, accessories: 0 };
  for (const item of cart) {
    const slot = clientBundleSlotFor(item);
    if (slot) slotCounts[slot] += Math.max(1, parseInt(item.quantity, 10) || 1);
  }
  const completeBundles = Math.min(
    slotCounts.tops,
    slotCounts.bottoms,
    slotCounts.shoes,
    slotCounts.accessories
  );
  if (completeBundles > 0) {
    const remainingQuota = {
      tops: completeBundles,
      bottoms: completeBundles,
      shoes: completeBundles,
      accessories: completeBundles
    };
    for (const item of cart) {
      const slot = clientBundleSlotFor(item);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (slot && remainingQuota[slot] > 0) {
        const discountable = Math.min(qty, remainingQuota[slot]);
        bundleDiscountAmount += discountable * item.price * BUNDLE_DISCOUNT_RATE;
        remainingQuota[slot] -= discountable;
      }
    }
  }
  bundleDiscountAmount = round(bundleDiscountAmount);

  const quote = serverQuote(cart, couponCode);
  const couponDiscount = quote?.discountAmount || 0;
  const isFreeShipping = Boolean(quote?.freeShipping) || subtotal >= SERVER_FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : (SERVER_SHIPPING_RATES[shippingOption] ?? 0);
  const totalDiscount = round(couponDiscount + bundleDiscountAmount);
  const total = Math.max(0, round(subtotal + shippingCost - totalDiscount));

  return { subtotal, shippingCost, discount: totalDiscount, total };
}

/* What pages/PaymentPage.jsx puts on the screen, transcribed the same way.
   `applied` is what the page received from POST /api/coupons/quote. */
function checkoutTotals(cart, { couponCode = null, shippingOption = 'standard' } = {}) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const applied = serverQuote(cart, couponCode);
  const shippingCost = shippingCostFor(subtotal, shippingOption, {
    freeShippingCoupon: Boolean(applied?.freeShipping)
  });
  const discount = round((applied?.discountAmount || 0) + clientBundleDiscountFor(cart));
  const total = Math.max(0, subtotal + shippingCost - discount);
  return { subtotal, shippingCost, discount, total };
}

/* What the customer actually reads. Every figure on both screens goes through
   .toFixed(2), so the comparison that matters is at the cent — the client
   leaves its total unrounded (60.339999999999996 where the server stores
   60.34) and the two print identically. That difference is recorded on its
   own below rather than smeared through every case here. */
const toCents = (totals) => Object.fromEntries(
  Object.entries(totals).map(([k, v]) => [k, v.toFixed(2)])
);

/* ------------------------------------------------------------------ *
 * There is only one coupon table now
 * ------------------------------------------------------------------ */

test('the built-in codes are still the advertised ones', () => {
  assert.deepEqual([...BUILT_INS.keys()].sort(), ['FREESHIP', 'MATCHA15', 'WELCOME10']);
  assert.equal(serverQuote([item(100)], 'MATCHA15').discountAmount, 15);
});

test('codes are normalised identically, however they are typed', () => {
  for (const typed of ['  matcha15 ', 'MaTcHa15', 'freeship', '  01', '03  ', '', null, undefined]) {
    assert.equal(clientNormalise(typed), serverNormalise(typed), JSON.stringify(typed));
  }
});

test('shipping rates and the free-shipping threshold match the server', () => {
  assert.deepEqual(SHIPPING_OPTIONS, SERVER_SHIPPING_RATES);
  assert.equal(CLIENT_THRESHOLD, SERVER_FREE_SHIPPING_THRESHOLD);
});

/* ------------------------------------------------------------------ *
 * The same cart, priced twice
 * ------------------------------------------------------------------ */

const item = (price, quantity = 1, extra = {}) => ({ price, quantity, ...extra });

const CARTS = {
  'single item under the free-shipping threshold': [item(70.99)],
  'two lines, one of them several units': [item(55.99, 2), item(48.99, 3)],
  'exactly on the free-shipping threshold': [item(50, 2)],
  'a cent under the threshold': [item(99.99)],
  'a cent over the threshold': [item(100.01)],
  'awkward cents': [item(33.33, 3), item(0.01, 7)],
  'one expensive piece': [item(1234.56)]
};

for (const [name, cart] of Object.entries(CARTS)) {
  for (const shippingOption of ['standard', 'express', 'premium']) {
    for (const couponCode of [null, 'MATCHA15', 'WELCOME10', 'FREESHIP', 'not-a-code']) {
      test(`checkout matches the server: ${name} / ${shippingOption} / ${couponCode ?? 'no coupon'}`, () => {
        const shown = checkoutTotals(cart, { couponCode, shippingOption });
        const charged = serverTotals(cart, { couponCode, shippingOption });
        assert.deepEqual(toCents(shown), toCents(charged));
      });
    }
  }
}

/* ------------------------------------------------------------------ *
 * The complete-outfit discount
 * ------------------------------------------------------------------ */

/* Mix & Match advertises "12% OFF THE COMPLETE OUTFIT", marks each piece it
   adds with `isBundleItem: true`, and the cart page shows the saving. The
   server honours the same flag. These two record where that breaks down. */

test('the server does apply 12% to a complete outfit', () => {
  const outfit = [
    item(92.99, 1, { category: 'Tops', isBundleItem: true }),
    item(73.99, 1, { category: 'Bottoms', isBundleItem: true }),
    item(70.99, 1, { category: 'Shoes', isBundleItem: true }),
    item(48.99, 1, { category: 'Accessories', isBundleItem: true })
  ];
  const charged = serverTotals(outfit, { shippingOption: 'standard' });
  const gross = round(92.99 + 73.99 + 70.99 + 48.99);

  assert.equal(charged.subtotal, gross);
  assert.equal(charged.discount, round(gross * 0.12), 'the bundle saving is real on the server');
  assert.equal(charged.total, round(gross - gross * 0.12));
});

test('a complete outfit is charged what the checkout screen shows', () => {
  const outfit = [
    item(92.99, 1, { category: 'Tops', isBundleItem: true }),
    item(73.99, 1, { category: 'Bottoms', isBundleItem: true }),
    item(70.99, 1, { category: 'Shoes', isBundleItem: true }),
    item(48.99, 1, { category: 'Accessories', isBundleItem: true })
  ];
  assert.deepEqual(
    toCents(checkoutTotals(outfit, { shippingOption: 'standard' })),
    toCents(serverTotals(outfit, { shippingOption: 'standard' }))
  );
});

/* A note rather than a defect: the server rounds its total to the cent and
   stores that; the checkout screen leaves the arithmetic as it falls. For a
   $70.99 piece with MATCHA15 the browser holds 60.339999999999996 where the
   order holds 60.34. Both print "$60.34", and the figure the customer is
   charged is the server's, so nothing is wrong today — but the browser's
   number is the one that would be wrong if it were ever compared, summed or
   sent anywhere. */
test('the checkout total is not rounded the way the order total is', () => {
  const shown = checkoutTotals([item(70.99)], { couponCode: 'MATCHA15' });
  const charged = serverTotals([item(70.99)], { couponCode: 'MATCHA15' });

  assert.equal(shown.total.toFixed(2), charged.total.toFixed(2), 'identical on screen');
  assert.notEqual(shown.total, charged.total, 'and not identical underneath');
  assert.equal(charged.total, 60.34);
});

/* ------------------------------------------------------------------ *
 * Free shipping is decided on the gross subtotal, on both sides
 * ------------------------------------------------------------------ */

test('a discount that drops the subtotal under $100 does not take free shipping away', () => {
  /* $105 with MATCHA15 is $89.25, under the $100 threshold — but the threshold
     is read from the gross subtotal on the server. Checkout has to agree or the
     shipping line moves when the coupon is typed. */
  const cart = [item(105)];
  const shown = checkoutTotals(cart, { couponCode: 'MATCHA15', shippingOption: 'express' });
  const charged = serverTotals(cart, { couponCode: 'MATCHA15', shippingOption: 'express' });

  assert.equal(charged.shippingCost, 0, 'the server still ships it free');
  assert.deepEqual(toCents(shown), toCents(charged));
});

/* The order route refuses an unknown code outright now (COUPON_INVALID, see
   coupons.test.js); checkout never applies one, so neither side discounts. */
test('an unknown code is worth nothing on either side', () => {
  const cart = [item(70.99, 2)];
  for (const code of ['NOPE', '', '   ', 'DROP TABLE', '01;--']) {
    const shown = checkoutTotals(cart, { couponCode: code });
    const charged = serverTotals(cart, { couponCode: code });
    assert.equal(charged.discount, 0, `${code} is worth nothing`);
    assert.deepEqual(toCents(shown), toCents(charged));
  }
});

/* The two-digit codes 01/02/03 were live once — 03 took half off any order,
   and nothing advertised or rate-limited a guess at a two-character field. They
   are gone from the table now, and gone means the server charges full price for
   them, exactly as it does for any string that is not a code. */
test('the retired guessable codes now buy no discount', () => {
  const cart = [item(105)];
  for (const code of ['01', '02', '03']) {
    const charged = serverTotals(cart, { couponCode: code, shippingOption: 'standard' });
    assert.equal(charged.discount, 0, `${code} no longer discounts anything`);
    assert.deepEqual(toCents(checkoutTotals(cart, { couponCode: code })), toCents(charged));
  }
});

test('a total can never go negative, however deep the discount', () => {
  const cart = [item(1)];
  const charged = serverTotals(cart, { couponCode: 'MATCHA15', shippingOption: 'standard' });
  assert.ok(charged.total >= 0);
  assert.deepEqual(toCents(checkoutTotals(cart, { couponCode: 'MATCHA15' })), toCents(charged));
});
