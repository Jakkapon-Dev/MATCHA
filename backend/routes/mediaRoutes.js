import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import Media from '../models/MediaAsset.js';
import Lookbook from '../models/Lookbook.js';
import DefaultProduct from '../models/Product.js';
import { MAX_BYTES, storeImage, storageRoot, isManagedUrl, deleteImage } from '../services/mediaStorage.js';
import { getAuthGuards, setAuthGuards } from '../middleware/auth.js';
import errorHandler from '../middleware/errorHandler.js';
import { assertActiveUrls, usage } from '../services/mediaService.js';
import { importLookbookMedia } from '../services/importLookbookMedia.js';
import { escapeRegex } from '../utils/regex.js';
import { requireDbReady } from '../middleware/dbGuard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dynamic hooks for Product model
const getProductModel = () => mongoose.models.Product || DefaultProduct;
const Product = new Proxy({}, { get: (_, prop) => getProductModel()[prop] });

export { setAuthGuards, getAuthGuards };
const authRequired = (req, res, next) => getAuthGuards().authRequired(req, res, next);
const adminOnly = (req, res, next) => getAuthGuards().adminOnly(req, res, next);

const router = express.Router();
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const galleryInput = z.object({
  images: z.array(z.object({ mediaId: objectId, color: z.string().trim().max(100).default('') })).min(1).max(12),
  revision: z.number().int().min(0)
}).strict();

// These catalogue images are public and must render on the separate shop origin.
router.use('/media/files', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
router.use('/media/files', express.static(storageRoot, {
  dotfiles: 'deny',
  index: false,
  immutable: true,
  maxAge: '1y',
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Committed demo assets keep existing MongoDB image URLs working on a fresh host.
const manifestPath = path.join(__dirname, '../demo-media/manifest.json');
let demoFiles = new Set();
try {
  demoFiles = new Set(JSON.parse(fs.readFileSync(manifestPath, 'utf8')).map(file => `/${file.name}`));
} catch {}

router.use('/media/files', (req, res, next) => {
  if (!demoFiles.has(req.path)) return next();
  res.sendFile(path.join(__dirname, '../demo-media', req.path.slice(1)));
});

router.use('/admin/media', requireDbReady);

router.use('/admin/media', authRequired, adminOnly);

router.get('/admin/media/products', asyncRoute(async (req, res) => {
  const search = escapeRegex(z.string().max(100).parse(req.query.search || ''));
  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
  const query = search ? { $or: [{ name: new RegExp(search, 'i') }, { id: new RegExp(search, 'i') }] } : {};
  const [data, total] = await Promise.all([
    Product.find(query).sort({ name: 1 }).skip((page - 1) * 40).limit(40).select('id name image color variants gallery mediaRevision quantity sizes price category').lean(),
    Product.countDocuments(query)
  ]);
  res.json({ success: true, data, total, page });
}));

router.get('/admin/media', asyncRoute(async (req, res) => {
  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
  const query = { archived: req.query.archived === 'true' };
  const [data, total] = await Promise.all([
    Media.find(query).sort({ createdAt: -1, _id: 1 }).skip((page - 1) * 40).limit(40).lean(),
    Media.countDocuments(query)
  ]);
  res.json({ success: true, data, total, page });
}));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1, fields: 1, fieldSize: 2000 } });

router.post('/admin/media', rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }), upload.single('image'), asyncRoute(async (req, res) => {
  const alt = z.string().trim().min(1).max(300).parse(req.body.alt);
  const file = await storeImage(req.file?.buffer);
  const asset = await Media.create({
    ...file,
    alt,
    originalName: path.basename(req.file.originalname).slice(0, 180),
    /* No invented fallback here any more. This route sits behind authRequired
       and adminOnly, so req.user is always set; the old `|| new ObjectId()`
       could only ever have written a random id pointing at no user, which
       reads as attribution and is not. If the uploader is somehow unknown,
       null says so. */
    uploadedBy: req.user?._id ? String(req.user._id) : null
  });
  res.status(201).json({ success: true, data: asset });
}));

