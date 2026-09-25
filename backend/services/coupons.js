import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';
import CouponRedemption from '../models/CouponRedemption.js';
import { COUPONS as BUILT_IN_COUPONS, normaliseCode } from '../config/coupons.js';

/* Coupons, decided on the server.

   Checkout sends a code and nothing else. This module looks the code up,
   checks every rule against the server's own view of the cart, and works out
   the discount; whatever the browser believes a coupon is worth is never
   read.

   Codes live in MongoDB, where the administrator manages them. The three
   codes in config/coupons.js predate that and are advertised on the site
   (MATCHA15 on the home page), so they stay available as built-in defaults —
   the same pattern the lookbook uses for its default spreads. A coupon saved
   in MongoDB with the same code replaces the built-in one entirely, which is
   how an administrator edits or disables it. */

export { normaliseCode };

const round2 = n => Math.round(n * 100) / 100;

export class CouponError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const MESSAGES = {
  COUPON_INVALID: 'ไม่พบรหัสส่วนลดนี้ กรุณาตรวจสอบอีกครั้ง',
  COUPON_INACTIVE: 'รหัสส่วนลดนี้ถูกปิดใช้งานแล้ว',
  COUPON_NOT_STARTED: 'รหัสส่วนลดนี้ยังไม่เริ่มใช้งาน',
  COUPON_EXPIRED: 'รหัสส่วนลดนี้หมดอายุแล้ว',
  COUPON_MIN_ORDER: 'ยอดสั่งซื้อยังไม่ถึงขั้นต่ำของรหัสส่วนลดนี้',
  COUPON_NOT_APPLICABLE: 'รหัสส่วนลดนี้ใช้กับสินค้าในตะกร้าไม่ได้',
  COUPON_EXHAUSTED: 'รหัสส่วนลดนี้ถูกใช้ครบจำนวนแล้ว',
  COUPON_USER_LIMIT: 'คุณใช้รหัสส่วนลดนี้ครบจำนวนครั้งที่กำหนดแล้ว',
  COUPON_CHANGED: 'เงื่อนไขของรหัสส่วนลดเพิ่งถูกเปลี่ยน กรุณาใช้รหัสอีกครั้ง'
};
const CONFLICTS = new Set(['COUPON_EXHAUSTED', 'COUPON_USER_LIMIT', 'COUPON_CHANGED']);
export const couponError = (code, status) => new CouponError(code, MESSAGES[code], status ?? (CONFLICTS.has(code) ? 409 : 400));

/* The built-in table speaks the old vocabulary ({ discount, type: 'percent' }).
   Everything past this point sees one shape. */
function builtInCoupon(code) {
  const raw = BUILT_IN_COUPONS[code];
  if (!raw) return null;
  return {
    _id: null,
    code,
    builtIn: true,
    type: raw.type === 'percent' ? 'percentage' : raw.type,
    value: raw.discount || 0,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    startsAt: null,
    expiresAt: null,
    usageLimit: null,
    usedCount: 0,
    perUserLimit: null,
    active: true,
    applicableProducts: [],
    applicableCategories: []
  };
}

export function builtInCoupons() {
  return Object.keys(BUILT_IN_COUPONS).map(builtInCoupon);
}

const dbReady = () => mongoose.connection.readyState === 1;

/** The coupon a code refers to — MongoDB first, then the built-in table — or null. */
export async function findCoupon(code, { session } = {}) {
  const clean = normaliseCode(code);
  if (!clean) return null;
  if (dbReady()) {
    const saved = await Coupon.findOne({ code: clean }).session(session || null).lean();
    if (saved) return saved;
  }
  return builtInCoupon(clean);
}

/** Display text for a coupon, derived from its rule so it can never disagree with it. */
export function couponLabel(coupon) {
  if (!coupon) return '';
  if (coupon.type === 'percentage') return `${coupon.value}% OFF`;
  if (coupon.type === 'fixed_amount') return `$${Number(coupon.value).toFixed(2)} OFF`;
  return 'Free Shipping';
}

/* Whether one cart line counts towards the coupon. No restriction at all
   means the whole cart; otherwise a line qualifies by product or by
   category. */
function lineQualifies(coupon, line) {
  const products = coupon.applicableProducts || [];
  const categories = coupon.applicableCategories || [];
  if (!products.length && !categories.length) return true;
  return products.includes(line.productId)
    || Boolean(line.sku && products.includes(line.sku))
    || Boolean(line.category && categories.includes(line.category));
}

/**
 * Every rule of a coupon against one cart, with no I/O.
 *
 * `lines` are server-priced: [{ productId, category, lineTotal }].
 * `subtotal` is the server's cart subtotal. `userRedemptions` is how many live
 * orders this shopper already holds against the coupon (0 when unknown).
 * Returns { discountAmount, freeShipping, eligibleSubtotal } or throws a
 * CouponError naming the rule that failed.
 */
