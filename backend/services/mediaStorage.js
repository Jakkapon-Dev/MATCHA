import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const storageRoot = path.resolve(process.env.MEDIA_STORAGE_DIR || path.join(__dirname, '../storage/media'));
export const MAX_BYTES = 8 * 1024 * 1024;
const allowedFormats = new Set(['jpeg', 'png', 'webp']);

export async function prepareImage(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > MAX_BYTES) {
    throw Object.assign(new Error('กรุณาเลือกรูปขนาดไม่เกิน 8 MB'), { status: 400 });
  }
  try {
    const options = { limitInputPixels: 25_000_000, failOn: 'error' };
    const metadata = await sharp(buffer, options).metadata();
    if (!allowedFormats.has(metadata.format) || (metadata.pages || 1) !== 1) throw new Error('Unsupported image');
    const main = await sharp(buffer, options).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
    const thumbnail = await sharp(main.data).resize({ width: 360, height: 360, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    return { main: main.data, thumbnail, width: main.info.width, height: main.info.height };
  } catch {
    throw Object.assign(new Error('ไฟล์ไม่ใช่ภาพ JPEG, PNG หรือ WebP ที่รองรับ (สูงสุด 25 ล้านพิกเซล)'), { status: 400 });
  }
}

export async function storeImage(buffer, root = storageRoot) {
  const prepared = await prepareImage(buffer);
  const key = randomUUID();
  await fs.mkdir(root, { recursive: true });
  const mainPath = path.join(root, `${key}.webp`);
  const thumbPath = path.join(root, `${key}-thumb.webp`);
  try {
    await fs.writeFile(mainPath, prepared.main, { flag: 'wx' });
    await fs.writeFile(thumbPath, prepared.thumbnail, { flag: 'wx' });
  } catch (error) {
    await Promise.all([mainPath, thumbPath].map(file => fs.unlink(file).catch(() => {})));
    throw error;
  }
  return {
    url: `/api/media/files/${key}.webp`, thumbnailUrl: `/api/media/files/${key}-thumb.webp`,
    width: prepared.width, height: prepared.height, bytes: prepared.main.length, mimeType: 'image/webp'
  };
}

export default { storageRoot, MAX_BYTES, prepareImage, storeImage };
