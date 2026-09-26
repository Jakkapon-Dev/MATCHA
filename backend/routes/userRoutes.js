import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { User } from '../services/userStore.js';
import Order from '../models/Order.js';
import DeletionRequest from '../models/DeletionRequest.js';
import AuditLog from '../models/AuditLog.js';
import { authRequired, adminOnly } from '../middleware/auth.js';
import { THAI_PHONE_RE, POSTAL_CODE_RE } from '../utils/contactFormat.js';
import { MAX_BYTES, storeImage, deleteImage } from '../services/mediaStorage.js';
import { escapeRegex } from '../utils/regex.js';
import { requireDbReady } from '../middleware/dbGuard.js';

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
const checkDbReady = requireDbReady({ message: 'Member database unavailable' });

/* Shared with checkout. These two rules used to live only here, which is how
   POST /api/orders came to accept contact details the address book refuses. */
const phoneRegex = THAI_PHONE_RE;
const postalCodeRegex = POSTAL_CODE_RE;

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

    let created;
    try {
      created = await DeletionRequest.create({
        userId,
        email,
        reason,
        status: 'pending'
      });
    } catch (err) {
      if (err && (err.code === 11000 || String(err).includes('E11000'))) {
        return res.status(409).json({
          success: false,
          message: 'A data deletion request is already pending review for this account.'
        });
      }
      throw err;
    }

    try {
      if (typeof AuditLog.create === 'function') {
        await AuditLog.create({
          action: 'DELETION_REQUEST_CREATED',
          performedBy: email || userId,
          performedByRole: req.user?.role || 'Member',
          targetUserId: userId,
          targetEmail: email,
          targetEntity: 'DeletionRequest',
          targetEntityId: String(created._id),
          details: { reason },
          ip: req.ip
        });
      }
    } catch {
      // Non-blocking log failure
    }

    res.status(201).json({
      success: true,
      message: 'Deletion request submitted successfully and queued for admin review.',
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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.pageSize || req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const term = escapeRegex(req.query.search.trim());
      const regex = new RegExp(term, 'i');
      filter.$or = [
        { name: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { _id: regex }
      ];
    }

    if (req.query.tier && typeof req.query.tier === 'string' && req.query.tier.trim() && req.query.tier !== 'ALL') {
      const tier = req.query.tier.trim();
      if (tier === 'VIP') {
        filter.tier = /VIP/;
      } else {
        filter.tier = { $not: /VIP/ };
      }
    }

    let query = User.find(filter).select(fields).sort({ createdAt: -1 });
    if (typeof query.skip === 'function') query = query.skip(skip);
    if (typeof query.limit === 'function') query = query.limit(limit);

    let total = 0;
    if (mongoose.connection.db && typeof User.countDocuments === 'function') {
      try {
        total = await User.countDocuments(filter);
      } catch {
        total = 0;
      }
    }

    const [users, totals] = await Promise.all([
      query.lean(),
      Order.aggregate([
        { $match: { userId: { $ne: null }, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$userId', ordersCount: { $sum: 1 }, totalSpent: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } } } }
      ])
    ]);

    if (!total && Array.isArray(users)) {
      total = users.length;
    }

    const totalPages = Math.ceil(total / limit) || 1;
    const byUser = new Map(totals.map(({ _id, ...total }) => [_id, total]));

    res.json({
      success: true,
      data: users.map(user => ({ ...user, id: user._id, ordersCount: 0, totalSpent: 0, ...byUser.get(user._id) })),
      pagination: {
        total,
        page,
        limit,
        pageSize: limit,
        totalPages
      }
    });
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
