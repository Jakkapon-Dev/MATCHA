// อัตราค่าส่งชุดเดียวกับที่เซิร์ฟเวอร์ใช้ตัดสิน — คู่กับ backend/config/coupons.js
//
// เซิร์ฟเวอร์เป็นคนคิดราคาจริงตอนสร้างออเดอร์ ฝั่งหน้าเว็บมีตารางนี้ไว้แสดงผล
// ล่วงหน้าเท่านั้น หน้าไหนคิดตัวเลขเอง ยอดบนจอจะไม่ตรงกับใบเสร็จ ซึ่งเคยเกิด
// มาแล้ว: หน้าตะกร้าคิดค่าส่งคงที่ $10 ส่วน checkout กับออเดอร์จริงคิด $0
export const SHIPPING_OPTIONS = {
  standard: 0,
  express: 12.0,
  premium: 25.0
};

export const FREE_SHIPPING_THRESHOLD = 100;

// ตะกร้ายังไม่รู้ว่าผู้ซื้อจะเลือกวิธีจัดส่งไหน จึงแสดงตามค่าตั้งต้นที่ checkout ใช้
export const DEFAULT_SHIPPING_OPTION = 'standard';

// ตรงกับ server.js: คูปองส่งฟรี หรือยอดถึงเกณฑ์ ทำให้ค่าส่งเป็นศูนย์ทุกวิธี
export function shippingCostFor(subtotal, option = DEFAULT_SHIPPING_OPTION, { freeShippingCoupon = false } = {}) {
  if (freeShippingCoupon || subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_OPTIONS[option] ?? 0;
}
