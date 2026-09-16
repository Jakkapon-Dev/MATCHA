// Package only public Lookbook images, never the entire upload directory.
// Reads the catalogue and local files; does not modify MongoDB.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { storageRoot } from '../services/mediaStorage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundleRoot = path.resolve(__dirname, '../demo-media');

async function bundle() {
  const origin = process.env.API_BASE_URL || 'http://localhost:5001/api';
  const response = await fetch(`${origin}/lookbooks`);
  if (!response.ok) throw new Error(`Lookbooks returned ${response.status}`);
  const { data } = await response.json();
  const names = new Set();
  for (const item of data.flatMap(look => look.shoppableItems)) {
    const match = /^\/api\/media\/files\/([a-f\d-]+\.webp)$/.exec(item.image);
    if (!match) throw new Error(`No managed image for ${item.id}`);
    names.add(match[1]); names.add(match[1].replace('.webp', '-thumb.webp'));
  }
  // Read everything first: missing originals must not leave a partial new bundle.
  const files = await Promise.all([...names].sort().map(async name => {
    const bytes = await fs.readFile(path.join(storageRoot, name));
    return { name, bytes, sha256: createHash('sha256').update(bytes).digest('hex') };
  }));
  await fs.mkdir(bundleRoot, { recursive: true });
  for (const file of files) await fs.writeFile(path.join(bundleRoot, file.name), file.bytes);
  await fs.writeFile(path.join(bundleRoot, 'manifest.json'), JSON.stringify(files.map(({ name, bytes, sha256 }) => ({ name, bytes: bytes.length, sha256 })), null, 2) + '\n');
  console.log(`Bundled ${files.length} public demo images (${files.reduce((sum, f) => sum + f.bytes.length, 0)} bytes); database unchanged`);
}
bundle().catch(error => { console.error(error.message); process.exitCode = 1; });
