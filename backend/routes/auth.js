import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import userStore from '../services/userStore.js';
import { User } from '../services/userStore.js';
import { requireAuth, requireRole, getJwtSecret } from '../middleware/auth.js';
import { sendPasswordReset } from '../services/email.js';

const router = express.Router();

// Rate limiter for authentication attempts to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'มีการพยายามเข้าสู่ระบบถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง'
  }
});

export const safeUser = (u) => {
  if (!u) return null;
  return {
    _id: u._id,
    id: u._id,
    name: u.name,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
    tier: u.tier,
    avatarUrl: u.avatarUrl || '',
    authProviders: u.authProviders || [],
    emailVerified: Boolean(u.emailVerified),
  };
};

export const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, emailVerified: Boolean(user.emailVerified) },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  );

// ---- Register ----
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, firstName, lastName, email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide valid email and password format.' });
    }
    const fullName = (typeof name === 'string' ? name : `${firstName || ''} ${lastName || ''}`).trim();
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Please provide email, password and name.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email address format' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // 1. ใส่ await ป้องกัน Promise Truthy Bug
    const existing = await userStore.findByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // 2. ใส่ await ป้องกัน Promise ในการสร้าง User
    const user = await userStore.createUser({ 
      name: fullName, 
      firstName, 
      lastName, 
      email: cleanEmail, 
      passwordHash 
    });

    res.status(201).json({ success: true, data: safeUser(user), token: signToken(user) });
  } catch (err) {
    /* The driver's own message can carry index names, collection names or
       connection detail, and these are the two endpoints most worth probing.
       It is logged where it is useful and not returned. */
    console.error('[auth]', err);
    res.status(500).json({ success: false, message: 'การยืนยันตัวตนขัดข้อง กรุณาลองใหม่อีกครั้ง' });
  }
});

// ---- Login ----
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid credentials format' });
    }
    const cleanEmail = email.toLowerCase().trim();

    // 3. ใส่ await ในการค้นหา User
    const user = await userStore.findByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password || '', user.passwordHash || '');
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({ success: true, data: safeUser(user), token: signToken(user) });
  } catch (err) {
    /* The driver's own message can carry index names, collection names or
       connection detail, and these are the two endpoints most worth probing.
       It is logged where it is useful and not returned. */
    console.error('[auth]', err);
    res.status(500).json({ success: false, message: 'การยืนยันตัวตนขัดข้อง กรุณาลองใหม่อีกครั้ง' });
  }
});

/* Exchange a Firebase Google identity for the JWT used by the rest of MatchA.

   accounts:lookup validates the Firebase ID token against the project selected
   by FIREBASE_WEB_API_KEY. The browser config is public by design, but keeping
   the lookup on the server means the app never trusts profile claims supplied
   directly by the browser. */
export async function verifyFirebaseIdToken(idToken, apiKey = process.env.FIREBASE_WEB_API_KEY) {
  if (!apiKey) throw Object.assign(new Error('Firebase authentication is not configured'), { status: 503 });

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    signal: AbortSignal.timeout(10000),
  });
  const payload = await response.json().catch(() => ({}));
  const identity = payload.users?.[0];

  const providerIds = (identity?.providerUserInfo || []).map((provider) => provider.providerId);
  const isGoogle = providerIds.includes('google.com');
  const isPassword = providerIds.includes('password');

  if (!response.ok || !identity?.localId || !identity?.email || (!isGoogle && !isPassword)) {
    throw Object.assign(new Error('Invalid Firebase identity'), { status: 401 });
  }

  // Google identities must be verified
  if (isGoogle && identity.emailVerified !== true) {
    throw Object.assign(new Error('Invalid Firebase identity'), { status: 401 });
  }

  identity.provider = isGoogle ? 'google' : 'password';
  return identity;
}

