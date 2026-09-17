import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import productsData from '../data/products.js';
import { getJwtSecret } from '../middleware/auth.js';
import { isDemo } from '../config/storeMode.js';

const router = express.Router();

// หน้าชำระเงินฝั่งเว็บจะแสดงหน้ายืนยันก็ต่อเมื่อคำตอบบอกว่าร้านยังอยู่ในโหมดทดลอง
// (features/demo/DemoCheckout.jsx) — ทุกทางที่คืนออเดอร์จึงต้องแนบค่านี้ไปด้วย
const withStoreMode = (order) => ({
  ...(order?.toObject ? order.toObject() : order),
  isDemo
});

// Fallback store in memory if database is disconnected during local evaluation
const memoryOrders = [];

// Coupon definitions matching client & store policy
const COUPONS = {
  '01': { discount: 10, type: 'percent' },
  '02': { discount: 20, type: 'percent' },
  '03': { discount: 50, type: 'percent' },
  'MATCHA15': { discount: 15, type: 'percent' },
  'WELCOME10': { discount: 10, type: 'percent' },
  'FREESHIP': { discount: 0, type: 'free_shipping' }
};

const SHIPPING_RATES = {
  standard: 0,
  express: 12.0,
  premium: 25.0
};

// Safe helper to extract auth payload if provided
const extractAuthUser = (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || token === 'demo-offline-token') return null;
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
};

