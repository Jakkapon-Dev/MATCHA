/* Every admin label exists in both languages, and none is shown as a key.
 *
 * The translator falls back to English and then to the key itself, so a key
 * missing from Thai reads as English and one missing from both reads as
 * "admin.coupons.addCoupon" on screen. These tests walk the admin copy and the
 * admin source files so neither can happen silently. */
import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { translations } from './translations';

const leaves = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) => (
  v && typeof v === 'object' && !Array.isArray(v) ? leaves(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]
));
const resolve = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

const src = path.resolve(process.cwd(), 'src');
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = path.join(dir, name);
  return statSync(full).isDirectory() ? walk(full) : [full];
});
const adminSources = [
  ...walk(path.join(src, 'components', 'admin')),
  path.join(src, 'pages', 'AdminPage.jsx'),
  path.join(src, 'features', 'media', 'MediaManager.jsx'),
  path.join(src, 'features', 'media', 'useMediaManager.js')
].filter((file) => /\.(jsx?|tsx?)$/.test(file) && !/\.test\./.test(file));

describe('admin copy', () => {
  const en = new Map(leaves(translations.en.admin));
  const th = new Map(leaves(translations.th.admin));

  test('Thai and English have the same keys', () => {
    expect([...en.keys()].filter((k) => !th.has(k))).toEqual([]);
    expect([...th.keys()].filter((k) => !en.has(k))).toEqual([]);
  });

  test('no label is empty', () => {
    expect([...en, ...th].filter(([, v]) => typeof v !== 'string' || !v.trim()).map(([k]) => k)).toEqual([]);
  });

  test('every admin key used in the admin source has text in both languages', () => {
    const used = new Set();
    for (const file of adminSources) {
      for (const m of readFileSync(file, 'utf8').matchAll(/['"`](admin\.[\w.]+)['"`]/g)) used.add(m[1].replace(/\.$/, ''));
    }
    // Keys built at runtime (admin.status.<value>) end in a dot in source.
    const missing = [...used].filter((key) => !key.endsWith('.') && (typeof resolve(translations.en, key) !== 'string' || typeof resolve(translations.th, key) !== 'string'));
    expect(missing).toEqual([]);
    expect(used.size).toBeGreaterThan(50);
  });

  test('placeholders match between the two languages', () => {
    const vars = (v) => [...String(v).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    expect([...en].filter(([k, v]) => vars(v) !== vars(th.get(k))).map(([k]) => k)).toEqual([]);
  });
});

describe('terminology in Thai', () => {
  const th = translations.th.admin;

  test('feature names the team uses stay in English', () => {
    expect(th.nav.lookbook).toBe('Lookbook Hotspots');
    expect(th.nav.coupons).toBe('Coupons');
    expect(th.shell.brandSubtitle).toBe('Admin Console');
    expect(th.dashboard.totalCatalog).toContain('Catalog');
    expect(th.shell.searchPlaceholder).toContain('SKU');
  });

  test('no feature name is translated word for word', () => {
    const all = leaves(th).map(([, v]) => String(v)).join('\n');
    for (const literal of ['สมุดลุค', 'จุดร้อน', 'ผสมและจับคู่', 'บัญชีรายการ', 'สีส่วนบุคคล', 'คูปอง']) {
      expect(all.includes(literal), literal).toBe(false);
    }
  });
});