router.post('/firebase', authLimiter, async (req, res) => {
  try {
    const idToken = req.body?.idToken;
    if (typeof idToken !== 'string' || !idToken.trim()) {
      return res.status(400).json({ success: false, message: 'Firebase ID token is required' });
    }

    const identity = await verifyFirebaseIdToken(idToken.trim());
    const email = userStore.normalizeEmail(identity.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Authentication provider did not return an email address.',
      });
    }

    const providerName = identity.provider || 'google';

    // 1. Check if user is already linked with this Firebase UID
    let user = await User.findOne({ firebaseUid: identity.localId }).lean();

    // 2. If not found by UID, check if email has an existing account (e.g. from legacy JWT or another provider)
    if (!user) user = await userStore.findByEmail(email);

    if (!user) {
      // 3. Create new user if no existing record
      const displayName = String(identity.displayName || email.split('@')[0]).trim();
      const [firstName = '', ...lastParts] = displayName.split(/\s+/);
      try {
        user = await userStore.createUser({
          name: displayName,
          firstName,
          lastName: lastParts.join(' '),
          email,
          passwordHash: '',
          firebaseUid: identity.localId,
          authProviders: [providerName],
          avatarUrl: identity.photoUrl || '',
          emailVerified: Boolean(identity.emailVerified),
        });
      } catch (createErr) {
        // Prevent race condition if two devices log in at the exact same moment
        if (createErr?.code === 11000) {
          user = await userStore.findByEmail(email);
          if (user) {
            user = await User.findByIdAndUpdate(
              user._id,
              {
                $set: {
                  firebaseUid: identity.localId,
                  emailVerified: Boolean(identity.emailVerified || user.emailVerified),
                  ...(identity.photoUrl ? { avatarUrl: identity.photoUrl } : {}),
                },
                $addToSet: { authProviders: providerName },
              },
              { new: true, runValidators: true },
            ).lean();
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }
    } else {
      // 4. Existing account linking: attach UID, preserve order history/addresses, add provider
      user = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            firebaseUid: identity.localId,
            emailVerified: Boolean(identity.emailVerified || user.emailVerified),
            ...(identity.photoUrl ? { avatarUrl: identity.photoUrl } : {}),
          },
          $addToSet: { authProviders: providerName },
        },
        { new: true, runValidators: true },
      ).lean();
    }

    return res.json({ success: true, data: safeUser(user), token: signToken(user) });
  } catch (err) {
    const status = err?.status || 503;
    if (status >= 500) console.error('[auth] firebase', err);
    return res.status(status).json({
      success: false,
      message: status === 401 ? 'Firebase sign-in could not be verified' : 'Firebase sign-in is temporarily unavailable',
    });
  }
});

// Sync updated providers list (e.g. after link/unlink in Firebase)
router.post('/sync-providers', requireAuth, authLimiter, async (req, res) => {
  try {
    const idToken = req.body?.idToken;
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ success: false, message: 'Firebase ID token is required' });
    }

    const identity = await verifyFirebaseIdToken(idToken.trim());
    const activeProviders = (identity?.providerUserInfo || []).map((p) =>
      p.providerId === 'google.com' ? 'google' : p.providerId
    );

    if (activeProviders.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot remove the last sign-in method' });
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          authProviders: activeProviders,
          firebaseUid: identity.localId,
          emailVerified: Boolean(identity.emailVerified || req.user.emailVerified),
        },
      },
      { new: true, runValidators: true }
    ).lean();

    return res.json({ success: true, data: safeUser(updated) });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({
      success: false,
      message: err?.message || 'Could not synchronize sign-in methods',
    });
  }
});

/* Asking for a reset, and spending one.
 *
 * Both are rate limited harder than signing in. A reset endpoint is an
 * attractive thing to hammer: the first tells an attacker which addresses have
 * accounts if it is careless enough to say, and the second is a guessing game
 * against a token.
 */
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'ขอตั้งรหัสผ่านใหม่ถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง'
  }
});