// POST /api/orders — สร้างออเดอร์ใหม่ (คำนวณราคาฝั่งเซิร์ฟเวอร์ + รองรับทั้ง Member และ Guest)
router.post('/', async (req, res) => {
  try {
    const authUser = extractAuthUser(req);
    const {
      idempotencyKey,
      customer = {},
      items = [],
      couponCode,
      paymentMethod = 'demo',
      shippingOption = 'standard'
    } = req.body;

    const effectiveKey = idempotencyKey || req.headers['idempotency-key'] || req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // 1. Idempotency Check: คืนออเดอร์เดิมทันทีหากคีย์ซ้ำ
    if (mongoose.connection.readyState === 1) {
      const existing = await Order.findOne({ idempotencyKey: effectiveKey });
      if (existing) {
        return res.status(200).json({ success: true, data: withStoreMode(existing), message: 'Existing order returned (Idempotency)' });
      }
    } else {
      const existingMem = memoryOrders.find(o => o.idempotencyKey === effectiveKey);
      if (existingMem) {
        return res.status(200).json({ success: true, data: withStoreMode(existingMem), message: 'Existing order returned (Idempotency)' });
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'ตะกร้าสินค้าว่างเปล่า ไม่สามารถสร้างออเดอร์ได้' });
    }

    // 2. Lookup actual products & compute prices on server-side
    // เตรียมแคชสินค้าจากทั้ง DB และ local productsData
    const productCache = new Map(productsData.map(p => [p.id, p]));
    if (mongoose.connection.readyState === 1) {
      const dbProds = await Product.find({}, 'id sku price name image color').lean();
      dbProds.forEach(p => {
        if (p.id) productCache.set(p.id, p);
        if (p.sku) productCache.set(p.sku, p);
      });
    }

    let subtotal = 0;
    let bundleDiscountAmount = 0;

    const validatedItems = items.map(item => {
      const pId = item.productId || item.id || 'SKU-UNKNOWN';
      const matched = productCache.get(pId);
      const actualPrice = matched ? Number(matched.price) : (Number(item.price) || 45.0);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      subtotal += actualPrice * qty;

      // Bundle Item Discount (12% per item marked as isBundleItem)
      if (item.isBundleItem) {
        bundleDiscountAmount += (actualPrice * qty) * 0.12;
      }

      return {
        productId: pId,
        name: item.name || matched?.name || 'MatchA Garment',
        quantity: qty,
        size: item.size || 'M',
        color: item.color || matched?.color || 'Default',
        image: item.image || matched?.image || '',
        priceAtPurchase: actualPrice
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    bundleDiscountAmount = Math.round(bundleDiscountAmount * 100) / 100;

    // 3. Coupon and Shipping Calculation
    const cleanCoupon = (couponCode || '').trim().toUpperCase();
    const couponObj = COUPONS[cleanCoupon] || null;

    let couponDiscount = 0;
    if (couponObj && couponObj.type === 'percent') {
      couponDiscount = Math.round(subtotal * (couponObj.discount / 100) * 100) / 100;
    }

    const isFreeShipping = (couponObj && couponObj.type === 'free_shipping') || subtotal >= 100;
    const shippingBaseRate = SHIPPING_RATES[shippingOption] ?? 0;
    const shippingCost = isFreeShipping ? 0 : shippingBaseRate;

    const totalDiscount = Math.round((couponDiscount + bundleDiscountAmount) * 100) / 100;
    const total = Math.max(0, Math.round((subtotal + shippingCost - totalDiscount) * 100) / 100);

    // 4. Customer Info Fallbacks for Guest/Member
    const customerPayload = {
      firstName: customer.firstName || (authUser?.name ? authUser.name.split(' ')[0] : 'Guest'),
      lastName: customer.lastName || (authUser?.name ? authUser.name.split(' ').slice(1).join(' ') || 'Customer' : 'Shopper'),
      email: (customer.email || authUser?.email || 'guest@matcha-archive.com').toLowerCase().trim(),
      phone: customer.phone || '081-234-5678',
      address: customer.address || 'MatchA Customer Residence',
      city: customer.city || 'Bangkok',
      state: customer.state || 'Bangkok',
      zipCode: customer.zipCode || '10110',
      country: customer.country || 'Thailand'
    };

    // 5. User ID assignment (Valid Mongo ObjectId or null for Guest)
    let orderUserId = null;
    const candidateId = authUser?.id || authUser?.userId || authUser?._id;
    if (candidateId && mongoose.Types.ObjectId.isValid(candidateId)) {
      orderUserId = candidateId;
    }

    const validPaymentMethods = ['visa', 'mastercard', 'cod', 'qr', 'demo'];
    const safePaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'demo';
    const paymentStatus = safePaymentMethod === 'cod' ? 'unpaid' : 'paid';

    const orderPayload = {
      idempotencyKey: effectiveKey,
      userId: orderUserId,
      customer: customerPayload,
      items: validatedItems,
      couponCode: cleanCoupon || null,
      paymentMethod: safePaymentMethod,
      shippingOption: ['standard', 'express', 'premium'].includes(shippingOption) ? shippingOption : 'standard',
      subtotal,
      shippingCost,
      discount: totalDiscount,
      total,
      status: 'pending',
      paymentStatus
    };

    let savedOrder;
    if (mongoose.connection.readyState === 1) {
      const orderDoc = new Order(orderPayload);
      savedOrder = await orderDoc.save();
    } else {
      const year = new Date().getFullYear();
      const stamp = Date.now().toString().slice(-6);
      const random = Math.floor(100 + Math.random() * 900);
      const orderNum = `MTA-${year}-${stamp}-${random}`;
      savedOrder = {
        _id: `mem-${Date.now()}`,
        orderNumber: orderNum,
        orderId: orderNum,
        ...orderPayload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memoryOrders.unshift(savedOrder);
    }

    res.status(201).json({
      success: true,
      data: withStoreMode(savedOrder),
      message: 'บันทึกคำสั่งซื้อเรียบร้อยแล้ว'
    });
  } catch (err) {
    // รายละเอียดของข้อผิดพลาดอยู่ใน log ฝั่งเซิร์ฟเวอร์เท่านั้น ผู้ซื้อไม่ควรเห็นข้อความของ
    // ฐานข้อมูลหรือชื่อ index บนหน้าจอ
    console.error('Error creating order:', err);

    // คีย์ซ้ำ: ถ้าชนที่ idempotencyKey แปลว่ามีคำขอเดียวกันสร้างออเดอร์ไปแล้วระหว่างที่
    // คำขอนี้กำลังทำงาน (กดปุ่มซ้ำ/ยิงพร้อมกัน) — คืนออเดอร์ใบเดิมแทนการแจ้งว่าผิดพลาด
    if (err?.code === 11000) {
      const duplicatedOn = Object.keys(err.keyPattern || err.keyValue || {});
      if (duplicatedOn.includes('idempotencyKey')) {
        const existing = await Order.findOne({ idempotencyKey: err.keyValue?.idempotencyKey }).catch(() => null);
        if (existing) {
          return res.status(200).json({
            success: true,
            data: withStoreMode(existing),
            message: 'Existing order returned (Idempotency)'
          });
        }
      }
      // ชนที่ฟิลด์อื่น มักเป็น index เก่าที่ค้างอยู่ในคอลเลกชันหลังเปลี่ยน schema
      // ผู้ซื้อแก้อะไรไม่ได้ จึงเป็นความผิดพลาดฝั่งเซิร์ฟเวอร์
      return res.status(500).json({
        success: false,
        message: 'ระบบขัดข้องชั่วคราว ไม่สามารถบันทึกคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง'
      });
    }

    // ข้อมูลที่ส่งมาไม่ผ่านการตรวจของ schema — เป็นสิ่งที่ผู้ซื้อแก้ได้
    if (err?.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลคำสั่งซื้อไม่ครบถ้วนหรือไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
      });
    }

    res.status(500).json({
      success: false,
      message: 'ไม่สามารถบันทึกคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง'
    });
  }
});

// GET /api/orders — รายการออเดอร์ (Admin เห็นทั้งหมด, Member เห็นเฉพาะของตน, Guest กรองตามอีเมลหรือดูออเดอร์ล่าสุด)
router.get('/', async (req, res) => {
  try {
    const authUser = extractAuthUser(req);
    const guestId = req.headers['x-guest-id'] || req.query.guestId;
    const queryEmail = (req.query.email || '').toLowerCase().trim();

    const isAdmin = authUser?.role && String(authUser.role).toLowerCase() === 'admin';

    let filter = {};

    if (isAdmin) {
      // Admin sees all orders
      filter = {};
    } else if (authUser) {
      const uId = authUser.id || authUser.userId || authUser._id;
      const conditions = [{ 'customer.email': authUser.email?.toLowerCase() }];
      if (uId && mongoose.Types.ObjectId.isValid(uId)) {
        conditions.push({ userId: uId });
      }
      filter = { $or: conditions };
    } else if (queryEmail) {
      filter = { 'customer.email': queryEmail };
    } else {
      // Guest with no specific email filter: return recent orders so demo checkout flow displays immediately
      filter = {};
    }

    let orders = [];
    if (mongoose.connection.readyState === 1) {
      orders = await Order.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    } else {
      orders = memoryOrders.slice(0, 50);
    }

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้'
    });
  }
});

