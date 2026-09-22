/* One person, one email, two ways in.
 *
 * A member signs up with a password, shops for a year, then one day clicks
 * "Continue with Google" because it is faster. Firebase hands back an identity
 * with the same address and a brand new uid, and POST /auth/firebase has to
 * recognise that this is the same person — not mint them a second, empty
 * account, and not overwrite what the first one holds.
 *
 * firebase-account-takeover.test.js holds the security half of this: an
 * unverified identity may never claim an existing account. These hold the
 * other half, which is just as easy to get wrong and much quieter when it
 * breaks — the linking write must add a provider and leave everything else
 * alone. Orders, addresses, tier, marketing consent, the password they can
 * still sign in with, and the avatar they chose.
 */

import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

import authRoutes, { signToken } from '../routes/auth.js';
import userStore, { User } from '../services/userStore.js';
import { getJwtSecret } from '../middleware/auth.js';

let server, base;

/* A member who arrived by password and has a year of history behind them.
   Every field here is something that must survive a Google sign-in. */
const ESTABLISHED = Object.freeze({
  _id: 'u_established',
  email: 'nok@example.com',
  name: 'Nok Srisai',
  firstName: 'Nok',
  lastName: 'Srisai',
  role: 'Member',
  tier: 'VIP Gold Member',
  passwordHash: '$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQR',
  authProviders: ['password'],
  firebaseUid: 'firebase-nok-password',
  emailVerified: true,
  avatarUrl: '/api/media/files/avatar-nok-chosen.png',
  marketingConsent: true,
  totalSpent: 18400,
  addresses: [
    { _id: 'addr_1', label: 'Home', line1: '100 Sukhumvit', isDefault: true },
    { _id: 'addr_2', label: 'Office', line1: '55 Silom', isDefault: false }
  ],
  createdAt: new Date('2025-03-02T00:00:00Z')
});

// Only the Identity Toolkit call is answered here; the test client's own
// requests to this server must still reach the network.
function stubIdentity(identity) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (!String(url).includes('identitytoolkit')) return realFetch(url, options);
    return { ok: true, json: async () => ({ users: [identity] }) };
  };
  return () => { globalThis.fetch = realFetch; };
}

const googleIdentity = (overrides = {}) => ({
  localId: 'firebase-nok-google',
  email: ESTABLISHED.email,
  emailVerified: true,
  displayName: 'Nok S.',
  photoUrl: 'https://lh3.googleusercontent.com/a/nok-google-photo',
  providerUserInfo: [{ providerId: 'google.com' }],
  ...overrides
});

const signInWithFirebase = (idToken) => fetch(`${base}/auth/firebase`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken })
});

/* Stand in for the users collection during a link. Applies the update the way
   Mongo would — $set replaces, $addToSet appends without duplicating — so the
   test can then read the whole document and ask what survived. */
function linkableUser(seed = ESTABLISHED) {
  const row = { ...seed, authProviders: [...seed.authProviders], addresses: [...seed.addresses] };
  const updates = [];
  mock.method(User, 'findOne', () => ({ lean: async () => null }));
  mock.method(userStore, 'findByEmail', async () => ({ ...row }));
  mock.method(User, 'findByIdAndUpdate', (_id, update) => {
    updates.push(update);
    Object.assign(row, update.$set || {});
    for (const [field, value] of Object.entries(update.$addToSet || {})) {
      if (!row[field].includes(value)) row[field].push(value);
    }
    return { lean: async () => ({ ...row }) };
  });
  return { row, updates };
}

