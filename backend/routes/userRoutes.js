import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { User } from '../services/userStore.js';
import Order from '../models/Order.js';
import DeletionRequest from '../models/DeletionRequest.js';
import { authRequired, adminOnly } from '../middleware/auth.js';
import { MAX_BYTES, storeImage, deleteImage } from '../services/mediaStorage.js';

const router = express.Router();
const fields = '_id name email role tier createdAt';
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 0 }
});
const avatarRateLimit = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });

// All user routes require authentication
router.use(authRequired);

// DB readiness middleware
const checkDbReady = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Member database unavailable' });
  }
  next();
};

// Regex rules for Thai postal code (5 digits) and phone (9-10 digits starting with 0)
const phoneRegex = /^0[0-9]{8,9}$/;
const postalCodeRegex = /^[0-9]{5}$/;

const profilePatchSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: z.union([
    z.literal(''),
    z.string().trim().regex(phoneRegex, 'Phone number must be a valid 9 or 10-digit Thai number starting with 0')
  ]).optional(),
}).strict().refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

const addressInputSchema = z.object({
  recipientName: z.string({ required_error: 'recipientName is required' })
    .trim()
    .min(1, 'Recipient name is required')
    .max(100, 'Recipient name is too long'),
  phone: z.string({ required_error: 'phone is required' })
    .trim()
    .regex(phoneRegex, 'Phone number must be a valid 9 or 10-digit Thai number starting with 0'),
  addressLine1: z.string({ required_error: 'addressLine1 is required' })
    .trim()
    .min(1, 'Address line 1 is required')
    .max(200, 'Address line 1 is too long'),
  addressLine2: z.string()
    .trim()
    .max(200, 'Address line 2 is too long')
    .optional()
    .default(''),
  subdistrict: z.string({ required_error: 'subdistrict is required' })
    .trim()
    .min(1, 'Subdistrict is required')
    .max(100, 'Subdistrict is too long'),
  district: z.string({ required_error: 'district is required' })
    .trim()
    .min(1, 'District is required')
    .max(100, 'District is too long'),
  province: z.string({ required_error: 'province is required' })
    .trim()
    .min(1, 'Province is required')
    .max(100, 'Province is too long'),
  postalCode: z.string({ required_error: 'postalCode is required' })
    .trim()
    .regex(postalCodeRegex, 'Postal code must be a 5-digit number'),
  country: z.string()
    .trim()
    .max(100)
    .optional()
    .default('Thailand'),
  label: z.string()
    .trim()
    .max(50)
    .optional()
    .default('Home'),
  isDefault: z.boolean().optional().default(false),
}).strict();

const addressPatchSchema = z.object({
  recipientName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().regex(phoneRegex, 'Phone number must be a valid 9 or 10-digit Thai number starting with 0').optional(),
  addressLine1: z.string().trim().min(1).max(200).optional(),
  addressLine2: z.string().trim().max(200).optional(),
  subdistrict: z.string().trim().min(1).max(100).optional(),
  district: z.string().trim().min(1).max(100).optional(),
  province: z.string().trim().min(1).max(100).optional(),
  postalCode: z.string().trim().regex(postalCodeRegex, 'Postal code must be a 5-digit number').optional(),
  country: z.string().trim().max(100).optional(),
  label: z.string().trim().max(50).optional(),
  isDefault: z.boolean().optional(),
}).strict().refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

function formatAddress(addr) {
  if (!addr) return null;
  const doc = addr.toObject ? addr.toObject() : addr;
  return {
    ...doc,
    id: doc._id || doc.id,
    _id: doc._id || doc.id,
  };
}

function safeProfile(user) {
  return {
    _id: user._id,
    id: user._id,
    name: user.name || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    email: user.email,
    role: user.role,
    tier: user.tier,
    avatarUrl: user.avatarUrl || '',
    authProviders: user.authProviders || [],
    emailVerified: Boolean(user.emailVerified),
  };
}

