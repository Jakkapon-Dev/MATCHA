import mongoose from 'mongoose';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

/* Accounts live in MongoDB.

   They used to live in backend/data/users.json, written with fs.writeFileSync
   to the container's own disk. That file is gitignored, so it was never part of
   a deploy and every container started without it, and the host has no
   persistent disk — Render states plainly that disks are not available on the
   free plan. Nothing seeds users at boot either; `start` is just `node
   server.js`. So every account anyone registered survived only until the next
   deploy or restart, and the free plan spins the service down when it is idle.

   The id format is unchanged. Records still carry a `u_…` string as their id,
   now as the Mongo _id, which is why this migration does not touch
   Order.userId, Cart.userId or MediaAsset.uploadedBy — all typed String for
   exactly these ids — and why tokens already issued keep working: the token
   carries `id: user._id`, and that value still resolves. */

export const addressSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => `addr_${crypto.randomUUID().replace(/-/g, '')}` },
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: '', trim: true },
    subdistrict: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'Thailand', trim: true },
    label: { type: String, default: 'Home', trim: true },
    isDefault: { type: Boolean, default: false }
  },
  { _id: false, timestamps: true }
);

addressSchema.virtual('id').get(function () {
  return this._id;
});
addressSchema.set('toJSON', { virtuals: true });
addressSchema.set('toObject', { virtuals: true });

