import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import Coupon, { COUPON_TYPES, COUPON_CODE_PATTERN } from '../models/Coupon.js';
import Product from '../models/Product.js';
import productsData from '../data/products.js';
import { authRequired, adminOnly } from '../middleware/auth.js';
import { extractAuthUser } from './orderRoutes.js';
import { normaliseCode, quoteCoupon, couponLabel, couponUserKey, builtInCoupons, CouponError } from '../services/coupons.js';
import { escapeRegex } from '../utils/regex.js';

const router = express.Router();

const databaseRequired = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'ฐานข้อมูลยังไม่พร้อม กรุณาลองใหม่' });
  next();
};

const CATEGORIES = Product.schema.path('category').enumValues;

/* How a coupon reads in a list: whether it can be used right now, and if not,
   why. Derived, never stored, so it cannot go stale. */
export function couponStatus(coupon, now = new Date()) {
  if (coupon.active === false) return 'disabled';
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= now) return 'expired';
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return 'scheduled';
  if (coupon.usageLimit != null && (coupon.usedCount || 0) >= coupon.usageLimit) return 'exhausted';
  return 'active';
}

const present = (coupon, now) => ({
  ...coupon,
  id: coupon._id ? String(coupon._id) : null,
  builtIn: Boolean(coupon.builtIn),
  label: couponLabel(coupon),
  status: couponStatus(coupon, now)
});

/* ---------------------------------------------------------------- quote */

/* Checking a code is a lookup an attacker could repeat to find valid ones,
   so it is throttled like placing an order is. */
const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: () => (process.env.NODE_ENV === 'test' ? 1000 : 60),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'ลองรหัสส่วนลดถี่เกินไป กรุณารอสักครู่แล้วลองใหม่' }
});

const quoteInput = z.object({
  code: z.string().trim().min(1).max(40),
  items: z.array(z.object({
    productId: z.string().trim().min(1).max(100).optional(),
    id: z.string().trim().min(1).max(100).optional(),
    quantity: z.coerce.number().int().min(1).max(99).default(1)
  }).passthrough()).min(1).max(100)
});

/* Prices come from the catalogue, never from the request — the same rule the
   order route follows. Only productId and quantity are read from each line. */
async function priceCart(items) {
  const ids = [...new Set(items.map(i => i.productId || i.id).filter(Boolean))];
  const catalogue = new Map(productsData.map(p => [p.id, p]));
  if (mongoose.connection.readyState === 1) {
    const rows = await Product.find({ $or: [{ id: { $in: ids } }, { sku: { $in: ids.map(id => id.toUpperCase()) } }] }, 'id sku price category').lean();
    for (const row of rows) {
      if (row.id) catalogue.set(row.id, row);
      if (row.sku) catalogue.set(row.sku, row);
    }
  }
  let subtotal = 0;
  const lines = [];
  for (const item of items) {
    const key = item.productId || item.id;
    const product = catalogue.get(key) || catalogue.get(String(key).toUpperCase());
    if (!product || !Number.isFinite(Number(product.price))) return null;
    const lineTotal = Number(product.price) * item.quantity;
    subtotal += lineTotal;
    lines.push({ productId: product.id || key, sku: product.sku || null, category: product.category || null, lineTotal });
  }
  return { lines, subtotal: Math.round(subtotal * 100) / 100 };
}

// POST /api/coupons/quote — ตรวจรหัสส่วนลดกับตะกร้าปัจจุบัน (ฝั่งเซิร์ฟเวอร์คิดเอง)
router.post('/coupons/quote', quoteLimiter, async (req, res, next) => {
  try {
    const parsed = quoteInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, code: 'COUPON_INVALID', message: 'กรุณากรอกรหัสส่วนลด' });
    const cart = await priceCart(parsed.data.items);
    if (!cart) return res.status(400).json({ success: false, message: 'มีสินค้าในตะกร้าที่ไม่พบในระบบ กรุณาลบออกแล้วลองใหม่อีกครั้ง' });

    const authUser = extractAuthUser(req);
    const userId = authUser?.id || authUser?.userId || authUser?._id;
    const code = normaliseCode(parsed.data.code);
    const quote = await quoteCoupon(code, { lines: cart.lines, subtotal: cart.subtotal, userKey: couponUserKey({ userId }) });
    res.json({
      success: true,
      data: {
        code,
        type: quote.coupon.type,
        value: quote.coupon.value,
        label: couponLabel(quote.coupon),
        discountAmount: quote.discountAmount,
        freeShipping: quote.freeShipping,
        subtotal: cart.subtotal
      }
    });
  } catch (err) {
    if (err instanceof CouponError) return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    next(err);
  }
});

