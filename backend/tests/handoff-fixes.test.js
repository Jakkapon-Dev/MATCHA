const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { readStoreMode } = require('../../test-support/store-mode');

test('E2E rejects missing, invalid and failed store-config before any writes', () => {
  for (const response of [{ status: 500, body: { data: { mode: 'demo' } } }, { status: 200, body: {} }, { status: 200, body: { success: true, data: { mode: 'unknown' } } }]) {
    assert.throws(() => readStoreMode(response), /audit stopped/);
  }
  for (const mode of ['demo', 'live']) assert.equal(readStoreMode({ status: 200, body: { success: true, data: { mode } } }), mode);
});

test('all bundled public demo assets are present and match their checksums', () => {
  const root = path.join(__dirname, '../demo-media');
  const manifest = require('../demo-media/manifest.json');
  assert.equal(manifest.length, 32);
  for (const file of manifest) {
    assert.match(file.name, /^[a-f\d-]+(?:-thumb)?\.webp$/);
    const bytes = fs.readFileSync(path.join(root, file.name));
    assert.equal(bytes.length, file.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
  }
});