const userSchema = new mongoose.Schema(
  {
    _id: { type: String },
    name: { type: String, default: '' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '', trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Named passwordHash, not password, because that is what it holds: callers
    // hash before they get here. A field called `password` invites a plaintext
    // write, and a pre-save hook that hashes would double-hash a value that
    // arrives already hashed.
    passwordHash: { type: String, default: '' },
    role: { type: String, enum: ['Member', 'Admin'], default: 'Member' },
    tier: { type: String, default: 'Regular Member' },
    addresses: { type: [addressSchema], default: [] },
    // Leave this field absent for password-only accounts. A sparse unique index
    // ignores missing fields, but it would still index an explicit null and
    // make the second ordinary account fail with a duplicate-key error.
    firebaseUid: { type: String, sparse: true, unique: true },
    authProviders: { type: [String], default: [] },
    emailVerified: { type: Boolean, default: false },
    avatarUrl: { type: String, default: '' },
    // Storage metadata is private and lets us remove only avatars uploaded by
    // this service. Provider-hosted photos (for example Google) have no id and
    // are therefore never sent to Cloudinary's deletion API.
    avatarPublicId: { type: String, default: '' },
    avatarThumbnailUrl: { type: String, default: '' },
    marketingConsent: {
      optedIn: { type: Boolean, default: false },
      version: { type: String, default: '1.0' },
      updatedAt: { type: Date, default: Date.now }
    },

    /* Password reset.

       Only the SHA-256 of the token is kept, never the token itself. Anyone
       reading this collection — a backup, a leaked dump, an over-broad admin
       query — holds something they cannot reset an account with, because the
       hash is what is compared and the raw value only ever existed in the
       email. SHA-256 rather than bcrypt on purpose: this is 32 bytes of
       randomness, not a password, so there is nothing to slow an attacker
       down about and a fast digest keeps the lookup a single indexed query. */
    passwordResetTokenHash: { type: String, default: null, index: true },
    passwordResetExpires: { type: Date, default: null },

    /* When the password last changed.

       Tokens already issued carry an `iat` and cannot be recalled, so a reset
       that only changed the password would leave whoever prompted it still
       signed in on their own device — which is the one thing a person resetting
       a password is usually trying to stop. middleware/auth.js refuses any
       token minted before this moment. */
    passwordChangedAt: { type: Date, default: null },
    isAnonymized: { type: Boolean, default: false },
    anonymizedAt: { type: Date, default: null }
  },
  { timestamps: true, collection: 'users' }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

export async function findByEmail(email) {
  return User.findOne({ email: normalizeEmail(email) }).lean();
}

/* Resolving the request's user must not depend on the database being up.

   Every authenticated request passes through here. Without the guard, a query
   issued while the connection is down does not fail — Mongoose buffers it and
   throws ten seconds later, so each request hung for ten seconds and then came
   back 401, hiding a database outage behind what looks like a rejected login.
   requireAuth treats a missing lookup as unauthorised, so an outage fails
   closed rather than trusting stale claims from a signed token.

   findByEmail deliberately has no such guard: register asks it whether an
   address is taken, and answering "no" when the question could not be asked
   would let a duplicate through. There, failing loudly is the safe direction. */
export async function findById(id) {
  if (!id) return null;
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return null;
  try {
    return await User.findById(String(id)).lean();
  } catch (err) {
    console.warn('[auth] User lookup failed:', err.message);
    return null;
  }
}

export async function createUser({
  name,
  firstName,
  lastName,
  email,
  passwordHash,
  role = 'Member',
  tier = 'Regular Member',
  firebaseUid = null,
  authProviders = [],
  emailVerified = false,
  avatarUrl = ''
}) {
  const doc = await User.create({
    _id: `u_${crypto.randomUUID().replace(/-/g, '')}`,
    name,
    firstName: firstName || '',
    lastName: lastName || '',
    email: normalizeEmail(email),
    passwordHash,
    role,
    tier,
    addresses: [],
    ...(firebaseUid ? { firebaseUid } : {}),
    authProviders,
    emailVerified: Boolean(emailVerified),
    avatarUrl
  });
  const user = doc.toObject();
  user.id = user._id;
  return user;
}

export async function ensureAdminSeed(adminPassword = 'admin1234') {
  const existing = await findByEmail('admin@matcha.com');
  if (existing) return null;
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await createUser({
    name: 'MatchA Admin',
    firstName: 'MatchA',
    lastName: 'Admin',
    email: 'admin@matcha.com',
    passwordHash,
    role: 'Admin',
    tier: 'VIP Connoisseur'
  });
  /* The seeded password is not logged. It used to be printed in full on every
     start that created it, which on a hosted service writes the administrator's
     password into the platform's log viewer, where it stays and is readable by
     anyone who can see the logs. */
  console.log('[auth] Seeded admin account: admin@matcha.com');
  return admin;
}

// Seeding needs a live connection, and server.js connects after the routes are
// mounted, so init waits rather than assuming one is already up.
const connected = () =>
  mongoose.connection.readyState === 1
    ? Promise.resolve()
    : new Promise((resolve) => mongoose.connection.once('connected', resolve));

export async function init(opts = {}) {
  await connected();
  await ensureAdminSeed(opts.adminPassword || process.env.SEED_ADMIN_PASSWORD || 'admin1234');
}

/* Issue a reset token for an account, returning the raw value for the email.

   The caller gets the only copy that will ever exist outside the customer's
   inbox; what is stored is its digest. */
export async function issuePasswordReset(userId, { ttlMinutes = 60 } = {}) {
  if (mongoose.connection.readyState !== 1) return null;
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + ttlMinutes * 60 * 1000);

  const updated = await User.findByIdAndUpdate(
    String(userId),
    { $set: { passwordResetTokenHash: tokenHash, passwordResetExpires: expires } },
    { new: true }
  ).lean();

  return updated ? { token, expires } : null;
}

/* Spend a reset token: set the new password and make the token unusable.

   The expiry is part of the query rather than a check afterwards, so a token
   that ran out cannot be used by a caller that raced the clock, and the token
   fields are cleared in the same write that sets the password — one operation,
   so a token can never be spent twice. */
export async function consumePasswordReset(rawToken, newPasswordHash) {
  if (mongoose.connection.readyState !== 1) return null;
  const tokenHash = crypto.createHash('sha256').update(String(rawToken || '')).digest('hex');

  return User.findOneAndUpdate(
    { passwordResetTokenHash: tokenHash, passwordResetExpires: { $gt: new Date() } },
    {
      $set: {
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date(),
        passwordResetTokenHash: null,
        passwordResetExpires: null,
      },
    },
    { new: true }
  ).lean();
}

export default { init, findByEmail, findById, createUser, ensureAdminSeed, normalizeEmail, issuePasswordReset, consumePasswordReset };
export { User };
