import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import authRoutes from '../routes/auth.js';
import userStore, { User } from '../services/userStore.js';

/* Firebase does not verify an address at sign-up. Anyone can call
   createUserWithEmailAndPassword with somebody else's email and hold a genuine
   ID token for it seconds later, so "the token is real" says nothing about who
   owns the address. These tests hold the line that follows from that: an
   unverified identity may open a new account, and may never be attached to one
   that already exists. */

let server, base;
const VICTIM = { _id: 'u_victim', email: 'victim@example.com', name: 'Victim',
                 role: 'Member', firebaseUid: 'firebase-victim', emailVerified: true };

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

const signIn = (idToken) => fetch(`${base}/auth/firebase`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken }),
});

before(async () => {
  process.env.FIREBASE_WEB_API_KEY ||= 'test-web-key';
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { mock.restoreAll(); await new Promise(resolve => server.close(resolve)); });

test('an unverified identity cannot claim an account that already exists', async (t) => {
  t.after(stubIdentity({
    localId: 'firebase-attacker',
    email: VICTIM.email,          // the only thing the attacker had to know
    emailVerified: false,         // Firebase asked nobody
    providerUserInfo: [{ providerId: 'password' }],
  }));
  t.after(() => mock.restoreAll());

  mock.method(User, 'findOne', () => ({ lean: async () => null }));
  mock.method(userStore, 'findByEmail', async () => ({ ...VICTIM }));
  let linked = false;
  mock.method(User, 'findByIdAndUpdate', () => { linked = true; return { lean: async () => ({}) }; });

  const res = await signIn('attacker-token');
  const body = await res.json();

  assert.equal(res.status, 403);
  assert.equal(body.code, 'EMAIL_NOT_VERIFIED');
  assert.equal(body.success, false);
  // No session for someone else's account...
  assert.equal(body.token, undefined);
  // ...and the victim's own uid is left exactly where it was.
  assert.equal(linked, false);
});

test('a verified identity may claim the account on that address', async (t) => {
  t.after(stubIdentity({
    localId: 'firebase-victim-new',
    email: VICTIM.email,
    emailVerified: true,
    providerUserInfo: [{ providerId: 'password' }],
  }));
  t.after(() => mock.restoreAll());

  mock.method(User, 'findOne', () => ({ lean: async () => null }));
  mock.method(userStore, 'findByEmail', async () => ({ ...VICTIM }));
  mock.method(User, 'findByIdAndUpdate', (_id, update) => ({
    lean: async () => ({ ...VICTIM, ...update.$set, authProviders: ['password'] }),
  }));

  const res = await signIn('verified-token');
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.ok(body.token, 'a verified owner gets their session');
});

test('an unverified identity may still open an account of its own', async (t) => {
  // Nobody else's history sits behind a brand new member, and the
  // verified-email guards downstream still hold it back from anything that
  // counts, so this stays allowed. Only the claim on an existing one does not.
  t.after(stubIdentity({
    localId: 'firebase-newcomer',
    email: 'newcomer@example.com',
    emailVerified: false,
    providerUserInfo: [{ providerId: 'password' }],
  }));
  t.after(() => mock.restoreAll());

  mock.method(User, 'findOne', () => ({ lean: async () => null }));
  mock.method(userStore, 'findByEmail', async () => null);
  mock.method(userStore, 'createUser', async (input) => ({ _id: 'u_new', role: 'Member', ...input }));

  const res = await signIn('newcomer-token');
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.ok(body.token);
  assert.equal(body.data.emailVerified, false, 'and it is marked unverified');
});