// The account page edits the signed-in member only. Email, role and tier are
// deliberately not accepted here: those identities are controlled by the
// authentication provider and the admin-only membership endpoint.
router.patch('/me', checkDbReady, async (req, res) => {
  const parsed = profilePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
    });
  }

  const updates = { ...parsed.data };
  if ('firstName' in updates || 'lastName' in updates) {
    const firstName = updates.firstName ?? req.user.firstName ?? '';
    const lastName = updates.lastName ?? req.user.lastName ?? '';
    updates.name = `${firstName} ${lastName}`.trim();
  }

  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (!user) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: safeProfile(user) });
  } catch {
    res.status(500).json({ success: false, message: 'Could not save profile' });
  }
});

router.post('/me/avatar', checkDbReady, avatarRateLimit, avatarUpload.single('image'), async (req, res, next) => {
  if (!req.file?.buffer) {
    return res.status(400).json({ success: false, message: 'Please choose an image to upload' });
  }

  let stored;
  try {
    stored = await storeImage(req.file.buffer);
    const userId = req.user?._id || req.user?.id;
    const previous = {
      url: req.user?.avatarUrl,
      thumbnailUrl: req.user?.avatarThumbnailUrl,
      publicId: req.user?.avatarPublicId
    };
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatarUrl: stored.url, avatarThumbnailUrl: stored.thumbnailUrl, avatarPublicId: stored.publicId || '' } },
      { new: true, runValidators: true }
    ).lean();
    if (!user) {
      await deleteImage(stored).catch(() => {});
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    if (previous.publicId || previous.url?.startsWith('/api/media/files/')) {
      await deleteImage(previous).catch(error => console.warn(`[Avatar] Old image cleanup failed: ${error.message}`));
    }
    res.status(201).json({ success: true, data: safeProfile(user) });
  } catch (error) {
    if (stored) await deleteImage(stored).catch(() => {});
    next(error);
  }
});

router.delete('/me/avatar', checkDbReady, avatarRateLimit, async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const previous = {
      url: req.user?.avatarUrl,
      thumbnailUrl: req.user?.avatarThumbnailUrl,
      publicId: req.user?.avatarPublicId
    };
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatarUrl: '', avatarThumbnailUrl: '', avatarPublicId: '' } },
      { new: true, runValidators: true }
    ).lean();
    if (!user) return res.status(404).json({ success: false, message: 'Member not found' });
    if (previous.publicId || previous.url?.startsWith('/api/media/files/')) {
      await deleteImage(previous).catch(error => console.warn(`[Avatar] Image cleanup failed: ${error.message}`));
    }
    res.json({ success: true, data: safeProfile(user) });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Privacy & Consent Endpoints (Self-Service)
// ==========================================

router.get('/me/consent', checkDbReady, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId).select('marketingConsent createdAt').lean();
    if (!user) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({
      success: true,
      data: user.marketingConsent || { optedIn: false, version: '1.0', updatedAt: user.createdAt }
    });
  } catch {
    res.status(503).json({ success: false, message: 'Could not load consent status' });
  }
});

router.patch('/me/consent', checkDbReady, async (req, res) => {
  const { optedIn, version = '1.0' } = req.body;
  if (typeof optedIn !== 'boolean') {
    return res.status(400).json({ success: false, message: 'optedIn must be a boolean' });
  }

  try {
    const userId = req.user?._id || req.user?.id;
    const consentPayload = {
      optedIn,
      version: typeof version === 'string' ? version.slice(0, 20) : '1.0',
      updatedAt: new Date()
    };
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { marketingConsent: consentPayload } },
      { new: true }
    ).select('marketingConsent').lean();

    if (!user) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({
      success: true,
      data: user.marketingConsent
    });
  } catch {
    res.status(503).json({ success: false, message: 'Could not update consent' });
  }
});

router.get('/me/deletion-request', checkDbReady, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const latest = await DeletionRequest.findOne({ userId }).sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: latest || null
    });
  } catch {
    res.status(503).json({ success: false, message: 'Could not load deletion request' });
  }
});

