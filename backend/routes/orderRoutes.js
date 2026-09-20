import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product, { ONE_SIZE } from '../models/Product.js';
import productsData from '../data/products.js';
import { getJwtSecret, authRequired, adminOnly } from '../middleware/auth.js';
import { isDemo } from '../config/storeMode.js';
import { normaliseCode, discountFor, isFreeShippingCoupon } from '../config/coupons.js';

const router = express.Router();

/* Placing an order is the most expensive thing an anonymous caller can ask
   this API to do: it writes a document, decrements stock and clears a cart.
   Twenty in a quarter of an hour is far above anything a real shopper does and
   well below what a script would want.

   Reads are deliberately not limited — order history is polled by the account
   page and throttling it would break the page rather than an attacker. */
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'สั่งซื้อถี่เกินไป กรุณารอสักครู่แล้วลองใหม่' },
});

// หน้าชำระเงินฝั่งเว็บจะแสดงหน้ายืนยันก็ต่อเมื่อคำตอบบอกว่าร้านยังอยู่ในโหมดทดลอง
// (features/demo/DemoCheckout.jsx) — ทุกทางที่คืนออเดอร์จึงต้องแนบค่านี้ไปด้วย
const withStoreMode = (order) => ({
  ...(order?.toObject ? order.toObject() : order),
  isDemo
});

// Fallback store in memory if database is disconnected during local evaluation
const memoryOrders = [];

// Coupon rates live in config/coupons.js, shared with the checkout screen.

const SHIPPING_RATES = {
  standard: 0,
  express: 12.0,
  premium: 25.0
};

const BUNDLE_DISCOUNT_RATE = 0.12;
const FREE_SHIPPING_THRESHOLD = 100.0;

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

/* Who is allowed to see, or act on, one order.

   An order number is readable — MTA-2026-439417-924 — and therefore worth
   guessing at, so holding one is never enough on its own. An administrator
   qualifies, as does the account the order belongs to, the email on it, or
   the browser that placed it as a guest. */
function ownsOrder(req, order) {
  const viewer = extractAuthUser(req);
  const callerGuestId = String(req.headers['x-guest-id'] || '').trim();
  return (viewer && (
    String(viewer.role || '').toLowerCase() === 'admin' ||
    (viewer.email && order.customer?.email &&
      String(viewer.email).toLowerCase() === String(order.customer.email).toLowerCase()) ||
    (order.userId && String(order.userId) === String(viewer.id || viewer.userId || viewer._id || ''))
  )) || Boolean(order.guestId && callerGuestId && order.guestId === callerGuestId);
}

/* Which stock bucket an ordered item comes out of.

   A product that declares sizes is sold by size, so the size must be one it
   declares — anything else is a request for something that does not exist and
   is left as it came, to be refused by the reservation below rather than
   quietly rounded to a size that happens to be in stock.

   A product with no declared sizes is sold as one thing, and `ONE` is where
   its stock lives. The browser sends 'M' by default for those, which would
   otherwise look for a bucket that was never created. */
export function stockKeyFor(product, requestedSize) {
  const declared = (product?.sizes || []).map(s => String(s).trim()).filter(Boolean);
  const wanted = String(requestedSize || '').trim();
  if (!declared.length) return ONE_SIZE;
  return wanted;
}

/* Take the stock before the order is written, all of it or none of it.

   Each line is decremented by a single findOneAndUpdate carrying its own
   condition: the matching size must already hold at least what is being
   taken. Two shoppers reaching for the last M therefore cannot both succeed,
   because the condition and the subtraction are one operation to the database
   rather than a read this code then acts on.

   Everything runs in one transaction with the order write, so a shortfall on
   the fourth line puts the first three back by abandoning the transaction
   rather than by trying to remember what to undo.

   A product with no sizeStock has not been migrated yet. Rather than refuse an
   order over a migration that has not been run, those fall back to the whole
   product's `stock` under the same kind of condition, which is still a real
   check — just a coarser one. */
async function reserveStock(validatedItems, productCache, session) {
  // Two cart lines can name the same garment and size; they come out of one
  // bucket, so they are counted as one draw on it.
  const wanted = new Map();
  for (const item of validatedItems) {
    const product = productCache.get(item.productId);
    const key = `${item.productId}::${stockKeyFor(product, item.size)}`;
    const row = wanted.get(key) || { productId: item.productId, size: stockKeyFor(product, item.size), quantity: 0, name: item.name };
    row.quantity += item.quantity;
    wanted.set(key, row);
  }

  for (const row of wanted.values()) {
    const product = productCache.get(row.productId);
    const migrated = Array.isArray(product?.sizeStock) && product.sizeStock.length > 0;

    const filter = migrated
      ? {
          $or: [{ id: row.productId }, { sku: row.productId }],
          sizeStock: { $elemMatch: { size: row.size, stock: { $gte: row.quantity } } },
        }
      : {
          $or: [{ id: row.productId }, { sku: row.productId }],
          stock: { $gte: row.quantity },
        };

    const update = migrated
      ? { $inc: { 'sizeStock.$[bucket].stock': -row.quantity, stock: -row.quantity } }
      : { $inc: { stock: -row.quantity } };

    const options = migrated
      ? { session, arrayFilters: [{ 'bucket.size': row.size }] }
      : { session };

    const hit = await Product.updateOne(filter, update, options);
    if (!hit.modifiedCount) {
      const err = new Error('insufficient stock');
      err.shortfall = { productId: row.productId, name: row.name, size: row.size, requested: row.quantity };
      throw err;
    }
  }
}

