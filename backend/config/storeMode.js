const { createHash } = require('node:crypto');
const { z } = require('zod');
const isDemo = process.env.SHOP_MODE !== 'live';
const DEMO_QUANTITY = 20;
const demoCustomer = { firstName: 'Demo', lastName: 'Customer', email: 'demo@example.invalid', phone: '', address: 'ที่อยู่ตัวอย่าง ไม่มีการจัดส่ง', city: 'Demo City', state: '', zipCode: '00000', country: 'Thailand' };

function demoProduct(source) {
  const product = source.toObject ? source.toObject() : { ...source };
  const category = String(product.category || '').toLowerCase();
  const sizes = product.sizes?.filter(Boolean);
  return { ...product, isDemo: true, quantity: DEMO_QUANTITY, stock: DEMO_QUANTITY, inStock: true,
    sizes: sizes?.length ? sizes : category.includes('shoe') ? ['EU 38', 'EU 39', 'EU 40', 'EU 41'] : category.includes('access') ? ['OS'] : ['S', 'M', 'L', 'XL'] };
}
const inputSchema = z.object({
  items: z.array(z.object({ productId: z.string().min(1).max(100), quantity: z.number().int().min(1).max(DEMO_QUANTITY), size: z.string().min(1).max(40), color: z.string().min(1).max(100) })).min(1).max(50),
  shippingOption: z.enum(['standard', 'express', 'premium']).default('standard'),
  couponCode: z.string().max(30).nullable().optional(),
  paymentMethod: z.literal('demo')
});
function demoRequest(body, rawKey, owner) {
  if (!owner) throw Object.assign(new Error('ไม่พบเซสชันทดลอง กรุณาโหลดหน้าใหม่'), { status: 400 });
  const key = z.string().min(16).max(128).parse(rawKey);
  const input = inputSchema.parse(body);
  const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const idempotencyKey = createHash('sha256').update(`${owner}:${key}`).digest('hex');
  return { fingerprint, idempotencyKey, input };
}
function validateDemoSelection(items, productMap) {
  for (const item of items) {
    const p = productMap.get(item.productId);
    if (!p || !p.sizes.includes(item.size) || !(p.color === item.color || p.variants?.some(v => v.color === item.color))) {
      throw Object.assign(new Error('สินค้า ไซซ์ หรือสีไม่ตรงกับข้อมูลทดลอง กรุณาเลือกสินค้าใหม่'), { status: 400 });
    }
  }
}
module.exports = { isDemo, DEMO_QUANTITY, demoCustomer, demoProduct, demoRequest, validateDemoSelection };
