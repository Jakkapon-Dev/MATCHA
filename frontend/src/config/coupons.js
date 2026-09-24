// ตารางคูปองชุดเดียวกับที่เซิร์ฟเวอร์ใช้ตัดสิน — คู่กับ backend/config/coupons.js
//
// เซิร์ฟเวอร์เป็นคนคิดส่วนลดจริงตอนสร้างออเดอร์ ฝั่งหน้าเว็บมีตารางนี้ไว้แสดงผล
// ล่วงหน้าเท่านั้น ถ้าสองไฟล์นี้ไม่ตรงกัน ยอดบนจอจะไม่ตรงกับที่ถูกเรียกเก็บจริง
// ซึ่งเป็นความเสี่ยงแบบเดียวกับที่เคยเกิดกับค่าจัดส่งมาแล้ว
//
// ก่อนหน้านี้ไม่มีไฟล์นี้: รหัสถูกประกาศซ้ำอยู่สองที่ ที่หัว PaymentPage.jsx
// และหัว backend/routes/orderRoutes.js โดยไม่มีอะไรยึดให้ตรงกัน
//
// `label` อยู่ฝั่งนี้ที่เดียว เพราะเป็นข้อความที่แสดงผล ไม่ใช่ตัวเลขที่ใช้คิดเงิน
export const COUPONS = {
  // '01' / '02' / '03' ถูกลบออก — เป็นรหัสสองหลักที่เดาได้ ไม่เคยโฆษณา และ '03'
  // ลดครึ่งราคาทั้งออเดอร์ ตารางนี้ต้องตรงกับ backend/config/coupons.js เสมอ
  'MATCHA15': { discount: 15, type: 'percent', label: '15% OFF' },
  'WELCOME10': { discount: 10, type: 'percent', label: '10% OFF' },
  'FREESHIP': { discount: 0, type: 'free_shipping', label: 'Free Shipping' },
};

/* เคยมี FEATURED_CODES ไว้เติมลงข้อความ "กรอกรหัสผิด" — ถอดออกแล้ว เพราะการ
   บอกรหัสที่ใช้ได้ในข้อความนั้น ทำให้คนที่เดารหัสมั่วครั้งเดียวได้ FREESHIP ไป
   ทั้งที่ไม่ได้ประกาศไว้ที่ไหนเลย ส่วน MATCHA15 ประกาศอยู่แล้วบนหน้าแรกและใน
   placeholder ของช่องกรอก จึงไม่ต้องบอกซ้ำ */

// ฟอร์มส่งรหัสมาแบบไหนก็ได้ ตัดช่องว่างและทำเป็นตัวพิมพ์ใหญ่ให้ตรงกับเซิร์ฟเวอร์
export function normaliseCode(code) {
  return String(code || '').trim().toUpperCase();
}

export function couponFor(code) {
  return COUPONS[normaliseCode(code)] || null;
}

// ปัดเศษที่จุดคำนวณเหมือนฝั่งเซิร์ฟเวอร์ ตัวเลขบนจอจะได้ตรงกับใบเสร็จ
export function discountFor(coupon, subtotal) {
  if (!coupon || coupon.type !== 'percent') return 0;
  return Math.round(subtotal * (coupon.discount / 100) * 100) / 100;
}

// The server decides the bundle discount from each garment's category, not
// from the isBundleItem flag (backend/routes/orderRoutes.js). This mirrors that
// rule line for line so the cart and checkout show what will actually be charged.
export const BUNDLE_DISCOUNT_RATE = 0.12;

const SHOE_SUBCATEGORIES = new Set(['Boots', 'Loafers', 'Sandals', 'Sneakers']);
const BUNDLE_SLOTS = ['tops', 'bottoms', 'shoes', 'accessories'];

export function bundleSlotFor(item) {
  if (!item) return null;
  const category = (item.category || '').trim().toLowerCase();
  const subCategory = (item.subCategory || '').trim();
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

/* คูปองที่หน้าโปรโมชันรับไว้ รอให้หน้าชำระเงินมาหยิบไปใช้
 *
 * เก็บแค่ "รหัส" ตัวเดียว ไม่เก็บส่วนลดหรือชนิดคูปอง เพราะค่าใน localStorage
 * ผู้ใช้แก้เองได้ ถ้าเก็บตัวเลขไว้แล้วเชื่อตามนั้น ใครก็ตั้งส่วนลดให้ตัวเองได้
 * ฝั่งนี้จึงเอารหัสไปเทียบกับตารางด้านบนใหม่เสมอ (เซิร์ฟเวอร์ก็คิดใหม่อีกชั้น)
 *
 * และต้องลบทิ้งทันทีที่ถูกใช้ ไม่งั้นคูปองจะค้างอยู่แล้วโผล่มาลดราคาให้เอง
 * ตอนสั่งซื้อครั้งถัดไปโดยที่ไม่มีใครกดรับ
 */
const PENDING_KEY = 'matcha_applied_coupon';

export function storePendingCoupon(code) {
  const clean = normaliseCode(code);
  if (!COUPONS[clean]) return false;
  try {
    localStorage.setItem(PENDING_KEY, clean);
    return true;
  } catch {
    // โหมดส่วนตัว/ปิด storage — ผู้ใช้ยังกรอกรหัสเองได้จากข้อความที่คัดลอกไว้
    return false;
  }
}

/** อ่านแล้วลบทิ้งในจังหวะเดียว คูปองหนึ่งใบใช้ได้ครั้งเดียว */
export function takePendingCoupon() {
  let raw = null;
  try {
    raw = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
  } catch {
    return null;
  }
  const code = normaliseCode(raw);
  const coupon = COUPONS[code];
  return coupon ? { ...coupon, code } : null;
}
