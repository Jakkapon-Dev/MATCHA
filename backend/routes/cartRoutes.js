import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import Cart, { cartExpiryFor } from '../models/Cart.js';
import { getJwtSecret } from '../middleware/auth.js';

const router = express.Router();

// ตะกร้าเป็นของใครสักคนเสมอ: ผู้ที่ล็อกอินแล้วผูกกับ userId ส่วนผู้ที่ยังไม่ล็อกอิน
// ผูกกับ guestId ที่เบราว์เซอร์สร้างเองและส่งมาในเฮดเดอร์ X-Guest-Id
// (โมเดลบังคับว่าต้องมีอย่างใดอย่างหนึ่ง ห้ามมีทั้งคู่)
function resolveOwner(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token && token !== 'demo-offline-token') {
    try {
      const payload = jwt.verify(token, getJwtSecret());
      const id = payload?.id || payload?.userId || payload?._id;
      /* Any non-empty id the token carries identifies the account. This used to
         demand a Mongo ObjectId, which the `u_…` ids accounts actually carry
         are not, so a signed-in visitor silently became a guest again on every
         cart call. */
      if (id && String(id).trim()) {
        return { userId: String(id).trim(), guestId: null };
      }
    } catch {
      // โทเคนหมดอายุหรือไม่ถูกต้อง — ถือว่ายังไม่ได้ล็อกอิน แล้วไปใช้ guestId แทน
    }
  }

  const guestId = String(req.headers['x-guest-id'] || '').trim();
  return guestId ? { userId: null, guestId } : null;
}

// ฐานข้อมูลหลุดเมื่อไร ตะกร้าฝั่งเบราว์เซอร์ยังทำงานได้เองอยู่แล้ว ที่นี่จึงตอบตะกร้าว่าง
// แทนการโยน error เพื่อไม่ให้หน้าเว็บขึ้นข้อความแดงโดยไม่จำเป็น
// `available: false` บอกหน้าเว็บว่ารายการว่างนี้ไม่ใช่ตะกร้าจริง ห้ามเอาไปทับตะกร้าในเบราว์เซอร์
const dbReady = () => mongoose.connection.readyState === 1;
const emptyCart = (res) => res.json({ success: true, data: { items: [], available: false }, message: 'ตะกร้าฝั่งเซิร์ฟเวอร์ยังไม่พร้อมใช้งาน' });

/* Every write below is a single atomic update against the owner's document.

   These routes used to read the cart, change it in memory and save it back.
   Requests that overlap — Add The Whole Look sends one per garment, and rapid
   presses on + send one per press — each read the same starting cart. Against
   an empty cart every one of them decided to create the document, the unique
   owner index let the first through and the rest failed with E11000 (500);
   against an existing cart the last save simply overwrote the others. Letting
   MongoDB apply each change to the stored document removes the window. */
const ownerQuery = (owner) => (owner.userId ? { userId: owner.userId } : { guestId: owner.guestId });
const isDuplicateKey = (err) => err?.code === 11000;

async function ensureCart(owner) {
  const query = ownerQuery(owner);
  const update = {
    $setOnInsert: { userId: owner.userId || null, guestId: owner.guestId || null, items: [] },
    $set: { expiresAt: cartExpiryFor(owner) }
  };
  try {
    await Cart.updateOne(query, update, { upsert: true });
  } catch (err) {
    // Two upserts racing on the unique owner index: the other one created it.
    if (!isDuplicateKey(err)) throw err;
    await Cart.updateOne(query, { $set: update.$set });
  }
}

async function readItems(owner) {
  const cart = await Cart.findOne(ownerQuery(owner)).lean();
  return cart?.items || [];
}

/* Adds `quantity` of a line, or creates the line. Increment when the line is
   there; otherwise push only while it is still absent. If a concurrent request
   pushed it in between, the push matches nothing and the increment is tried
   again, so the quantity is counted once and the line is never duplicated. */
async function addLine(owner, line) {
  const query = ownerQuery(owner);
  const expiresAt = cartExpiryFor(owner);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inc = await Cart.updateOne(
      { ...query, 'items.itemId': line.itemId },
      { $inc: { 'items.$.quantity': line.quantity }, $set: { expiresAt } }
    );
    if (inc.matchedCount === 1) return;

    const push = await Cart.updateOne(
      { ...query, 'items.itemId': { $ne: line.itemId } },
      { $push: { items: line }, $set: { expiresAt } },
      { runValidators: true }
    );
    if (push.matchedCount === 1) return;
  }
  throw new Error(`Could not add ${line.itemId} to the cart`);
}

const requireOwner = (req, res, next) => {
  const owner = resolveOwner(req);
  if (!owner) {
    return res.status(400).json({ success: false, message: 'ไม่พบตัวระบุตะกร้า กรุณาโหลดหน้าใหม่' });
  }
  req.cartOwner = owner;
  next();
};

// GET /api/cart — ตะกร้าปัจจุบันของเจ้าของคำขอ
router.get('/', requireOwner, async (req, res) => {
  if (!dbReady()) return emptyCart(res);
  try {
    res.json({ success: true, data: { items: await readItems(req.cartOwner) } });
  } catch (err) {
    console.error('Error reading cart:', err);
    res.status(500).json({ success: false, message: 'อ่านตะกร้าไม่สำเร็จ กรุณาลองใหม่' });
  }
});

