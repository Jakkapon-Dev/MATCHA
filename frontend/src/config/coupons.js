// รหัสส่วนลดตัดสินที่เซิร์ฟเวอร์ที่เดียว
//
// หน้าเว็บไม่มีตารางคูปองหรือสูตรคิดส่วนลดของตัวเองแล้ว คูปองอยู่ใน MongoDB
// ให้แอดมินจัดการได้ หน้าชำระเงินส่งรหัสไปถาม POST /api/coupons/quote แล้วแสดง
// ส่วนลดตามตัวเลขที่เซิร์ฟเวอร์ตอบกลับมา และตอนสร้างออเดอร์เซิร์ฟเวอร์ก็คิดใหม่
// อีกรอบจากรหัสอย่างเดียว ตัวเลขบนจอจึงไม่มีทางต่างจากยอดที่ถูกเรียกเก็บ
//
import { productsData } from '../data/productsData.js';

// ฟอร์มส่งรหัสมาแบบไหนก็ได้ ตัดช่องว่างและทำเป็นตัวพิมพ์ใหญ่ให้ตรงกับเซิร์ฟเวอร์
export function normaliseCode(code) {
  return String(code || '').trim().toUpperCase();
}

// The server decides the bundle discount from each garment's category, not
// from the isBundleItem flag (backend/routes/orderRoutes.js). This mirrors that
// rule line for line so the cart and checkout show what will actually be charged.
export const BUNDLE_DISCOUNT_RATE = 0.12;

const SHOE_SUBCATEGORIES = new Set(['Boots', 'Loafers', 'Sandals', 'Sneakers']);
const BUNDLE_SLOTS = ['tops', 'bottoms', 'shoes', 'accessories'];

export function bundleSlotFor(item) {
  if (!item) return null;
  let category = (item.category || '').trim().toLowerCase();
  let subCategory = (item.subCategory || '').trim();

  // If category information is missing, look up product metadata from frontend productsData
  if (!category) {
    const rawId = item.productId || item.id;
    if (rawId) {
      const targetId = String(rawId).trim().toLowerCase();
      const matched = Array.isArray(productsData)
        ? productsData.find(p => String(p?.id || '').trim().toLowerCase() === targetId)
        : null;
      if (matched) {
        category = (matched.category || '').trim().toLowerCase();
        subCategory = (matched.subCategory || '').trim();
      }
    }
  }

  if (category === 'shoes' || SHOE_SUBCATEGORIES.has(subCategory)) return 'shoes';
  if (category === 'tops' || category === 'outerwear') return 'tops';
  if (category === 'bottoms') return 'bottoms';
  if (category === 'accessories') return 'accessories';
  return null;
}

export function bundleDiscountFor(items = []) {
  const lines = items.map(item => ({
    slot: bundleSlotFor(item),
    qty: Math.max(1, parseInt(item?.quantity, 10) || 1),
    price: Number(String(item?.price ?? 0).replace(/[^0-9.]/g, '')) || 0,
  }));
  const counts = Object.fromEntries(BUNDLE_SLOTS.map(s => [s, 0]));
  lines.forEach(l => { if (l.slot) counts[l.slot] += l.qty; });
  const sets = Math.min(...BUNDLE_SLOTS.map(s => counts[s]));
  if (sets <= 0) return 0;

  const quota = Object.fromEntries(BUNDLE_SLOTS.map(s => [s, sets]));
  let amount = 0;
  for (const l of lines) {
    if (!l.slot || quota[l.slot] <= 0) continue;
    const n = Math.min(l.qty, quota[l.slot]);
    amount += n * l.price * BUNDLE_DISCOUNT_RATE;
    quota[l.slot] -= n;
  }
  return Math.round(amount * 100) / 100;
}

export function bundleQualifiedIndices(items = []) {
  const lines = items.map((item, index) => ({
    index,
    slot: bundleSlotFor(item),
    qty: Math.max(1, parseInt(item?.quantity, 10) || 1),
  }));
  const counts = Object.fromEntries(BUNDLE_SLOTS.map(s => [s, 0]));
  lines.forEach(l => { if (l.slot) counts[l.slot] += l.qty; });
  const sets = Math.min(...BUNDLE_SLOTS.map(s => counts[s]));
  if (sets <= 0) return new Set();

  const quota = Object.fromEntries(BUNDLE_SLOTS.map(s => [s, sets]));
  const qualified = new Set();
  for (const l of lines) {
    if (!l.slot || quota[l.slot] <= 0) continue;
    qualified.add(l.index);
    quota[l.slot] -= Math.min(l.qty, quota[l.slot]);
  }
  return qualified;
}

/* คูปองที่หน้าโปรโมชันรับไว้ รอให้หน้าชำระเงินมาหยิบไปใช้
 *
 * เก็บแค่ "รหัส" ตัวเดียว ไม่เก็บส่วนลดหรือชนิดคูปอง เพราะค่าใน localStorage
 * ผู้ใช้แก้เองได้ ถ้าเก็บตัวเลขไว้แล้วเชื่อตามนั้น ใครก็ตั้งส่วนลดให้ตัวเองได้
 * หน้าชำระเงินจึงเอารหัสไปถามเซิร์ฟเวอร์ใหม่เสมอ
 *
 * และต้องลบทิ้งทันทีที่ถูกใช้ ไม่งั้นคูปองจะค้างอยู่แล้วโผล่มาลดราคาให้เอง
 * ตอนสั่งซื้อครั้งถัดไปโดยที่ไม่มีใครกดรับ
 */
const PENDING_KEY = 'matcha_applied_coupon';

export function storePendingCoupon(code) {
  const clean = normaliseCode(code);
  if (!clean) return false;
  try {
    localStorage.setItem(PENDING_KEY, clean);
    return true;
  } catch {
    // โหมดส่วนตัว/ปิด storage — ผู้ใช้ยังกรอกรหัสเองได้จากข้อความที่คัดลอกไว้
    return false;
  }
}

/** อ่านแล้วลบทิ้งในจังหวะเดียว คูปองหนึ่งใบใช้ได้ครั้งเดียว — คืนแค่รหัส ให้เซิร์ฟเวอร์ตัดสิน */
export function takePendingCoupon() {
  let raw = null;
  try {
    raw = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
  } catch {
    return null;
  }
  // ค่าเก่าจากเวอร์ชันก่อนอาจเป็นอะไรก็ได้ เอาเฉพาะรูปแบบที่เป็นรหัสจริง
  const code = normaliseCode(raw);
  return /^[A-Z0-9_-]{3,30}$/.test(code) ? code : null;
}