export function evaluateCoupon(coupon, { lines = [], subtotal = 0, userRedemptions = 0, now = new Date() } = {}) {
  if (!coupon) throw couponError('COUPON_INVALID');
  if (coupon.active === false) throw couponError('COUPON_INACTIVE');
  if (coupon.startsAt && new Date(coupon.startsAt) > now) throw couponError('COUPON_NOT_STARTED');
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= now) throw couponError('COUPON_EXPIRED');
  if (coupon.usageLimit != null && (coupon.usedCount || 0) >= coupon.usageLimit) throw couponError('COUPON_EXHAUSTED');
  if (coupon.perUserLimit != null && userRedemptions >= coupon.perUserLimit) throw couponError('COUPON_USER_LIMIT');
  if (subtotal < (coupon.minOrderAmount || 0)) throw couponError('COUPON_MIN_ORDER');

  const eligibleSubtotal = round2(lines.filter(line => lineQualifies(coupon, line)).reduce((sum, line) => sum + line.lineTotal, 0));
  if (eligibleSubtotal <= 0) throw couponError('COUPON_NOT_APPLICABLE');

  let discountAmount = 0;
  if (coupon.type === 'percentage') {
    discountAmount = eligibleSubtotal * (coupon.value / 100);
  } else if (coupon.type === 'fixed_amount') {
    discountAmount = Math.min(coupon.value, eligibleSubtotal);
  }
  if (coupon.maxDiscountAmount != null) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
  discountAmount = round2(Math.max(0, discountAmount));

  return { discountAmount, freeShipping: coupon.type === 'free_shipping', eligibleSubtotal };
}

/* Who a per-user limit counts. A signed-in shopper is their account; a guest
   is the email on the order, which is what they would reuse. The email is
   hashed: the key is copied onto the order's coupon snapshot, and a raw
   address there would survive the customer data being anonymised. */
export function couponUserKey({ userId, email } = {}) {
  if (userId) return `user:${userId}`;
  const clean = String(email || '').trim().toLowerCase();
  return clean ? `email:${crypto.createHash('sha256').update(clean).digest('hex')}` : null;
}

async function userRedemptionsFor(coupon, userKey, session) {
  if (!coupon?._id || !userKey || !dbReady()) return 0;
  const row = await CouponRedemption.findOne({ couponId: coupon._id, userKey }).session(session || null).lean();
  return row?.count || 0;
}

/** Look up and evaluate a code for a cart. Throws CouponError. */
export async function quoteCoupon(code, { lines, subtotal, userKey, now = new Date(), session } = {}) {
  const coupon = await findCoupon(code, { session });
  const userRedemptions = await userRedemptionsFor(coupon, userKey, session);
  const result = evaluateCoupon(coupon, { lines, subtotal, userRedemptions, now });
  return { coupon, ...result };
}

let indexesReady = null;
/* The per-user limit leans on a unique index; it has to exist before the
   first redemption races against another one. */
export function ensureCouponIndexes() {
  if (!indexesReady) indexesReady = Promise.all([Coupon.init(), CouponRedemption.init()]).catch((err) => { indexesReady = null; throw err; });
  return indexesReady;
}

/**
 * Claim one use of a coupon inside the order's transaction.
 *
 * Both limits are enforced by conditional updates, so two checkouts racing
 * for the last use cannot both win: the loser's update matches nothing (or
 * collides on the unique index) and it gets a business error, while the
 * transaction rolls back its stock reservation with it. Built-in coupons have
 * no document and no limits, so there is nothing to claim.
 */
export async function redeemCoupon(coupon, { userKey, session, now = new Date(), expected, lines, subtotal } = {}) {
  if (!coupon?._id) return;
  const claimed = await Coupon.findOneAndUpdate(
    {
      _id: coupon._id,
      active: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        { $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] }
      ]
    },
    { $inc: { usedCount: 1 } },
    { session, new: true }
  );
  if (!claimed) {
    const current = await Coupon.findById(coupon._id).session(session || null).lean();
    if (!current || current.active === false) throw couponError('COUPON_INACTIVE');
    if (current.expiresAt && new Date(current.expiresAt) <= now) throw couponError('COUPON_EXPIRED');
    if (current.startsAt && new Date(current.startsAt) > now) throw couponError('COUPON_NOT_STARTED');
    throw couponError('COUPON_EXHAUSTED');
  }

  /* The quote was worked out a moment before this transaction. If the
     administrator changed the coupon in between, the shopper would be
     charged something other than what they were shown — so the claimed
     document is priced again and any difference refuses the order. */
  if (expected) {
    const repriced = evaluateCoupon({ ...claimed.toObject(), usedCount: claimed.usedCount - 1 }, { lines, subtotal, now });
    if (repriced.discountAmount !== expected.discountAmount || repriced.freeShipping !== expected.freeShipping) {
      throw couponError('COUPON_CHANGED');
    }
  }

  if (!userKey) return;
  const limit = claimed.perUserLimit;
  try {
    await CouponRedemption.findOneAndUpdate(
      { couponId: coupon._id, userKey, ...(limit != null ? { count: { $lt: limit } } : {}) },
      { $inc: { count: 1 }, $setOnInsert: { code: claimed.code } },
      { session, upsert: true, new: true }
    );
  } catch (err) {
    if (err?.code === 11000) throw couponError('COUPON_USER_LIMIT');
    throw err;
  }
}

/* Give a use back when the order holding it is cancelled or expires — at the
   same moment, and in the same transaction, as its stock. */
export async function releaseCoupon(order, { session } = {}) {
  const couponId = order?.coupon?.couponId;
  if (!couponId) return;
  await Coupon.updateOne({ _id: couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }, { session });
  if (order.coupon.userKey) {
    await CouponRedemption.updateOne({ couponId, userKey: order.coupon.userKey, count: { $gt: 0 } }, { $inc: { count: -1 } }, { session });
  }
}