export { usage };

router.get('/admin/media/:id/usage', asyncRoute(async (req, res) => {
  const asset = await Media.findById(objectId.parse(req.params.id)).lean();
  if (!asset) return res.status(404).json({ success: false, message: 'ไม่พบรูป' });
  res.json({ success: true, data: await usage(asset) });
}));

router.patch('/admin/media/:id', asyncRoute(async (req, res) => {
  const input = z.object({ alt: z.string().trim().min(1).max(300).optional(), archived: z.boolean().optional() }).strict().parse(req.body);
  const asset = await Media.findById(objectId.parse(req.params.id));
  if (!asset) return res.status(404).json({ success: false, message: 'ไม่พบรูป' });
  if (input.archived) {
    const references = await usage(asset);
    if (references.length) return res.status(409).json({ success: false, message: 'รูปนี้ยังใช้อยู่ กรุณาเปลี่ยนรูปในรายการที่เกี่ยวข้องก่อน', usage: references });
    if (!asset.archived) {
      await deleteImage(asset);
    }
  }
  Object.assign(asset, input);
  await asset.save();
  res.json({ success: true, data: asset });
}));

router.delete('/admin/media/:id', asyncRoute(async (req, res) => {
  const asset = await Media.findById(objectId.parse(req.params.id));
  if (!asset) return res.status(404).json({ success: false, message: 'ไม่พบรูป' });
  const references = await usage(asset);
  if (references.length) {
    return res.status(409).json({ success: false, message: 'รูปนี้ยังใช้อยู่ กรุณาเปลี่ยนรูปในรายการที่เกี่ยวข้องก่อน', usage: references });
  }
  await deleteImage(asset);
  await Media.findByIdAndDelete(asset._id);
  res.json({ success: true, message: 'ลบรูปภาพถาวรเรียบร้อยแล้ว' });
}));

export { assertActiveUrls };

router.put('/admin/media/products/:id/gallery', asyncRoute(async (req, res) => {
  const input = galleryInput.parse(req.body);
  const id = objectId.parse(req.params.id);
  const assets = await Media.find({ _id: { $in: input.images.map(i => i.mediaId) }, archived: false }).lean();
  const gallery = input.images.map(link => {
    const asset = assets.find(a => String(a._id) === link.mediaId);
    if (!asset) throw Object.assign(new Error('ไม่พบรูปที่เลือก กรุณาโหลดคลังใหม่'), { status: 400 });
    return { mediaId: asset._id, url: asset.url, alt: asset.alt, color: link.color };
  });
  const product = await Product.findById(id).lean();
  if (!product) return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' });
  const variants = (product.variants || []).map(v => ({ ...v, image: gallery.find(g => g.color === v.color)?.url || v.image }));
  for (const item of gallery) {
    if (item.color && item.color !== product.color && !variants.some(v => v.color === item.color)) {
      return res.status(400).json({ success: false, message: 'สีรูปต้องตรงกับสีสินค้าที่มีอยู่' });
    }
  }
  const revisionQuery = input.revision === 0 ? { $or: [{ mediaRevision: 0 }, { mediaRevision: { $exists: false } }] } : { mediaRevision: input.revision };
  const saved = await Product.findOneAndUpdate({ _id: id, ...revisionQuery }, { $set: { gallery, image: gallery[0].url, variants }, $inc: { mediaRevision: 1 } }, { returnDocument: 'after', runValidators: true });
  if (!saved) return res.status(409).json({ success: false, message: 'รูปสินค้าถูกแก้ไขแล้ว กรุณาโหลดใหม่' });
  res.json({ success: true, data: saved });
}));

// Repeatable import: never overwrite existing product facts or stock.
router.post('/admin/media/import-lookbook', asyncRoute(async (req, res) => {
  const data = await importLookbookMedia(req.user?._id ? String(req.user._id) : null);
  res.json({ success: true, data, message: 'นำเข้าภาพเดิมแล้ว สินค้าใหม่รอระบุสต็อกและไซซ์' });
}));

router.use(errorHandler);

export default router;
