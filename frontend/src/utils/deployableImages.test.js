/* Every image the source asks for has to survive the deployment.
 *
 * .vercelignore drops public/images/​**​/*.jpg, *.jpeg and *.png from the build,
 * because each one has a .webp twin roughly nine times smaller and webpSrc()
 * rewrites the extension before the request is made. That is fine until a
 * component reaches for a raster path directly, or for a file nobody committed:
 * it works on a developer's machine, where public/ is served whole, and 404s in
 * production.
 *
 * CatalogPage did exactly that. It asked for /images/catalog/styling-desk-wash.png,
 * a file in no commit and no directory, so every visit to /catalog on production
 * logged a 404 and the hero rendered without the texture it was written for.
 * `npm run build` said nothing, because Vite does not resolve paths in public/.
 *
 * This walks the source instead, and fails on any /images path that would not
 * arrive. It is the check the build does not do.
 */

import { describe, test, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.cwd(), 'src');
const PUBLIC = path.resolve(process.cwd(), 'public');

// Extensions .vercelignore removes from the deployment.
const STRIPPED = new Set(['.png', '.jpg', '.jpeg']);
const IMAGE_REF = /\/images\/[A-Za-z0-9/_.-]+\.(?:png|jpe?g|webp|svg|gif|avif)/g;

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(jsx?|json)$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name) ? [full] : [];
  });
}

/* A comment may well name the path it is explaining; only code asks for files.
   Whole-line `//` only, so the `//` in an https URL is left alone. */
const withoutComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function collectReferences() {
  const refs = new Map();
  for (const file of sourceFiles(SRC)) {
    const text = withoutComments(readFileSync(file, 'utf8'));
    for (const match of text.matchAll(IMAGE_REF)) {
      const ref = match[0];
      if (!refs.has(ref)) refs.set(ref, path.relative(SRC, file).replace(/\\/g, '/'));
    }
  }
  return refs;
}

/* What the browser will actually request. A stripped extension is only ever
   asked for through webpSrc(), which swaps it for .webp, so that twin is the
   file that has to exist. A path with no twin is requested as written. */
function deployedPathFor(ref) {
  const ext = path.extname(ref).toLowerCase();
  if (!STRIPPED.has(ext)) return ref;
  const twin = ref.slice(0, -ext.length) + '.webp';
  return existsSync(path.join(PUBLIC, twin)) ? twin : ref;
}

function isDeployable(deployed) {
  const onDisk = path.join(PUBLIC, deployed);
  if (!existsSync(onDisk) || !statSync(onDisk).isFile()) return false;
  return !STRIPPED.has(path.extname(deployed).toLowerCase());
}

describe('images referenced by the source', () => {
  const refs = collectReferences();

  test('the walk actually found something to check', () => {
    expect(refs.size).toBeGreaterThan(20);
  });

  test('every one of them survives the deployment', () => {
    const missing = [...refs.entries()]
      .map(([ref, from]) => ({ ref, from, deployed: deployedPathFor(ref) }))
      .filter(({ deployed }) => !isDeployable(deployed))
      .map(({ ref, from, deployed }) => `${ref}  (referenced by src/${from}; browser would request ${deployed})`);

    expect(missing).toEqual([]);
  });
});