// POST /api/cart — เพิ่มสินค้า (ถ้ามีรายการเดิมอยู่แล้วให้บวกจำนวนเพิ่ม)
router.post('/', requireOwner, async (req, res) => {
  if (!dbReady()) return emptyCart(res);
  try {
    const { item } = req.body || {};
    if (!item?.itemId || !item?.productId) {
      return res.status(400).json({ success: false, message: 'ข้อมูลสินค้าไม่ครบ ไม่สามารถเพิ่มลงตะกร้าได้' });
    }

    await ensureCart(req.cartOwner);
    await addLine(req.cartOwner, {
      itemId: item.itemId,
      productId: item.productId,
      name: item.name || 'MatchA Garment',
      price: Number(item.price) || 0,
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      size: item.size || 'default',
      color: item.color || 'Default',
      image: item.image || ''
    });

    res.status(201).json({ success: true, data: { items: await readItems(req.cartOwner) } });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ success: false, message: 'เพิ่มสินค้าลงตะกร้าไม่สำเร็จ กรุณาลองใหม่' });
  }
});

// PUT /api/cart/:itemId — กำหนดจำนวนใหม่ (ส่ง 0 หรือน้อยกว่าเท่ากับเอาออก)
router.put('/:itemId', requireOwner, async (req, res) => {
  if (!dbReady()) return emptyCart(res);
  try {
    const { itemId } = req.params;
    const quantity = parseInt(req.body?.quantity, 10);
    const query = ownerQuery(req.cartOwner);
    const expiresAt = cartExpiryFor(req.cartOwner);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      await Cart.updateOne(query, { $pull: { items: { itemId } }, $set: { expiresAt } });
    } else {
      const result = await Cart.updateOne(
        { ...query, 'items.itemId': itemId },
        { $set: { 'items.$.quantity': quantity, expiresAt } }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบสินค้าชิ้นนี้ในตะกร้า' });
      }
    }

    res.json({ success: true, data: { items: await readItems(req.cartOwner) } });
  } catch (err) {
    console.error('Error updating cart item:', err);
    res.status(500).json({ success: false, message: 'ปรับจำนวนสินค้าไม่สำเร็จ กรุณาลองใหม่' });
  }
});

// DELETE /api/cart/:itemId — เอาสินค้าออกจากตะกร้า
router.delete('/:itemId', requireOwner, async (req, res) => {
  if (!dbReady()) return emptyCart(res);
  try {
    await Cart.updateOne(
      ownerQuery(req.cartOwner),
      { $pull: { items: { itemId: req.params.itemId } }, $set: { expiresAt: cartExpiryFor(req.cartOwner) } }
    );
    res.json({ success: true, data: { items: await readItems(req.cartOwner) } });
  } catch (err) {
    console.error('Error deleting cart item:', err);
    res.status(500).json({ success: false, message: 'ลบสินค้าออกจากตะกร้าไม่สำเร็จ กรุณาลองใหม่' });
  }
});

// DELETE /api/cart — ล้างตะกร้าทั้งใบของเจ้าของคำขอ
// ใช้ตอนสั่งซื้อสำเร็จ หรือตอนผู้ใช้กดล้างตะกร้าเอง
router.delete('/', requireOwner, async (req, res) => {
  if (!dbReady()) return emptyCart(res);
  try {
    await Cart.updateOne(
      ownerQuery(req.cartOwner),
      { $set: { items: [], expiresAt: cartExpiryFor(req.cartOwner) } }
    );
    res.json({ success: true, data: { items: [] } });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ success: false, message: 'ล้างตะกร้าไม่สำเร็จ กรุณาลองใหม่' });
  }
});

// POST /api/cart/merge — ย้ายตะกร้าของผู้เยี่ยมชมเข้าบัญชีหลังล็อกอิน
// ของที่ซ้ำกันให้บวกจำนวนรวมกัน แล้วทิ้งตะกร้าของ guest
router.post('/merge', requireOwner, async (req, res) => {
  if (!dbReady()) return emptyCart(res);
  try {
    const { userId } = req.cartOwner;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ต้องเข้าสู่ระบบก่อนจึงจะรวมตะกร้าได้' });
    }

    const owner = { userId, guestId: null };
    await ensureCart(owner);

    /* The guest cart is claimed by deleting it in the same operation that reads
       it, so a second merge arriving at the same time finds nothing to add and
       the guest's quantities are counted into the account exactly once. */
    const guestId = String(req.headers['x-guest-id'] || '').trim();
    const guestCart = guestId ? await Cart.findOneAndDelete({ guestId }).lean() : null;
    for (const incoming of guestCart?.items || []) {
      await addLine(owner, incoming);
    }

    res.json({ success: true, data: { items: await readItems(owner) } });
  } catch (err) {
    console.error('Error merging cart:', err);
    res.status(500).json({ success: false, message: 'รวมตะกร้าไม่สำเร็จ กรุณาลองใหม่' });
  }
});

export default router;
