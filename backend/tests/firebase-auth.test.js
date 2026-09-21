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
