/* The rest of the way in and out: signing up, signing in, staying signed in,
 * being turned away, forgetting a password, and changing which providers an
 * account answers to.
 *
 * Account linking has a file of its own (auth-account-linking.test.js) and the
 * takeover rule has another (firebase-account-takeover.test.js). These cover
 * everything around them.
 */

import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import userStore, { User } from '../services/userStore.js';
import { getJwtSecret } from '../middleware/auth.js';

/* ENABLE_LEGACY_PASSWORD_RESET is read once, when routes/auth.js is first
   evaluated, so it has to be set before the module is pulled in — hence the
   dynamic import. Production has it on; these tests cover the live path. */
process.env.ENABLE_LEGACY_PASSWORD_RESET = 'true';
const { default: authRoutes, signToken } = await import('../routes/auth.js');

let server, base;

const PASSWORD = 'correct-horse-battery';
let PASSWORD_HASH;

const MEMBER = () => ({
  _id: 'u_member',
  email: 'member@example.com',
  name: 'Member One',
  role: 'Member',
  tier: 'Regular Member',
  passwordHash: PASSWORD_HASH,
  authProviders: ['password'],
  firebaseUid: 'firebase-member',
  emailVerified: true
});

/* requireAuth looks the member up through userStore.findById, which returns
   null unless Mongo is connected. Standing a connection up is what makes the
   database the source of truth for these tests rather than the token. */
function withDatabase(t, row) {
  const state = mongoose.connection.readyState;
  const db = mongoose.connection.db;
  mongoose.connection.readyState = 1;
  mongoose.connection.db = {};
  t.after(() => {
    mongoose.connection.readyState = state;
    mongoose.connection.db = db;
  });
  mock.method(User, 'findById', () => ({
    select: () => ({ lean: async () => row }),
    lean: async () => row
  }));
}

