/* The privacy policy lists what the site keeps in the browser. That list had
   drifted: it named keys the code no longer uses (matcha_guest_session,
   matcha_lang) and left out ones it does (the wishlist, saved looks, the
   address book copy). Every storage key the source writes must be named in the
   policy, so a new one cannot ship undisclosed. */
import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '..');
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) files.push(full);
  }
})(SRC);

const source = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const policy = fs.readFileSync(path.join(SRC, 'pages', 'LegalPage.jsx'), 'utf8');

const keys = new Set();
for (const m of source.matchAll(/(?:localStorage|sessionStorage)\.(?:get|set|remove)Item\(\s*['"`]([^'"`$]+)/g)) keys.add(m[1]);
for (const m of source.matchAll(/const [A-Z_]*KEY[A-Z_]* = '(matcha[^']*)'/g)) keys.add(m[1]);

describe('privacy policy storage disclosure', () => {
  test('finds the keys it is checking', () => {
    expect(keys.size).toBeGreaterThan(8);
  });

  test.each([...keys])('%s is named in the privacy policy', (key) => {
    expect(policy).toContain(`\`${key}`);
  });

  test('names no key the site does not use', () => {
    for (const stale of ['matcha_guest_session', 'matcha_lang`']) expect(policy).not.toContain(stale);
  });
});