/* Put back what a cancelled order was holding.

   The mirror of reserveStock, and deliberately more forgiving: a bucket that
   has since been renamed, or a product that has been deleted, must not stop a
   customer cancelling. Stock that cannot be returned is logged rather than
   thrown, because the alternative is an order stuck open over a garment that
   no longer exists. */
async function releaseStock(items, session) {
  const back = new Map();
  for (const item of items || []) {
    const key = `${item.productId}::${item.size || ONE_SIZE}`;
    const row = back.get(key) || { productId: item.productId, size: item.size || ONE_SIZE, quantity: 0 };
    row.quantity += Number(item.quantity) || 0;
    back.set(key, row);
  }

  for (const row of back.values()) {
    if (row.quantity <= 0) continue;
    const selector = { $or: [{ id: row.productId }, { sku: row.productId }] };

    const toBucket = await Product.updateOne(
      { ...selector, 'sizeStock.size': row.size },
      { $inc: { 'sizeStock.$[bucket].stock': row.quantity, stock: row.quantity } },
      { session, arrayFilters: [{ 'bucket.size': row.size }] }
    );
    if (toBucket.modifiedCount) continue;

    // No such bucket: the product may predate the migration, or the size may
    // have been renamed since the order was placed. The total is still right
    // to credit.
    const toTotal = await Product.updateOne(selector, { $inc: { stock: row.quantity } }, { session });
    if (!toTotal.modifiedCount) {
      console.warn(`[orders] cancelled order held ${row.quantity} of ${row.productId} (${row.size}) that could not be returned`);
    }
  }
}

