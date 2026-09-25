import { z } from 'zod';
import Lookbook from '../models/Lookbook.js';
import { defaultLookbooks, resolveLookbooks, allLooks, findLinkedProducts } from '../services/lookbook.js';
import { isDemo, demoProduct } from '../config/storeMode.js';
import { assertActiveUrls } from '../services/mediaService.js';

const imageUrl = z.string().max(500).refine(
  s => /^\/api\/media\/files\/[a-f\d-]+(?:-thumb)?\.webp$/.test(s) || (/^\/images\/[\w/.-]+$/.test(s) && !s.includes('..')),
  'Invalid image path'
);

const lookInput = z.object({
  title: z.string().trim().min(1).max(180),
  heroImage: imageUrl,
  published: z.boolean(),
  revision: z.number().int().min(0),
  items: z.array(z.object({
    productId: z.string().min(1).max(100),
    color: z.string().max(100),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100)
  })).max(16).refine(items => new Set(items.map(i => i.productId)).size === items.length, 'Duplicate product in look')
}).strict();

// GET /api/lookbooks — Public Lookbooks API
export async function getLookbooks(req, res) {
  const looks = await allLooks();
  const products = await findLinkedProducts(looks.flatMap(l => l.items ?? []));
  res.json({ success: true, data: resolveLookbooks(looks, isDemo ? products.map(demoProduct) : products) });
}

// GET /api/admin/lookbooks — Admin Lookbooks listing
export async function getAdminLookbooks(req, res) {
  res.json({ success: true, data: await allLooks() });
}

// PUT /api/admin/lookbooks/:id — Admin update or create lookbook
export async function updateAdminLookbook(req, res) {
  const id = z.string().regex(/^[\w-]{1,100}$/).parse(req.params.id);
  const input = lookInput.parse(req.body);

  await assertActiveUrls([input.heroImage]);

  const products = await findLinkedProducts(input.items);
  for (const link of input.items) {
    const product = products.find(p => p.id === link.productId || String(p._id) === link.productId);
    if (!product || (link.color && product.color !== link.color && !product.variants?.some(v => v.color === link.color))) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกสินค้าและสีที่มีอยู่จริง' });
    }
  }

  const base = defaultLookbooks().find(l => l.id === id);
  const existing = await Lookbook.findOne({ id }).lean();
  if (!existing) {
    if (input.revision !== 0) return res.status(409).json({ success: false, message: 'ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่' });
    const created = await Lookbook.create({
      ...input,
      id,
      revision: 1,
      editorial: base?.editorial || { season: 'Autumn', palette: [], detailImages: [] }
    });
    return res.json({ success: true, data: created });
  }

  const saved = await Lookbook.findOneAndUpdate(
    { id, revision: input.revision },
    { $set: { title: input.title, heroImage: input.heroImage, published: input.published, items: input.items }, $inc: { revision: 1 } },
    { returnDocument: 'after', runValidators: true }
  );
  if (!saved) return res.status(409).json({ success: false, message: 'มีการแก้ไขจากที่อื่น กรุณาโหลดใหม่ก่อนบันทึก' });
  res.json({ success: true, data: saved });
}

export default {
  getLookbooks,
  getAdminLookbooks,
  updateAdminLookbook
};
