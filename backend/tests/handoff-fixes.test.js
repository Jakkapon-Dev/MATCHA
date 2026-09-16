import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readStoreMode } from '../../test-support/store-mode.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('E2E rejects missing, invalid and failed store-config before any writes', () => {
  for (const response of [{ status: 500, body: { data: { mode: 'demo' } } }, { status: 200, body: {} }, { status: 200, body: { success: true, data: { mode: 'unknown' } } }]) {
    assert.throws(() => readStoreMode(response), /audit stopped/);
  }
  for (const mode of ['demo', 'live']) assert.equal(readStoreMode({ status: 200, body: { success: true, data: { mode } } }), mode);
});

test('all bundled public demo assets are present and match their checksums', () => {
  const root = path.join(__dirname, '../demo-media');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../demo-media/manifest.json'), 'utf8'));
  assert.equal(manifest.length, 32);
  for (const file of manifest) {
    assert.match(file.name, /^[a-f\d-]+(?:-thumb)?\.webp$/);
    const bytes = fs.readFileSync(path.join(root, file.name));
    assert.equal(bytes.length, file.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
  }
});