/* ---------------------------------------------------------------- admin */

const nullableDate = z.preprocess(v => (v === '' || v == null ? null : v), z.coerce.date().nullable());
const nullableInt = z.preprocess(v => (v === '' || v == null ? null : v), z.coerce.number().int().min(1).max(1_000_000).nullable());
const nullableMoney = z.preprocess(v => (v === '' || v == null ? null : v), z.coerce.number().finite().positive().max(1_000_000).nullable());

const couponInput = z.object({
  code: z.string().trim().transform(s => s.toUpperCase()).pipe(z.string().regex(COUPON_CODE_PATTERN, 'รหัสต้องเป็นตัวอักษรอังกฤษ ตัวเลข - หรือ _ ยาว 3–30 ตัว')),
  description: z.string().trim().max(200).default(''),
  type: z.enum(COUPON_TYPES),
  value: z.coerce.number().finite().min(0).max(1_000_000).default(0),
  minOrderAmount: z.coerce.number().finite().min(0).max(1_000_000).default(0),
  maxDiscountAmount: nullableMoney.default(null),
  startsAt: nullableDate.default(null),
  expiresAt: nullableDate.default(null),
  usageLimit: nullableInt.default(null),
  perUserLimit: nullableInt.default(null),
  active: z.boolean().default(true),
  applicableProducts: z.array(z.string().trim().min(1).max(100)).max(200).default([]).transform(list => [...new Set(list)]),
  applicableCategories: z.array(z.enum(CATEGORIES)).max(CATEGORIES.length).default([]).transform(list => [...new Set(list)])
}).strict().superRefine((c, ctx) => {
  if (c.type === 'percentage' && (c.value <= 0 || c.value > 100)) ctx.addIssue({ code: 'custom', path: ['value'], message: 'ส่วนลดเป็นเปอร์เซ็นต์ต้องอยู่ระหว่าง 1–100' });
  if (c.type === 'fixed_amount' && c.value <= 0) ctx.addIssue({ code: 'custom', path: ['value'], message: 'ส่วนลดต้องมากกว่า 0' });
  if (c.startsAt && c.expiresAt && c.expiresAt <= c.startsAt) ctx.addIssue({ code: 'custom', path: ['expiresAt'], message: 'วันหมดอายุต้องอยู่หลังวันเริ่ม' });
});

function parseCoupon(body) {
  const parsed = couponInput.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw Object.assign(new Error(issue?.message || 'ข้อมูลคูปองไม่ถูกต้อง'), { status: 400, field: issue?.path?.join('.') });
  }
  const data = parsed.data;
  // A cap only means something on a percentage; a fixed amount is its own cap.
  if (data.type === 'free_shipping') data.value = 0;
  if (data.type !== 'percentage') data.maxDiscountAmount = null;
  return data;
}

async function assertProductsExist(ids) {
  if (!ids.length) return;
  const found = await Product.find({ $or: [{ id: { $in: ids } }, { sku: { $in: ids.map(id => id.toUpperCase()) } }] }, 'id sku').lean();
  const known = new Set(found.flatMap(p => [p.id, p.sku]));
  const missing = ids.filter(id => !known.has(id) && !known.has(id.toUpperCase()));
  if (missing.length) throw Object.assign(new Error(`ไม่พบสินค้า: ${missing.slice(0, 5).join(', ')}`), { status: 400, field: 'applicableProducts' });
}

const adminAudit = req => String(req.user?._id || req.user?.id || '') || null;
const sendError = (res, err) => res.status(err.status || 500).json({ success: false, message: err.status ? err.message : 'บันทึกคูปองไม่สำเร็จ', ...(err.field ? { field: err.field } : {}) });

