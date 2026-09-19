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

const userSchema = new mongoose.Schema(
  {
    _id: { type: String },
    name: { type: String, default: '' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Named passwordHash, not password, because that is what it holds: callers
    // hash before they get here. A field called `password` invites a plaintext
    // write, and a pre-save hook that hashes would double-hash a value that
    // arrives already hashed.
    passwordHash: { type: String, default: '' },
    role: { type: String, enum: ['Member', 'Admin'], default: 'Member' },
    tier: { type: String, default: 'Regular Member' },
    addresses: { type: Array, default: [] }
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
   requireAuth already falls back to the identity inside the verified token, and
   returning null lets it.

   findByEmail deliberately has no such guard: register asks it whether an
   address is taken, and answering "no" when the question could not be asked
   would let a duplicate through. There, failing loudly is the safe direction. */
export async function findById(id) {
  if (!id) return null;
  if (mongoose.connection.readyState !== 1) return null;
  try {
    return await User.findById(String(id)).lean();
  } catch (err) {
    console.warn('[auth] User lookup failed, falling back to the token:', err.message);
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
  tier = 'Regular Member'
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
    addresses: []
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

export default { init, findByEmail, findById, createUser, ensureAdminSeed, normalizeEmail };
export { User };
