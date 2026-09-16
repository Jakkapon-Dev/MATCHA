const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');
const Lookbook = require('../models/Lookbook');
const { defaultLookbooks, resolveLookbooks, defaults } = require('../services/lookbook');
const { isDemo, demoProduct } = require('../config/storeMode');

// Dynamic hooks for Product model and Auth middleware (in development by teammates)
const getProductModel = () => {
  try {
    return require('../models/Product');
  } catch {
    return mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  }
};
const getAuthGuards = () => {
  try {
    return require('../middleware/auth');
  } catch {
    return { authRequired: (req, res, next) => next(), adminOnly: (req, res, next) => next() };
  }
};
const authRequired = (req, res, next) => getAuthGuards().authRequired(req, res, next);
const adminOnly = (req, res, next) => getAuthGuards().adminOnly(req, res, next);

const router = express.Router();
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

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

// ฐานข้อมูลต้องพร้อมใช้งาน
router.use(['/lookbooks', '/admin/lookbooks'], (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'ฐานข้อมูลยังไม่พร้อม กรุณาลองใหม่' });
  }
  next();
});

async function allLooks() {
  const saved = await Lookbook.find().sort({ id: 1 }).lean();
  const byId = new Map(saved.map(l => [l.id, l]));
  return defaultLookbooks().map(l => byId.get(l.id) || l).concat(saved.filter(l => !defaults.some(d => d.id === l.id)));
}

async function findLinkedProducts(items) {
  const Product = getProductModel();
  const ids = [...new Set(items.map(i => i.productId))];
  const objectIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
  return Product.find({ $or: [{ id: { $in: ids } }, { _id: { $in: objectIds } }] })
    .select('id name price category color colorHex image variants sizes quantity gallery mediaRevision specs')
    .lean();
}

// Public Lookbooks API
router.get('/lookbooks', asyncRoute(async (req, res) => {
  const looks = await allLooks();
  const products = await findLinkedProducts(looks.flatMap(l => l.items));
  res.json({ success: true, data: resolveLookbooks(looks, isDemo ? products.map(demoProduct) : products) });
}));

// Admin Lookbooks API
router.get('/admin/lookbooks', authRequired, adminOnly, asyncRoute(async (req, res) => {
  res.json({ success: true, data: await allLooks() });
}));

router.put('/admin/lookbooks/:id', authRequired, adminOnly, asyncRoute(async (req, res) => {
  const id = z.string().regex(/^[\w-]{1,100}$/).parse(req.params.id);
  const input = lookInput.parse(req.body);

  const { assertActiveUrls } = require('./mediaRoutes');
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
}));

router.use(require('../middleware/errorHandler'));

module.exports = router;
module.exports.allLooks = allLooks;
module.exports.findLinkedProducts = findLinkedProducts;
