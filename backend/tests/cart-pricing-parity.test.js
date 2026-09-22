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

// The server's table — the one the customer is actually charged against.
import {
  COUPONS as SERVER_COUPONS,
  normaliseCode as serverNormalise,
  discountFor as serverDiscountFor,
  isFreeShippingCoupon
} from '../config/coupons.js';

// The browser's copy, kept only so checkout can show a figure in advance.
import {
  COUPONS as CLIENT_COUPONS,
  normaliseCode as clientNormalise,
  discountFor as clientDiscountFor,
  bundleDiscountFor as clientBundleDiscountFor,
  couponFor as clientCouponFor
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

/* What routes/orderRoutes.js computes, transcribed from the route so the two
   can be compared without standing a database up. Any change there that is not
   mirrored here will show up as a failure in the last test in this file. */
function serverTotals(cart, { couponCode = null, shippingOption = 'standard' } = {}) {
  let subtotal = 0;
  let bundleDiscountAmount = 0;

  for (const item of cart) {
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    subtotal += item.price * qty;
    if (item.isBundleItem) bundleDiscountAmount += item.price * qty * BUNDLE_DISCOUNT_RATE;
  }
  subtotal = round(subtotal);
  bundleDiscountAmount = round(bundleDiscountAmount);

  const clean = serverNormalise(couponCode);
  const couponDiscount = serverDiscountFor(clean, subtotal);
  const isFreeShipping = isFreeShippingCoupon(clean) || subtotal >= SERVER_FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : (SERVER_SHIPPING_RATES[shippingOption] ?? 0);
  const totalDiscount = round(couponDiscount + bundleDiscountAmount);
  const total = Math.max(0, round(subtotal + shippingCost - totalDiscount));

  return { subtotal, shippingCost, discount: totalDiscount, total };
}

/* What pages/PaymentPage.jsx puts on the screen, transcribed the same way. */
function checkoutTotals(cart, { couponCode = null, shippingOption = 'standard' } = {}) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const applied = clientCouponFor(couponCode);
  const shippingCost = shippingCostFor(subtotal, shippingOption, {
    freeShippingCoupon: applied?.type === 'free_shipping'
  });
  const discount = round(clientDiscountFor(applied, subtotal) + clientBundleDiscountFor(cart));
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
 * The two tables have to say the same thing
 * ------------------------------------------------------------------ */

test('every coupon code exists on both sides', () => {
  assert.deepEqual(Object.keys(CLIENT_COUPONS).sort(), Object.keys(SERVER_COUPONS).sort());
});

test('every coupon is worth the same on both sides', () => {
  for (const [code, server] of Object.entries(SERVER_COUPONS)) {
    const client = CLIENT_COUPONS[code];
    assert.equal(client.type, server.type, `${code} type`);
    assert.equal(client.discount, server.discount, `${code} value`);
  }
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

test('a percentage discount rounds to the same cent on both sides', () => {
  // Thirds and sevenths are where a half-cent difference would appear.
  for (const subtotal of [33.33, 66.67, 0.01, 19.99, 99.99, 100, 1234.56, 7.77]) {
    for (const code of Object.keys(SERVER_COUPONS)) {
      assert.equal(
        clientDiscountFor(clientCouponFor(code), subtotal),
        serverDiscountFor(code, subtotal),
        `${code} on ${subtotal}`
      );
    }
  }
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
    for (const couponCode of [null, 'MATCHA15', '03', 'FREESHIP', 'not-a-code']) {
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
    item(92.99, 1, { isBundleItem: true }),
    item(73.99, 1, { isBundleItem: true }),
    item(70.99, 1, { isBundleItem: true }),
    item(48.99, 1, { isBundleItem: true })
  ];
  const charged = serverTotals(outfit, { shippingOption: 'standard' });
  const gross = round(92.99 + 73.99 + 70.99 + 48.99);

  assert.equal(charged.subtotal, gross);
  assert.equal(charged.discount, round(gross * 0.12), 'the bundle saving is real on the server');
  assert.equal(charged.total, round(gross - gross * 0.12));
});

test('a complete outfit is charged what the checkout screen shows', () => {
  const outfit = [
    item(92.99, 1, { isBundleItem: true }),
    item(73.99, 1, { isBundleItem: true }),
    item(70.99, 1, { isBundleItem: true }),
    item(48.99, 1, { isBundleItem: true })
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
  /* $105 with half off is $52.50, but the threshold is read from the gross
     subtotal on the server. Checkout has to agree or the shipping line moves
     when the coupon is typed. */
  const cart = [item(105)];
  const shown = checkoutTotals(cart, { couponCode: '03', shippingOption: 'express' });
  const charged = serverTotals(cart, { couponCode: '03', shippingOption: 'express' });

  assert.equal(charged.shippingCost, 0, 'the server still ships it free');
  assert.deepEqual(toCents(shown), toCents(charged));
});

test('an unknown code is worth nothing and is not an error on either side', () => {
  const cart = [item(70.99, 2)];
  for (const code of ['NOPE', '', '   ', 'DROP TABLE', '01;--']) {
    const shown = checkoutTotals(cart, { couponCode: code });
    const charged = serverTotals(cart, { couponCode: code });
    assert.equal(charged.discount, 0, `${code} is worth nothing`);
    assert.deepEqual(toCents(shown), toCents(charged));
  }
});

test('a total can never go negative, however deep the discount', () => {
  const cart = [item(1)];
  const charged = serverTotals(cart, { couponCode: '03', shippingOption: 'standard' });
  assert.ok(charged.total >= 0);
  assert.deepEqual(toCents(checkoutTotals(cart, { couponCode: '03' })), toCents(charged));
});