before(async () => {
  process.env.FIREBASE_WEB_API_KEY ||= 'test-web-key';
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
 * Password first, then Google — the same person
 * ------------------------------------------------------------------ */

test('signing in with Google links to the existing account instead of creating a second one', async (t) => {
  t.after(stubIdentity(googleIdentity()));
  t.after(() => mock.restoreAll());

  const { row } = linkableUser();
  let created = false;
  mock.method(userStore, 'createUser', async () => { created = true; return {}; });

  const res = await signInWithFirebase('nok-google-token');
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  // The whole point: no duplicate member on the same address.
  assert.equal(created, false, 'no second account was created');
  assert.equal(body.data.email, ESTABLISHED.email);
  assert.equal(body.data.id ?? body.data._id, ESTABLISHED._id, 'it is the same member record');
  assert.equal(row.firebaseUid, 'firebase-nok-google', 'the new uid is attached');
});

test('linking adds the provider without dropping the one that was already there', async (t) => {
  t.after(stubIdentity(googleIdentity()));
  t.after(() => mock.restoreAll());

  const { row, updates } = linkableUser();
  await signInWithFirebase('nok-google-token');

  assert.deepEqual(row.authProviders, ['password', 'google'], 'both ways in are recorded');
  // $addToSet rather than $set: a second Google sign-in must not duplicate it,
  // and must never replace the password entry.
  assert.ok(updates[0].$addToSet?.authProviders, 'providers are appended, not overwritten');
  assert.equal(updates[0].$set?.authProviders, undefined);
});

test('a year of history survives the link untouched', async (t) => {
  t.after(stubIdentity(googleIdentity()));
  t.after(() => mock.restoreAll());

  const { row } = linkableUser();
  await signInWithFirebase('nok-google-token');

  /* This is the failure that would be quietest in production: the member
     signs in with Google, the account still works, and their addresses and
     spend are simply gone. */
  assert.deepEqual(row.addresses, ESTABLISHED.addresses, 'the address book is intact');
  assert.equal(row.addresses.length, 2);
  assert.equal(row.tier, 'VIP Gold Member', 'tier is not reset to Regular');
  assert.equal(row.totalSpent, 18400, 'spend history is not zeroed');
  assert.equal(row.marketingConsent, true, 'consent is not silently re-asked');
  assert.equal(row.role, 'Member');
  assert.deepEqual(row.createdAt, ESTABLISHED.createdAt, 'the join date is not reset to today');
});

/* FOUND, NOT FIXED — the one thing the link does overwrite.
 *
 *   ...(identity.photoUrl ? { avatarUrl: identity.photoUrl } : {})
 *
 * A member who uploaded their own avatar through POST /users/me/avatar loses
 * it the first time they sign in with Google: the account keeps working, the
 * picture is quietly somebody else's idea of them. Whether that is wanted is a
 * product call — refreshing the photo from the provider is defensible — but it
 * is data the member chose, replaced without being asked, so it should be a
 * decision rather than a side effect. Suggested: only take the provider photo
 * when `avatarUrl` is empty.
 */
test('an uploaded avatar survives a Google sign-in', { todo: 'the link overwrites avatarUrl with the Google photo' }, async (t) => {
  t.after(stubIdentity(googleIdentity()));
  t.after(() => mock.restoreAll());

  const { row } = linkableUser();
  await signInWithFirebase('nok-google-token');
  assert.equal(row.avatarUrl, ESTABLISHED.avatarUrl);
});

test('a provider with no photo never blanks the avatar', async (t) => {
  t.after(stubIdentity(googleIdentity({ photoUrl: '' })));
  t.after(() => mock.restoreAll());

  const { row } = linkableUser();
  await signInWithFirebase('nok-google-token');
  // The guard on photoUrl does hold for the empty case.
  assert.equal(row.avatarUrl, ESTABLISHED.avatarUrl);
});

test('the password still works after linking Google', async (t) => {
  t.after(stubIdentity(googleIdentity()));
  t.after(() => mock.restoreAll());

  const { row, updates } = linkableUser();
  await signInWithFirebase('nok-google-token');

  /* Linking a social provider must not blank the password. If it did, the
     member would be locked out of the way they have always signed in, and
     "forgot password" on an account with no password is its own maze. */
  assert.equal(row.passwordHash, ESTABLISHED.passwordHash, 'the password hash is untouched');
  assert.equal(updates[0].$set?.passwordHash, undefined, 'the link never writes passwordHash');
  assert.equal(row.name, ESTABLISHED.name, 'the display name they chose is kept');
});

test('a Google display name does not overwrite the name the member set', async (t) => {
  t.after(stubIdentity(googleIdentity({ displayName: 'nok.s.1998' })));
  t.after(() => mock.restoreAll());

  const { row } = linkableUser();
  await signInWithFirebase('nok-google-token');

  // Google's display name belongs to Google's profile, not to this account.
  assert.equal(row.name, 'Nok Srisai');
  assert.equal(row.firstName, 'Nok');
  assert.equal(row.lastName, 'Srisai');
});

test('an already-verified account is not un-verified by a later unverified sign-in', async (t) => {
  /* Reached only when the uid already matches. A provider that reports
     emailVerified: false must not take away a verification the member already
     has, or their next checkout is refused by the guard in orderRoutes.

     The identity here is `password`, not Google: verifyFirebaseIdToken
     rejects an unverified Google identity outright with 401, so this branch
     can only ever be reached by the password provider. */
  t.after(stubIdentity({
    localId: ESTABLISHED.firebaseUid,
    email: ESTABLISHED.email,
    emailVerified: false,
    providerUserInfo: [{ providerId: 'password' }]
  }));
  t.after(() => mock.restoreAll());

  const row = { ...ESTABLISHED, authProviders: [...ESTABLISHED.authProviders] };
  mock.method(User, 'findOne', () => ({ lean: async () => ({ ...row }) }));
  mock.method(User, 'findByIdAndUpdate', (_id, update) => {
    Object.assign(row, update.$set || {});
    for (const [field, value] of Object.entries(update.$addToSet || {})) {
      if (!row[field].includes(value)) row[field].push(value);
    }
    return { lean: async () => ({ ...row }) };
  });

  const res = await signInWithFirebase('nok-password-token');
  assert.equal(res.status, 200);
  assert.equal(row.emailVerified, true, 'verification is kept, never downgraded');
});

test('an unverified Google identity never reaches the linking branch at all', async (t) => {
  // Belt and braces on the takeover guard: the verifier refuses first.
  t.after(stubIdentity(googleIdentity({ emailVerified: false })));
  t.after(() => mock.restoreAll());

  let touched = false;
  mock.method(User, 'findOne', () => { touched = true; return { lean: async () => null }; });

  const res = await signInWithFirebase('unverified-google-token');
  assert.equal(res.status, 401);
  assert.equal(touched, false, 'no account was even looked up');
});

/* ------------------------------------------------------------------ *
 * Google first, then a password on the same address
 * ------------------------------------------------------------------ */

test('an account opened with Google cannot be taken over by registering its email', async (t) => {
  t.after(() => mock.restoreAll());
  mock.method(userStore, 'findByEmail', async () => ({ ...ESTABLISHED }));
  let created = false;
  mock.method(userStore, 'createUser', async () => { created = true; return {}; });

  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Someone Else', email: ESTABLISHED.email, password: 'hunter2hunter2' })
  });

  assert.equal(res.status, 409, 'the address is already spoken for');
  assert.equal(created, false);
  // And the refusal says nothing a stranger could not already guess.
  assert.equal((await res.json()).token, undefined);
});

