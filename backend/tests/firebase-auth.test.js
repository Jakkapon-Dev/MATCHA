import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyFirebaseIdToken } from '../routes/auth.js';

test('Firebase token lookup returns a verified Google identity', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), { idToken: 'valid-token' });
    return {
      ok: true,
      json: async () => ({ users: [{
        localId: 'firebase-1',
        email: 'member@example.com',
        emailVerified: true,
        providerUserInfo: [{ providerId: 'google.com' }],
      }] }),
    };
  };

  const identity = await verifyFirebaseIdToken('valid-token', 'public-web-key');
  assert.equal(identity.localId, 'firebase-1');
  assert.equal(identity.email, 'member@example.com');
});

test('Firebase token lookup rejects unverified identities', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ users: [{
      localId: 'firebase-1',
      email: 'member@example.com',
      emailVerified: false,
      providerUserInfo: [{ providerId: 'google.com' }],
    }] }),
  });

  await assert.rejects(
    verifyFirebaseIdToken('unverified-token', 'public-web-key'),
    (error) => error.status === 401,
  );
});

test('Firebase token lookup accepts a verified password identity', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), { idToken: 'valid-pw-token' });
    return {
      ok: true,
      json: async () => ({ users: [{
        localId: 'firebase-pw-1',
        email: 'passmember@example.com',
        emailVerified: true,
        providerUserInfo: [{ providerId: 'password' }],
      }] }),
    };
  };

  const identity = await verifyFirebaseIdToken('valid-pw-token', 'public-web-key');
  assert.equal(identity.localId, 'firebase-pw-1');
  assert.equal(identity.email, 'passmember@example.com');
  assert.equal(identity.provider, 'password');
  assert.equal(identity.emailVerified, true);
});

test('Firebase token lookup identifies unverified password accounts', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ users: [{
      localId: 'firebase-pw-unverified',
      email: 'unverified@example.com',
      emailVerified: false,
      providerUserInfo: [{ providerId: 'password' }],
    }] }),
  });

  const identity = await verifyFirebaseIdToken('unverified-pw-token', 'public-web-key');
  assert.equal(identity.provider, 'password');
  assert.equal(identity.emailVerified, false);
});

test('Firebase token lookup rejects forged or expired tokens with 401', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => ({
    ok: false,
    json: async () => ({ error: { code: 400, message: 'INVALID_ID_TOKEN' } }),
  });

  await assert.rejects(
    verifyFirebaseIdToken('forged-token', 'public-web-key'),
    (error) => error.status === 401,
  );
});

test('Firebase token lookup rejects unsupported providers with 401', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ users: [{
      localId: 'firebase-unknown',
      email: 'unknown@example.com',
      emailVerified: true,
      providerUserInfo: [{ providerId: 'twitter.com' }],
    }] }),
  });

  await assert.rejects(
    verifyFirebaseIdToken('twitter-token', 'public-web-key'),
    (error) => error.status === 401,
  );
});
