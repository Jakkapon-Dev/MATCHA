import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import rateLimit from 'express-rate-limit';
import app from '../server.js';

/* Behind Render's proxy req.ip is that proxy's address for every request, so
   express-rate-limit -- which keys on req.ip -- stops limiting visitors and
   starts limiting the deployment. These tests pin the setting that fixes it
   and the two properties it has to have: a forwarded address identifies the
   visitor, and an address the visitor writes themselves does not. */

const servers = [];
after(() => servers.forEach(server => server.close()));

// One limiter, two requests allowed, so the third from the same bucket is the
// answer we are reading.
async function listen(configure, validate) {
  const probe = express();
  configure(probe);
  probe.use(rateLimit({ windowMs: 60_000, limit: 2, standardHeaders: false, legacyHeaders: false, validate }));
  probe.get('/', (req, res) => res.json({ ip: req.ip }));
  const server = probe.listen(0, '127.0.0.1');
  servers.push(server);
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  return (forwardedFor) => fetch(base, { headers: forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {} });
}

test('the server trusts exactly one proxy', () => {
  /* Not `true`: that trusts the leftmost entry in X-Forwarded-For, which is
     whatever the client wrote, and a client who rotates it never meets a
     limit. Behind a second proxy this number goes up with it. */
  assert.equal(app.get('trust proxy'), 1);
});

test('a forwarded address identifies the visitor, and each one is limited on its own', async () => {
  const get = await listen(probe => probe.set('trust proxy', 1));

  const first = await get('203.0.113.7');
  assert.equal((await first.json()).ip, '203.0.113.7');

  await get('203.0.113.7');
  assert.equal((await get('203.0.113.7')).status, 429);

  // A different visitor is untouched by the first one's spending.
  assert.equal((await get('198.51.100.4')).status, 200);
});

test('a visitor cannot buy a fresh allowance by writing their own X-Forwarded-For', async () => {
  const get = await listen(probe => probe.set('trust proxy', 1));

  /* Render appends the address it received from, so the last entry is the one
     hop that is not the visitor's to write. Everything to the left of it is
     the visitor's own text and must not move which bucket they land in. */
  assert.equal((await get('10.0.0.1, 203.0.113.9')).status, 200);
  assert.equal((await get('decoy, 203.0.113.9')).status, 200);
  assert.equal((await get('1.1.1.1, 2.2.2.2, 203.0.113.9')).status, 429);
});

test('without the setting every visitor shares one allowance', async () => {
  /* What production was doing before. express-rate-limit shouts
     ERR_ERL_UNEXPECTED_X_FORWARDED_FOR at exactly this arrangement -- the
     warning Render's logs were carrying -- and the check is muted here only so
     the run stays readable while the behaviour underneath is asserted. */
  const get = await listen(() => {}, { xForwardedForHeader: false });

  assert.equal((await get('203.0.113.1')).status, 200);
  assert.equal((await get('203.0.113.2')).status, 200);
  assert.equal((await get('203.0.113.3')).status, 429);
});
