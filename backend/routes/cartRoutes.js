import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import Cart from '../models/Cart.js';
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
         demand a Mongo ObjectId, which the JSON user store never issues, so a
         signed-in visitor silently became a guest again on every cart call. */
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
const dbReady = () => mongoose.connection.readyState === 1;
const emptyCart = (res) => res.json({ success: true, data: { items: [] }, message: 'ตะกร้าฝั่งเซิร์ฟเวอร์ยังไม่พร้อมใช้งาน' });

async function findOrCreateCart(owner) {
  const query = owner.userId ? { userId: owner.userId } : { guestId: owner.guestId };
  const existing = await Cart.findOne(query);
  if (existing) return existing;
  return new Cart({ ...query, items: [] });
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
    const cart = await findOrCreateCart(req.cartOwner);
    res.json({ success: true, data: { items: cart.items } });
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

    const cart = await findOrCreateCart(req.cartOwner);
    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    const existing = cart.items.find((i) => i.itemId === item.itemId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({
        itemId: item.itemId,
        productId: item.productId,
        name: item.name || 'MatchA Garment',
        price: Number(item.price) || 0,
        quantity,
        size: item.size || 'default',
        color: item.color || 'Default',
        image: item.image || ''
      });
    }

    await cart.save();
    res.status(201).json({ success: true, data: { items: cart.items } });
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
    const cart = await findOrCreateCart(req.cartOwner);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      cart.items = cart.items.filter((i) => i.itemId !== itemId);
    } else {
      const target = cart.items.find((i) => i.itemId === itemId);
      if (!target) {
        return res.status(404).json({ success: false, message: 'ไม่พบสินค้าชิ้นนี้ในตะกร้า' });
      }
      target.quantity = quantity;
    }

    await cart.save();
    res.json({ success: true, data: { items: cart.items } });
  } catch (err) {
    console.error('Error updating cart item:', err);
    res.status(500).json({ success: false, message: 'ปรับจำนวนสินค้าไม่สำเร็จ กรุณาลองใหม่' });
  }
});

// DELETE /api/cart/:itemId — เอาสินค้าออกจากตะกร้า
router.delete('/:itemId', requireOwner, async (req, res) => {
  if (!dbReady()) return emptyCart(res);
  try {
    const cart = await findOrCreateCart(req.cartOwner);
    cart.items = cart.items.filter((i) => i.itemId !== req.params.itemId);
    await cart.save();
    res.json({ success: true, data: { items: cart.items } });
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
    const cart = await findOrCreateCart(req.cartOwner);
    cart.items = [];
    await cart.save();
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

    const guestId = String(req.headers['x-guest-id'] || '').trim();
    const userCart = await findOrCreateCart({ userId, guestId: null });
    const guestCart = guestId ? await Cart.findOne({ guestId }) : null;

    if (guestCart?.items?.length) {
      guestCart.items.forEach((incoming) => {
        const existing = userCart.items.find((i) => i.itemId === incoming.itemId);
        if (existing) {
          existing.quantity += incoming.quantity;
        } else {
          userCart.items.push(incoming);
        }
      });
      await guestCart.deleteOne();
    }

    await userCart.save();
    res.json({ success: true, data: { items: userCart.items } });
  } catch (err) {
    console.error('Error merging cart:', err);
    res.status(500).json({ success: false, message: 'รวมตะกร้าไม่สำเร็จ กรุณาลองใหม่' });
  }
});

export default router;
