// ร้านทั้งระบบตั้งราคาเป็น USD แต่ Stripe PromptPay รับได้แค่สกุล THB เท่านั้น — ใช้อัตรา
// แลกเปลี่ยนคงที่นี้แปลงยอดเฉพาะตอนสร้าง PaymentIntent ของ PromptPay เท่านั้น ไม่กระทบราคา
// สินค้า/ยอดที่แสดงในหน้าอื่นของเว็บเลย เป็นอัตราคงที่สำหรับโหมดทดสอบ/สาธิตเท่านั้น
// ไม่ใช่อัตราตลาดจริงแบบเรียลไทม์ — ถ้าจะขึ้นระบบจริงต้องเปลี่ยนไปเรียก FX API แทน
export const USD_TO_THB_RATE = 36;

export function usdToThb(usdAmount) {
  return Math.round(Number(usdAmount) * USD_TO_THB_RATE * 100) / 100;
}

export function usdToThbSatang(usdAmount) {
  return Math.round(Number(usdAmount) * USD_TO_THB_RATE * 100);
}

export default { USD_TO_THB_RATE, usdToThb, usdToThbSatang };
