/* Promotional codes — the authoritative table.
 *
 * The server decides what a coupon is worth. It recomputes the discount from
 * this file against its own subtotal when an order is created, so a code the
 * browser claims to have applied, or a discount it claims to have earned, is
 * never taken at face value. The table in frontend/src/config/coupons.js is a
 * copy kept only so checkout can show the figure before the order is placed;
 * this one is what the customer is actually charged against.
 *
 * Until now there was no such file. frontend/src/config/shipping.js already
 * named "backend/config/coupons.js" as its counterpart, but the codes lived in
 * two private consts instead — one at the top of backend/routes/orderRoutes.js
 * and one at the top of frontend/src/pages/PaymentPage.jsx — with nothing
 * holding them together. They happen to agree today; nothing was stopping them
 * drifting, and a drift would mean the price on screen differing from the
 * price charged.
 *
 * `label` is display text, so it lives with the copy the browser shows and is
 * not repeated here.
 */

export const COUPONS = {
  // '01' / '02' / '03' were removed: two-digit codes that anyone could guess,
  // never advertised, and '03' took half off the whole order. Because this
  // table is authoritative the server honoured them for real. Add promotional
  // codes with names that cannot be stumbled onto, e.g. MATCHA15.
  'MATCHA15': { discount: 15, type: 'percent' },
  'WELCOME10': { discount: 10, type: 'percent' },
  'FREESHIP': { discount: 0, type: 'free_shipping' },
};

/** Codes are matched case-insensitively and trimmed, as the checkout form sends them. */
export function normaliseCode(code) {
  return String(code || '').trim().toUpperCase();
}

/** The coupon a code refers to, or null. Never throws on junk input. */
export function couponFor(code) {
  return COUPONS[normaliseCode(code)] || null;
}

/* Money is rounded to the cent at the point it is calculated rather than at
   the point it is displayed, so the discount stored on the order is the same
   number the customer was shown. */
export function discountFor(code, subtotal) {
  const coupon = couponFor(code);
  if (!coupon || coupon.type !== 'percent') return 0;
  return Math.round(subtotal * (coupon.discount / 100) * 100) / 100;
}

/** Whether a code waives shipping. The order total threshold is separate. */
export function isFreeShippingCoupon(code) {
  return couponFor(code)?.type === 'free_shipping';
}