router.post('/me/deletion-request', checkDbReady, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const email = req.user?.email;
    const reason = typeof req.body.reason === 'string' ? req.body.reason.slice(0, 500).trim() : '';

    const existingPending = await DeletionRequest.findOne({ userId, status: 'pending' });
    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'A data deletion request is already pending review for this account.'
      });
    }

    const created = await DeletionRequest.create({
      userId,
      email,
      reason,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Deletion request submitted. Your personal identification data will be reviewed for removal; past orders will have customer identifiers anonymized to satisfy accounting compliance.',
      data: created
    });
  } catch {
    res.status(503).json({ success: false, message: 'Could not submit deletion request' });
  }
});

// ==========================================
// Address Book Endpoints (Member Self-Service)
// ==========================================

router.use('/me/addresses', checkDbReady);

router.get('/me/addresses', async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId).select('addresses').lean();
    if (!user) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({
      success: true,
      data: (user.addresses || []).map(formatAddress)
    });
  } catch {
    res.status(500).json({ success: false, message: 'Could not load addresses' });
  }
});

router.post('/me/addresses', async (req, res) => {
  const parsed = addressInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
    });
  }

  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Member not found' });

    if ((user.addresses || []).length >= 20) {
      return res.status(400).json({ success: false, message: 'Address limit reached (maximum 20 addresses)' });
    }

    const newAddress = {
      _id: `addr_${crypto.randomUUID().replace(/-/g, '')}`,
      ...parsed.data
    };
    if (user.addresses.length === 0) {
      newAddress.isDefault = true;
    } else if (newAddress.isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    user.addresses.push(newAddress);
    await user.save();

    const created = user.addresses[user.addresses.length - 1];
    res.status(201).json({
      success: true,
      data: formatAddress(created)
    });
  } catch {
    res.status(500).json({ success: false, message: 'Could not save address' });
  }
});

router.patch('/me/addresses/:id', async (req, res) => {
  const parsed = addressPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
    });
  }

  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Member not found' });

    const addr = user.addresses.find(a => (a._id || a.id) === req.params.id);
    if (!addr) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const updates = parsed.data;
    if (updates.isDefault === true) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    Object.assign(addr, updates);
    await user.save();

    res.json({
      success: true,
      data: formatAddress(addr)
    });
  } catch {
    res.status(500).json({ success: false, message: 'Could not update address' });
  }
});

router.delete('/me/addresses/:id', async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Member not found' });

    const index = user.addresses.findIndex(a => (a._id || a.id) === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = user.addresses[index].isDefault;
    user.addresses.splice(index, 1);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch {
    res.status(500).json({ success: false, message: 'Could not delete address' });
  }
});

// ==========================================
// Admin Directory & Tier Updates
// ==========================================

router.get('/', adminOnly, checkDbReady, async (req, res) => {
  try {
    const [users, totals] = await Promise.all([
      User.find({}).select(fields).sort({ createdAt: -1 }).lean(),
      Order.aggregate([
        { $match: { userId: { $ne: null }, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$userId', ordersCount: { $sum: 1 }, totalSpent: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } } } }
      ])
    ]);
    const byUser = new Map(totals.map(({ _id, ...total }) => [_id, total]));
    res.json({ success: true, data: users.map(user => ({ ...user, id: user._id, ordersCount: 0, totalSpent: 0, ...byUser.get(user._id) })) });
  } catch {
    res.status(503).json({ success: false, message: 'Could not load members' });
  }
});

router.put('/:id', adminOnly, checkDbReady, async (req, res) => {
  const { tier, ...extra } = req.body;
  if (Object.keys(extra).length || !['Regular Member', 'VIP Connoisseur'].includes(tier)) {
    return res.status(400).json({ success: false, message: 'Only a valid membership tier can be updated' });
  }
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { tier } }, { new: true, runValidators: true }).select(fields).lean();
    if (!user) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: { ...user, id: user._id } });
  } catch {
    res.status(503).json({ success: false, message: 'Could not update member' });
  }
});

export default router;