// POST /api/orders — สร้างออเดอร์ใหม่ (คำนวณราคาฝั่งเซิร์ฟเวอร์ + รองรับทั้ง Member และ Guest)
router.post('/', orderLimiter, async (req, res) => {
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

    // Sanitize idempotency key as a strict string to prevent NoSQL query object injection
    const rawKey = typeof idempotencyKey === 'string' ? idempotencyKey.trim() : null;
    const headerKey = typeof req.headers['idempotency-key'] === 'string' ? req.headers['idempotency-key'].trim() : null;
    const reqIdKey = typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'].trim() : null;
    const effectiveKey = String(rawKey || headerKey || reqIdKey || `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

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
      // sizes and sizeStock ride along now: the stock check below cannot be
      // made without them, and the old projection is exactly why this endpoint
      // could say yes to a garment it did not have.
      const dbProds = await Product.find({}, 'id sku price name image color sizes sizeStock').lean();
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
        bundleDiscountAmount += (actualPrice * qty) * BUNDLE_DISCOUNT_RATE;
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
    // The discount is recomputed here from the server's own table and the
    // server's own subtotal. Whatever the browser believed it had applied is
    // only ever a code string.
    const cleanCoupon = normaliseCode(couponCode);
    const couponDiscount = discountFor(cleanCoupon, subtotal);
    const isFreeShipping = isFreeShippingCoupon(cleanCoupon) || subtotal >= FREE_SHIPPING_THRESHOLD;
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

    // 5. Whose order this is. Any non-empty id the token carries identifies the
    //    account; the ObjectId test that used to guard this rejected every id
    //    the user store issues, so no order was ever attributed to anyone.
    let orderUserId = null;
    const candidateId = authUser?.id || authUser?.userId || authUser?._id;
    if (candidateId && String(candidateId).trim()) {
      orderUserId = String(candidateId).trim();
    }

    const validPaymentMethods = ['visa', 'mastercard', 'cod', 'qr', 'demo'];
    const safePaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'demo';

    /* Every order is born unpaid, whatever the customer said they would pay
       with.

       This line used to read `safePaymentMethod === 'cod' ? 'unpaid' : 'paid'`,
       which confused the method with the fact: choosing a card is an intention,
       receiving the money is an event, and only the second one belongs in this
       field. Nothing here takes any money, so nothing here may record that any
       arrived.

       It costs nothing today because no money is real yet. It would cost the
       shop the goods on the day a gateway is connected, because a customer who
       reaches this endpoint and then closes the payment window would have an
       order marked paid and nothing charged.

       Only two things may promote an order: an administrator through
       PATCH /api/orders/:id, and — once there is one — a payment webhook whose
       signature has been checked. Both write the fact after it has happened. */
    const paymentStatus = 'unpaid';

    /* A guest's own id is recorded so the order can be shown back to them
       later. A signed-in customer does not need it: their orders are found by
       account id or email, and storing it as well would leave a second way in
       that outlives the session. */
    const headerGuestId = String(req.headers['x-guest-id'] || '').trim();
    const orderGuestId = !orderUserId && headerGuestId ? headerGuestId : null;

    const orderPayload = {
      idempotencyKey: effectiveKey,
      userId: orderUserId,
      guestId: orderGuestId,
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
      /* The stock comes off and the order goes on together, or neither does.

         Before this, nothing was decremented at all: the comment at the top of
         this file claimed the endpoint decrements stock and it never had, so
         the same garment could be sold without limit. */
      const session = await mongoose.connection.getClient().startSession();
      try {
        await session.withTransaction(async () => {
          await reserveStock(orderPayload.items, productCache, session);
          const [written] = await Order.create([orderPayload], { session });
          savedOrder = written;
        });
      } catch (err) {
        if (err?.shortfall) {
          return res.status(409).json({
            success: false,
            message: 'สินค้าบางรายการเหลือไม่พอ กรุณาตรวจสอบตะกร้าอีกครั้ง',
            shortfall: err.shortfall,
          });
        }
        throw err;
      } finally {
        await session.endSession();
      }

      /* The bag is emptied here rather than left to the browser. clearCart()
         only ever reset local state, and no route existed to clear the server
         copy, so everything a person had ever ordered stayed in their
         server-side cart — invisible until carts began attaching to accounts,
         and then showing up as a bag full of things already bought.

         Doing it beside the write keeps the two consistent even if the client
         dies mid-checkout, and a failure here must not fail an order that has
         already been taken. */
      try {
        const guestId = String(req.headers['x-guest-id'] || '').trim();
        const owner = orderUserId ? { userId: orderUserId } : (guestId ? { guestId } : null);
        if (owner) await Cart.findOneAndUpdate(owner, { $set: { items: [] } });
      } catch (cartErr) {
        console.warn('Order saved but the server cart was not cleared:', cartErr.message);
      }
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
/* A small stand-in for the query, used only on the no-database path. It
   understands the two shapes this route builds: `{ $or: [...] }` for a
   signed-in customer, and a flat equality match for a guest. An empty filter
   means an administrator, who sees everything. */
function matchesFilter(list, filter) {
  const clauses = Object.keys(filter).length === 0 ? null : (filter.$or || [filter]);
  if (!clauses) return list;
  const matchesOne = (order, clause) => Object.entries(clause).every(([path, want]) => {
    const value = path.split('.').reduce((node, key) => (node == null ? node : node[key]), order);
    return value !== undefined && value !== null && String(value).toLowerCase() === String(want).toLowerCase();
  });
  return list.filter(order => clauses.some(clause => matchesOne(order, clause)));
}

router.get('/', async (req, res) => {
  try {
    const authUser = extractAuthUser(req);
    const isAdmin = authUser?.role && String(authUser.role).toLowerCase() === 'admin';

    let filter = {};

    /* Who is asking decides what comes back, and a caller who is nobody gets
       nothing.

       This used to end with two branches that gave a stranger the shop's
       customer list. `?email=` was honoured without any proof the caller owned
       that address, so anyone could read a named person's orders; and a
       request with no filter at all fell through to `filter = {}`, which
       returned every order there was. Both carried the full customer record —
       name, email, phone and street address. Checked against the running
       server before this change: an anonymous GET returned 13 orders, the
       first of them a real name with a real phone number and a real address.

       Nothing needed that. The checkout success screen reads the order out of
       the POST response it already has, and the only caller of this endpoint
       is the account page, which then filtered the list again in the browser
       — so the customer's own machine was being handed everyone else's
       details in order to throw them away.

       Guests get an empty list rather than an error: they have no orders here
       to see. Giving a guest their own history back needs an owner recorded on
       the order, which the schema does not have; see the note in the README of
       this change. */
    if (isAdmin) {
      filter = {};
    } else if (authUser) {
      const uId = authUser.id || authUser.userId || authUser._id;
      /* The email match stays as the fallback for the orders already written
         with a null userId; new orders carry the id and match on it directly. */
      const conditions = [];
      if (authUser.email) conditions.push({ 'customer.email': String(authUser.email).toLowerCase() });
      if (uId && String(uId).trim()) conditions.push({ userId: String(uId).trim() });
      if (!conditions.length) {
        return res.json({ success: true, count: 0, data: [] });
      }
      filter = { $or: conditions };
    } else {
      /* A guest sees the orders placed from this browser, matched on the id it
         sends with every request — the same one the cart is keyed on. Orders
         written before that id was recorded carry none, so they match nobody
         and stay hidden, which is the right way round.

         An empty or missing header means an empty list, never `{}`; that is
         the branch that used to return the whole shop. */
      const guestId = String(req.headers['x-guest-id'] || '').trim();
      if (!guestId) {
        return res.json({ success: true, count: 0, data: [] });
      }
      filter = { guestId };
    }

    let orders = [];
    if (mongoose.connection.readyState === 1) {
      orders = await Order.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    } else {
      /* The same rules apply with no database. This used to hand back
         memoryOrders in full, ignoring the filter that had just been worked
         out, so every restriction above was undone the moment the connection
         dropped — a caller who should see nothing would see everything, and
         only while something was already wrong. */
      orders = matchesFilter(memoryOrders, filter).slice(0, 50);
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

    /* An order number was enough to read the whole order, customer address
       included, and these numbers carry a readable shape — MTA-2026-439417-924
       — so they are worth guessing at. Verified against the running server:
       an anonymous fetch by order number returned the customer's email and
       phone number.

       The answer for someone who does not own the order is the same 404 the
       caller gets for an order that does not exist. A different reply here
       would confirm the number is real, which is the first half of the thing
       being protected against. */
    if (!ownsOrder(req, order)) {
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

/* POST /api/orders/:id/cancel — the customer calls this one off themselves.

   'cancelled' has been in the schema all along, but only an administrator
   could set it, so someone who ordered the wrong size had nothing to do but
   wait for a person to notice.

   Only while the order is still `pending`. Once the shop has started
   processing or shipping it, cancelling is a conversation rather than a
   button, and a cancellation that arrived after the parcel had gone would put
   stock back that had physically left.

   The stock goes back the way it came off: inside a transaction, so an order
   cannot end up cancelled with the goods still held, nor released with the
   order still open. */
router.post('/:id/cancel', orderLimiter, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'ระบบฐานข้อมูลไม่พร้อมใช้งาน ยังยกเลิกไม่ได้' });
  }

  try {
    const { id } = req.params;
    const isOid = mongoose.Types.ObjectId.isValid(id);
    const order = await Order.findOne({
      $or: [{ orderNumber: id }, { idempotencyKey: id }, ...(isOid ? [{ _id: id }] : [])]
    }).lean();

    // Same 404 for an order that is not yours as for one that does not exist:
    // a different answer here would confirm the number is real.
    if (!order || !ownsOrder(req, order)) {
      return res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อที่ต้องการ' });
    }

    if (order.status === 'cancelled') {
      return res.status(200).json({ success: true, data: withStoreMode(order), message: 'คำสั่งซื้อนี้ถูกยกเลิกไปแล้ว' });
    }

    if (order.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: 'คำสั่งซื้อนี้เริ่มดำเนินการแล้ว กรุณาติดต่อร้านเพื่อยกเลิก',
        status: order.status,
      });
    }

    let cancelled = null;
    const session = await mongoose.connection.getClient().startSession();
    try {
      await session.withTransaction(async () => {
        /* The condition on status is what makes this safe to call twice at
           once: the second attempt matches nothing and the transaction that
           would have released the stock a second time does nothing. */
        const updated = await Order.findOneAndUpdate(
          { _id: order._id, status: 'pending' },
          { $set: { status: 'cancelled' } },
          { new: true, session }
        );
        if (!updated) {
          const raced = new Error('already handled');
          raced.raced = true;
          throw raced;
        }
        await releaseStock(order.items, session);
        cancelled = updated;
      });
    } catch (err) {
      if (err?.raced) {
        const now = await Order.findById(order._id).lean();
        return res.status(409).json({ success: false, message: 'คำสั่งซื้อนี้เพิ่งถูกเปลี่ยนสถานะ กรุณาโหลดใหม่', status: now?.status });
      }
      throw err;
    } finally {
      await session.endSession();
    }

    res.json({ success: true, data: withStoreMode(cancelled), message: 'ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ success: false, message: 'ยกเลิกคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่' });
  }
});

// PATCH /api/orders/:id — อัปเดตสถานะออเดอร์ (Admin Status Updates)
router.patch('/:id', authRequired, adminOnly, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'Database unavailable; changes were not saved' });
  const validStatus = !req.body.status || ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(req.body.status);
  const validPayment = !req.body.paymentStatus || ['unpaid', 'paid', 'refunded'].includes(req.body.paymentStatus);
  if (!validStatus || !validPayment || (!req.body.status && !req.body.paymentStatus) || Object.keys(req.body).some(key => !['status', 'paymentStatus'].includes(key))) return res.status(400).json({ success: false, message: 'Invalid order status update' });
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
        { new: true, runValidators: true }
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