/* ------------------------------------------------------------------ *
 * The session the link hands back
 * ------------------------------------------------------------------ */

test('the token issued by a link is for the original account, and outlives the request', async (t) => {
  t.after(stubIdentity(googleIdentity()));
  t.after(() => mock.restoreAll());

  linkableUser();
  const body = await (await signInWithFirebase('nok-google-token')).json();

  const claims = jwt.verify(body.token, getJwtSecret());
  assert.equal(claims.id, ESTABLISHED._id, 'the session belongs to the established member');
  assert.equal(claims.role, 'Member');
  assert.equal(claims.emailVerified, true);
  /* Session persistence is this expiry plus the browser keeping the token.
     A session that ended with the response would sign the member out on
     every reload. */
  assert.ok(claims.exp > claims.iat, 'the token has a lifetime');
  assert.ok(claims.exp - claims.iat >= 3600, 'and it is longer than one hour');
});

/* The JWT deliberately carries an id, a role and a verification flag, and
   nothing else. Worth pinning: two places in orderRoutes.js branch on
   `authUser.email`, which this token has never had — see the todo below. */
test('the session token carries no more than it needs', async (t) => {
  t.after(stubIdentity(googleIdentity()));
  t.after(() => mock.restoreAll());

  linkableUser();
  const body = await (await signInWithFirebase('nok-google-token')).json();
  const claims = jwt.verify(body.token, getJwtSecret());

  assert.deepEqual(Object.keys(claims).sort(), ['emailVerified', 'exp', 'iat', 'id', 'role']);
});

/* FOUND, NOT FIXED — recorded so it is not lost.
 *
 * orderRoutes.js matches a member to their orders by account id, and falls
 * back to the email on the order for rows written before userId was stored:
 *
 *   ownsOrder()    (viewer.email && order.customer?.email && ...)
 *   GET /orders    if (authUser.email) conditions.push({ 'customer.email': ... })
 *
 * signToken() has never put an email in the token, so `authUser.email` is
 * always undefined and neither fallback can fire. Every order with
 * userId: null — which the Order model's own comment says was all thirteen in
 * production — is invisible to the member who placed it, and uncancellable by
 * them. The fix is one field in signToken; this records the case until then.
 */
test('a member can see an order that predates userId being stored', { todo: 'signToken carries no email claim, so the fallback in orderRoutes can never match' }, () => {
  const claims = jwt.decode(signToken({ _id: 'u_1', role: 'Member', email: ESTABLISHED.email, emailVerified: true }));
  assert.equal(claims.email, ESTABLISHED.email);
});

test('no password hash is ever handed back to the browser', async (t) => {
  t.after(stubIdentity(googleIdentity()));
  t.after(() => mock.restoreAll());

  linkableUser();
  const body = await (await signInWithFirebase('nok-google-token')).json();

  const serialised = JSON.stringify(body);
  assert.equal(body.data.passwordHash, undefined);
  assert.equal(serialised.includes(ESTABLISHED.passwordHash), false, 'not anywhere in the payload');
  assert.equal(serialised.includes('passwordHash'), false);
});