const post = (path, body, headers = {}) => fetch(`${base}${path}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(body)
});

const get = (path, headers = {}) => fetch(`${base}${path}`, { headers });

function stubIdentity(identity) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (!String(url).includes('identitytoolkit')) return realFetch(url, options);
    return { ok: true, json: async () => ({ users: [identity] }) };
  };
  return () => { globalThis.fetch = realFetch; };
}

before(async () => {
  process.env.FIREBASE_WEB_API_KEY ||= 'test-web-key';
  PASSWORD_HASH = await bcrypt.hash(PASSWORD, 4);
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  mock.restoreAll();
  await new Promise(resolve => server.close(resolve));
});

/* ------------------------------------------------------------------ *
 * Signing up
 * ------------------------------------------------------------------ */

test('signing up creates the member and hands back a session', async (t) => {
  t.after(() => mock.restoreAll());
  mock.method(userStore, 'findByEmail', async () => null);
  let written = null;
  mock.method(userStore, 'createUser', async (payload) => {
    written = payload;
    return { ...MEMBER(), ...payload, _id: 'u_new' };
  });

  const res = await post('/auth/register', {
    name: 'New Member', email: 'New.Member@Example.COM ', password: PASSWORD
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.equal(written.email, 'new.member@example.com', 'the address is normalised before it is stored');
  // The password is hashed on the way in and never kept in the clear.
  assert.notEqual(written.passwordHash, PASSWORD);
  assert.ok(written.passwordHash.startsWith('$2'), 'bcrypt');
  assert.equal(JSON.stringify(body).includes(PASSWORD), false, 'the password is not echoed back');
  assert.equal(body.data.passwordHash, undefined);
  assert.ok(body.token, 'the member is signed in straight away');
});

test('signing up refuses a weak password, a bad address and a missing name', async (t) => {
  t.after(() => mock.restoreAll());
  mock.method(userStore, 'findByEmail', async () => null);
  let created = false;
  mock.method(userStore, 'createUser', async () => { created = true; return {}; });

  const cases = [
    [{ name: 'A', email: 'a@b.co', password: 'short' }, 'a password under eight characters'],
    [{ name: 'A', email: 'not-an-email', password: PASSWORD }, 'an address with no domain'],
    [{ name: '', email: 'a@b.co', password: PASSWORD }, 'no name'],
    [{ name: 'A', email: 'a@b.co' }, 'no password at all']
  ];
  for (const [payload, what] of cases) {
    const res = await post('/auth/register', payload);
    assert.equal(res.status, 400, `rejected: ${what}`);
  }
  assert.equal(created, false, 'nothing was written');
});

test('a second signup on the same address is refused, and says nothing else', async (t) => {
  t.after(() => mock.restoreAll());
  mock.method(userStore, 'findByEmail', async () => MEMBER());

  const res = await post('/auth/register', {
    name: 'Impostor', email: MEMBER().email, password: PASSWORD
  });
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.token, undefined, 'no session for an address you do not own');
  assert.equal(JSON.stringify(body).includes('Member One'), false, 'and nothing about whose it is');
});

/* ------------------------------------------------------------------ *
 * Signing in
 * ------------------------------------------------------------------ */

test('signing in with the right password returns a usable session', async (t) => {
  t.after(() => mock.restoreAll());
  mock.method(userStore, 'findByEmail', async () => MEMBER());

  const res = await post('/auth/login', { email: ' Member@Example.com ', password: PASSWORD });
  const body = await res.json();

  assert.equal(res.status, 200);
  const claims = jwt.verify(body.token, getJwtSecret());
  assert.equal(claims.id, 'u_member');
  assert.equal(claims.role, 'Member');
  assert.equal(claims.email, MEMBER().email, 'the session carries the normalized address used for legacy order ownership');
  assert.equal(body.data.passwordHash, undefined);
});

test('a wrong password and an unknown address are told apart by nothing', async (t) => {
  t.after(() => mock.restoreAll());
  const seen = [];
  mock.method(userStore, 'findByEmail', async (email) => (email === MEMBER().email ? MEMBER() : null));

  const wrong = await post('/auth/login', { email: MEMBER().email, password: 'not-the-password' });
  const unknown = await post('/auth/login', { email: 'nobody@example.com', password: PASSWORD });
  seen.push(await wrong.json(), await unknown.json());

  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  // Same status and same words, so the endpoint cannot be used to find out
  // which addresses have accounts.
  assert.equal(seen[0].message, seen[1].message);
  assert.equal(seen[0].token, undefined);
});

test('an account with no password cannot be signed into with an empty one', async (t) => {
  /* Members created through Google have passwordHash: ''. bcrypt.compare
     against an empty hash must fail rather than wave anybody through. */
  t.after(() => mock.restoreAll());
  mock.method(userStore, 'findByEmail', async () => ({ ...MEMBER(), passwordHash: '', authProviders: ['google'] }));

  for (const password of ['', ' ', PASSWORD]) {
    const res = await post('/auth/login', { email: MEMBER().email, password });
    assert.equal(res.status, 401, `refused for ${JSON.stringify(password)}`);
  }
});

/* ------------------------------------------------------------------ *
 * Staying signed in, and protected routes
 * ------------------------------------------------------------------ */

test('a session survives the request that created it', async (t) => {
  t.after(() => mock.restoreAll());
  mock.method(userStore, 'findByEmail', async () => MEMBER());
  withDatabase(t, MEMBER());

  const token = (await (await post('/auth/login', { email: MEMBER().email, password: PASSWORD })).json()).token;

  // The same token, on a later request, still identifies the member — which
  // is all "stay signed in across a reload" means on the server side.
  const me = await get('/auth/me', { Authorization: `Bearer ${token}` });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).data.email, MEMBER().email);
});

test('protected routes refuse a missing, malformed, unsigned or expired token', async () => {
  const forged = jwt.sign({ id: 'u_member', role: 'Admin' }, 'not-the-real-secret');
  const expired = jwt.sign({ id: 'u_member', role: 'Member' }, getJwtSecret(), { expiresIn: -60 });
  const alg_none = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
    + '.' + Buffer.from(JSON.stringify({ id: 'u_member', role: 'Admin' })).toString('base64url') + '.';

  const attempts = [
    [undefined, 'no header at all'],
    ['Bearer', 'the word Bearer and nothing else'],
    ['Bearer not.a.token', 'gibberish'],
    [`Bearer ${forged}`, 'signed with the wrong secret'],
    [`Bearer ${expired}`, 'expired an hour ago'],
    [`Bearer ${alg_none}`, 'alg: none'],
    [`Basic ${Buffer.from('a:b').toString('base64')}`, 'the wrong scheme']
  ];

  for (const [header, what] of attempts) {
    const res = await get('/auth/me', header ? { Authorization: header } : {});
    assert.equal(res.status, 401, `refused: ${what}`);
  }
});

test('a member token does not open an admin route', async (t) => {
  t.after(() => mock.restoreAll());
  withDatabase(t, MEMBER());

  const memberToken = signToken(MEMBER());
  const res = await get('/auth/admin/check', { Authorization: `Bearer ${memberToken}` });
  assert.equal(res.status, 403, 'authenticated is not the same as authorised');
});

test('while the account exists, the database decides the role, not the token', async (t) => {
  /* A token minted while somebody was an administrator, presented after they
     were demoted. The record says Member, so the answer is 403. */
  t.after(() => mock.restoreAll());
  withDatabase(t, MEMBER());

  const staleAdminToken = jwt.sign({ id: 'u_member', role: 'Admin', emailVerified: true }, getJwtSecret());
  const res = await get('/auth/admin/check', { Authorization: `Bearer ${staleAdminToken}` });
  assert.equal(res.status, 403, 'the demotion takes effect immediately');
});

/* The database is the revocation list. Removing an account must end its
 * sessions immediately; a still-valid signature is not permission to recreate
 * the deleted identity from stale claims. */
test('a token for an account that no longer exists is refused', async (t) => {
  t.after(() => mock.restoreAll());
  const state = mongoose.connection.readyState;
  mongoose.connection.readyState = 1;
  mongoose.connection.db = {};
  t.after(() => { mongoose.connection.readyState = state; });
  // The account has been deleted.
  mock.method(User, 'findById', () => ({ select: () => ({ lean: async () => null }), lean: async () => null }));

  const orphanAdminToken = jwt.sign({ id: 'u_deleted', role: 'Admin' }, getJwtSecret());
  const res = await get('/auth/admin/check', { Authorization: `Bearer ${orphanAdminToken}` });
  assert.equal(res.status, 401);
});

test('signToken normalizes the email claim', () => {
  const claims = jwt.verify(signToken({ ...MEMBER(), email: ' Member@Example.COM ' }), getJwtSecret());
  assert.equal(claims.email, 'member@example.com');
});

/* Signing out is a client-side act: the browser drops the token. There is no
   server session to end, so what matters is that nothing else keeps a copy —
   the token is never set as a cookie the browser would go on sending. */
test('no session cookie is set, so dropping the token is a complete sign-out', async (t) => {
  t.after(() => mock.restoreAll());
  mock.method(userStore, 'findByEmail', async () => MEMBER());

  const res = await post('/auth/login', { email: MEMBER().email, password: PASSWORD });
  assert.equal(res.headers.get('set-cookie'), null);
});

/* ------------------------------------------------------------------ *
 * Forgetting a password
 * ------------------------------------------------------------------ */

test('asking for a reset says the same thing whether or not the address exists', async (t) => {
  t.after(() => mock.restoreAll());
  mock.method(userStore, 'findByEmail', async (email) => (email === MEMBER().email ? MEMBER() : null));
  mock.method(userStore, 'issuePasswordReset', async () => ({ token: 'reset-token-abc' }));

  const known = await post('/auth/forgot-password', { email: MEMBER().email });
  const unknown = await post('/auth/forgot-password', { email: 'nobody@example.com' });

  assert.equal(known.status, unknown.status);
  assert.deepEqual(await known.json(), await unknown.json(), 'identical answers, so the endpoint tells nobody who is a member');
});

test('a reset link that was never issued, already spent or expired all answer alike', async (t) => {
  t.after(() => mock.restoreAll());
  // consumePasswordReset returns null for all three cases.
  mock.method(userStore, 'consumePasswordReset', async () => null);

  const res = await post('/auth/reset-password', { token: 'whatever', password: 'a-new-password' });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.token, undefined);
});

test('a reset cannot be used to set a password weaker than signup allows', async (t) => {
  t.after(() => mock.restoreAll());
  let consumed = false;
  mock.method(userStore, 'consumePasswordReset', async () => { consumed = true; return MEMBER(); });

  const res = await post('/auth/reset-password', { token: 'good-token', password: 'short' });
  assert.equal(res.status, 400);
  assert.equal(consumed, false, 'the token is not spent on a rejected password');
});

test('a completed reset does not sign the visitor in', async (t) => {
  t.after(() => mock.restoreAll());
  mock.method(userStore, 'consumePasswordReset', async () => MEMBER());

  const res = await post('/auth/reset-password', { token: 'good-token', password: 'a-brand-new-password' });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  /* Whoever set the password should prove they know it. Handing back a session
     here would turn a stolen link into an account rather than a password
     change the owner can see and undo. */
  assert.equal(body.token, undefined);
  assert.equal(body.data, undefined);
});

/* ------------------------------------------------------------------ *
 * Linked providers
 * ------------------------------------------------------------------ */

test('a member can sync the providers their own Firebase account carries', async (t) => {
  t.after(stubIdentity({
    localId: 'firebase-member',
    email: MEMBER().email,
    emailVerified: true,
    providerUserInfo: [{ providerId: 'google.com' }, { providerId: 'password' }]
  }));
  t.after(() => mock.restoreAll());

  const row = MEMBER();
  withDatabase(t, row);
  mock.method(User, 'findByIdAndUpdate', (_id, update) => {
    Object.assign(row, update.$set || {});
    return { lean: async () => ({ ...row }) };
  });

  const res = await post('/auth/sync-providers', { idToken: 'member-token' },
    { Authorization: `Bearer ${signToken(MEMBER())}` });

  assert.equal(res.status, 200);
  assert.deepEqual(row.authProviders, ['google', 'password'], 'google.com is stored as google');
});

test('a member cannot point their account at somebody else’s Firebase identity', async (t) => {
  /* The attack the check exists for: make a Firebase account under any address
     a second ago, then send its token here to repoint your own record — the
     same unproven binding /auth/firebase refuses. */
  t.after(stubIdentity({
    localId: 'firebase-stranger',
    email: 'stranger@example.com',
    emailVerified: true,
    providerUserInfo: [{ providerId: 'google.com' }]
  }));
  t.after(() => mock.restoreAll());

  const row = MEMBER();
  withDatabase(t, row);
  let repointed = false;
  mock.method(User, 'findByIdAndUpdate', () => { repointed = true; return { lean: async () => ({}) }; });

  const res = await post('/auth/sync-providers', { idToken: 'stranger-token' },
    { Authorization: `Bearer ${signToken(MEMBER())}` });

  assert.equal(res.status, 403);
  assert.equal(repointed, false);
  assert.equal(row.firebaseUid, 'firebase-member', 'still their own');
});

test('syncing providers requires a session of its own', async () => {
  const res = await post('/auth/sync-providers', { idToken: 'anything' });
  assert.equal(res.status, 401);
});

test('the last sign-in method cannot be removed', async (t) => {
  t.after(stubIdentity({
    localId: 'firebase-member',
    email: MEMBER().email,
    emailVerified: true,
    providerUserInfo: []
  }));
  t.after(() => mock.restoreAll());

  const row = MEMBER();
  mock.method(User, 'findById', () => ({
    select: () => ({ lean: async () => row }),
    lean: async () => row
  }));
  let wrote = false;
  mock.method(User, 'findByIdAndUpdate', () => { wrote = true; return { lean: async () => ({}) }; });

  const res = await post('/auth/sync-providers', { idToken: 'member-token' },
    { Authorization: `Bearer ${signToken(MEMBER())}` });

  // An account with no providers is an account nobody can ever sign into.
  assert.equal(res.status, 401);
  assert.equal(wrote, false);
});