// GET /api/admin/coupons — รายการคูปองทั้งหมด (รวมรหัสตั้งต้นที่ยังไม่ถูกแก้)
router.get('/admin/coupons', authRequired, adminOnly, databaseRequired, async (req, res, next) => {
  try {
    const now = new Date();
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 40) : '';
    const status = typeof req.query.status === 'string' ? req.query.status : 'all';
    const filter = search ? { code: { $regex: escapeRegex(search.toUpperCase()) } } : {};
    const saved = await Coupon.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    const savedCodes = new Set((await Coupon.find({}, 'code').lean()).map(c => c.code));
    const defaults = builtInCoupons().filter(c => !savedCodes.has(c.code) && (!search || c.code.includes(search.toUpperCase())));
    const rows = [...saved, ...defaults].map(c => present(c, now)).filter(c => status === 'all' || c.status === status);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/admin/coupons — สร้างคูปองใหม่ (หรือแทนที่รหัสตั้งต้นด้วยรหัสเดียวกัน)
router.post('/admin/coupons', authRequired, adminOnly, databaseRequired, async (req, res) => {
  try {
    const data = parseCoupon(req.body);
    await assertProductsExist(data.applicableProducts);
    const created = await Coupon.create({ ...data, usedCount: 0, createdBy: adminAudit(req), updatedBy: adminAudit(req) });
    res.status(201).json({ success: true, data: present(created.toObject()) });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ success: false, message: 'มีรหัสส่วนลดนี้อยู่แล้ว', field: 'code' });
    sendError(res, err);
  }
});

const idParam = z.string().refine(id => mongoose.Types.ObjectId.isValid(id));

// PUT /api/admin/coupons/:id — แก้ไขคูปอง (ออเดอร์เก่าไม่เปลี่ยน เพราะเก็บ snapshot ไว้แล้ว)
router.put('/admin/coupons/:id', authRequired, adminOnly, databaseRequired, async (req, res) => {
  try {
    if (!idParam.safeParse(req.params.id).success) return res.status(404).json({ success: false, message: 'ไม่พบคูปอง' });
    const data = parseCoupon(req.body);
    const existing = await Coupon.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ success: false, message: 'ไม่พบคูปอง' });
    if (existing.usedCount > 0 && data.code !== existing.code) {
      return res.status(409).json({ success: false, message: 'คูปองที่ถูกใช้แล้วเปลี่ยนรหัสไม่ได้ ให้ปิดใช้งานแล้วสร้างรหัสใหม่แทน', field: 'code' });
    }
    await assertProductsExist(data.applicableProducts);
    /* usedCount is not part of the input and is never written here, and a
       lower limit is checked against it in the same update — so an edit
       racing a checkout cannot set a limit below what is already used. */
    const updated = await Coupon.findOneAndUpdate(
      { _id: existing._id, ...(data.usageLimit != null ? { usedCount: { $lte: data.usageLimit } } : {}) },
      { $set: { ...data, updatedBy: adminAudit(req) } },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(409).json({ success: false, message: 'จำนวนสิทธิ์ต้องไม่น้อยกว่าจำนวนที่ถูกใช้ไปแล้ว', field: 'usageLimit' });
    res.json({ success: true, data: present(updated) });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ success: false, message: 'มีรหัสส่วนลดนี้อยู่แล้ว', field: 'code' });
    sendError(res, err);
  }
});

// PATCH /api/admin/coupons/:id/status — เปิด/ปิดใช้งาน (ไม่มีการลบ เพื่อรักษาประวัติออเดอร์)
router.patch('/admin/coupons/:id/status', authRequired, adminOnly, databaseRequired, async (req, res, next) => {
  try {
    if (!idParam.safeParse(req.params.id).success) return res.status(404).json({ success: false, message: 'ไม่พบคูปอง' });
    const parsed = z.object({ active: z.boolean() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'ต้องระบุสถานะ active เป็น true หรือ false' });
    const updated = await Coupon.findByIdAndUpdate(req.params.id, { $set: { active: parsed.data.active, updatedBy: adminAudit(req) } }, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'ไม่พบคูปอง' });
    res.json({ success: true, data: present(updated) });
  } catch (err) { next(err); }
});

export default router;