// GET /api/orders/:id — รายละเอียดออเดอร์รายใบ
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;

    if (mongoose.connection.readyState === 1) {
      const isOid = mongoose.Types.ObjectId.isValid(id);
      order = await Order.findOne({
        $or: [
          { orderNumber: id },
          { idempotencyKey: id },
          ...(isOid ? [{ _id: id }] : [])
        ]
      }).lean();
    } else {
      order = memoryOrders.find(o => o.orderNumber === id || o._id === id || o.idempotencyKey === id);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อที่ต้องการ'
      });
    }

    res.json({
      success: true,
      data: withStoreMode(order)
    });
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้'
    });
  }
});

// PATCH /api/orders/:id — อัปเดตสถานะออเดอร์ (Admin Status Updates)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;

    let updated = null;
    if (mongoose.connection.readyState === 1) {
      const isOid = mongoose.Types.ObjectId.isValid(id);
      updated = await Order.findOneAndUpdate(
        {
          $or: [
            { orderNumber: id },
            ...(isOid ? [{ _id: id }] : [])
          ]
        },
        { $set: updates },
        { new: true }
      );
    } else {
      const idx = memoryOrders.findIndex(o => o.orderNumber === id || o._id === id);
      if (idx !== -1) {
        memoryOrders[idx] = { ...memoryOrders[idx], ...updates, updatedAt: new Date().toISOString() };
        updated = memoryOrders[idx];
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อเพื่ออัปเดต' });
    }

    res.json({
      success: true,
      data: updated,
      message: 'อัปเดตสถานะคำสั่งซื้อสำเร็จ'
    });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้'
    });
  }
});

export default router;