const RESET_TTL_MINUTES = 60;
const ENABLE_LEGACY_PASSWORD_RESET = process.env.ENABLE_LEGACY_PASSWORD_RESET === 'true';

// ---- Ask for a reset link ----
router.post('/forgot-password', resetLimiter, async (req, res) => {
  if (!ENABLE_LEGACY_PASSWORD_RESET) {
    return res.status(410).json({
      success: false,
      message: 'ระบบรีเซ็ตรหัสผ่านแบบเดิมถูกปิดการใช้งานแล้ว กรุณาใช้ระบบรีเซ็ตของ Firebase',
    });
  }

  const { email, locale } = req.body || {};

  /* The same answer whether or not the address has an account.
   *
   * Anything else turns this endpoint into a way to find out who shops here:
   * feed it a list of addresses, keep the ones it treats differently. So no
   * 404, no "we could not find that account", and no difference in the shape
   * of the reply — the only honest thing to say is what will happen if the
   * address is one we know. */
  const answer = () => res.json({
    success: true,
    message: 'ถ้าอีเมลนี้มีบัญชีอยู่ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว'
  });

  try {
    if (typeof email !== 'string' || !email.trim()) return answer();

    const user = await userStore.findByEmail(userStore.normalizeEmail(email));
    if (!user) return answer();

    const issued = await userStore.issuePasswordReset(user._id, { ttlMinutes: RESET_TTL_MINUTES });
    if (!issued) return answer();

    const base = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(issued.token)}`;

    /* Not awaited, for the same reason the order confirmation is not: the
       reply must not depend on how fast a mail provider is feeling, and it
       says the same thing either way. */
    sendPasswordReset({ email: user.email, resetUrl, locale, ttlMinutes: RESET_TTL_MINUTES })
      .then((result) => {
        // The address is not logged. That a reset was requested is enough.
        if (!result.sent) console.warn(`[auth] reset link not sent: ${result.reason}`);
      })
      .catch((err) => console.warn(`[auth] reset link threw: ${err?.message}`));

    return answer();
  } catch (err) {
    console.error('[auth] forgot-password', err);
    // Even a failure here says the same thing, for the same reason.
    return answer();
  }
});

// ---- Spend a reset link ----
router.post('/reset-password', resetLimiter, async (req, res) => {
  if (!ENABLE_LEGACY_PASSWORD_RESET) {
    return res.status(410).json({
      success: false,
      message: 'ระบบรีเซ็ตรหัสผ่านแบบเดิมถูกปิดการใช้งานแล้ว กรุณาใช้ระบบรีเซ็ตของ Firebase',
    });
  }

  try {
    const { token, password } = req.body || {};

    if (typeof token !== 'string' || !token.trim() || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid request format' });
    }

    // The same floor the account was created under. A reset is not a way in
    // under it.
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userStore.consumePasswordReset(token.trim(), passwordHash);

    /* One answer for a token that never existed, one that has been spent, and
       one that ran out. Telling them apart tells someone guessing which of
       their guesses was closest. */
    if (!user) {
      return res.status(400).json({ success: false, message: 'ลิงก์นี้ใช้ไม่ได้แล้ว กรุณาขอลิงก์ใหม่' });
    }

    /* No token is issued here. Whoever just set this password should prove
       they know it, and signing them straight in would mean a stolen link
       becomes a session rather than only a password change the owner can see
       and undo. */
    return res.json({ success: true, message: 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบอีกครั้ง' });
  } catch (err) {
    console.error('[auth] reset-password', err);
    return res.status(500).json({ success: false, message: 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' });
  }
});

// ---- Who am I? ----
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: safeUser(req.user) });
});

// ---- Admin Check Example ----
router.get('/admin/check', requireAuth, requireRole('Admin'), (req, res) => {
  res.json({ success: true, data: { id: req.user._id, role: req.user.role, message: 'Admin access granted' } });
});

export default router;
export { router };
