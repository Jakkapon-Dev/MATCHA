import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import userRoutes from '../routes/userRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import { User } from '../services/userStore.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { getJwtSecret } from '../middleware/auth.js';

let server, base;
const adminToken = () => jwt.sign({ id: 'u_admin_test', role: 'Admin', email: 'admin@matcha.local' }, getJwtSecret());
const adminHeaders = () => ({ Authorization: `Bearer ${adminToken()}`, 'Content-Type': 'application/json' });

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
  app.use('/api/users', userRoutes);
  server = await new Promise(resolve => {
    const running = app.listen(0, '127.0.0.1', () => resolve(running));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise(resolve => server.close(resolve)));

function mockDbConnected(t) {
  const state = mongoose.connection.readyState;
  const db = mongoose.connection.db;
  mongoose.connection.readyState = 1;
  mongoose.connection.db = {};
  t.after(() => {
    mongoose.connection.readyState = state;
    mongoose.connection.db = db;
  });
  t.mock.method(User, 'findById', id => ({
    lean: async () => ({ _id: id, role: 'Admin', email: 'admin@matcha.local' })
  }));
}

// Generate > 25 test items (40 items total)
const generateProducts = () => Array.from({ length: 40 }, (_, i) => ({
  _id: `prod_${i + 1}`,
  id: `SKU-${1000 + i}`,
  name: i === 34 ? 'Vintage Leather Trenchcoat' : `Matcha Garment Item ${i + 1}`,
  category: i % 4 === 0 ? 'Tops' : i % 4 === 1 ? 'Bottoms' : i % 4 === 2 ? 'Outerwear' : 'Accessories',
  price: 1500 + i * 50,
  stock: i === 5 ? 3 : (i === 10 ? 0 : 50),
  status: i === 5 ? 'Low Stock' : (i === 10 ? 'Out of Stock' : 'In Stock'),
  color: i % 2 === 0 ? 'Deep Olive' : 'Ivory Cream',
  createdAt: new Date(2026, 0, i + 1)
}));

const generateOrders = () => Array.from({ length: 40 }, (_, i) => ({
  _id: `ord_${i + 1}`,
  orderNumber: `ORD-2026-${String(i + 1).padStart(4, '0')}`,
  orderId: `OID-${2000 + i}`,
  customer: {
    firstName: i === 28 ? 'Krittaphas' : `CustomerFirst${i + 1}`,
    lastName: i === 28 ? 'DevTeam' : `CustomerLast${i + 1}`,
    email: i === 28 ? 'krittaphas@special.test' : `customer${i + 1}@shop.test`
  },
  status: i % 3 === 0 ? 'Delivered' : i % 3 === 1 ? 'Shipped' : 'Pending',
  total: 2500 + i * 100,
  paymentStatus: 'Paid',
  createdAt: new Date(2026, 1, i + 1)
}));

const generateMembers = () => Array.from({ length: 40 }, (_, i) => ({
  _id: `u_${i + 1}`,
  name: i === 31 ? 'Pornpimol VIP Star' : `Member ${i + 1}`,
  firstName: i === 31 ? 'Pornpimol' : `First${i + 1}`,
  lastName: i === 31 ? 'VIP Star' : `Last${i + 1}`,
  email: i === 31 ? 'pornpimol@vip.test' : `member${i + 1}@test.local`,
  role: 'Member',
  tier: (i === 31 || i % 4 === 0) ? 'VIP Connoisseur' : 'Regular Member',
  createdAt: new Date(2026, 2, i + 1)
}));

test('Task 5 — Products: Server-side pagination, search finds page 2 item from page 1, category & status filters', async (t) => {
  mockDbConnected(t);
  const products = generateProducts();

  t.mock.method(Product, 'find', (filter) => ({
    sort: () => ({
      skip: (skipCount) => ({
        limit: (limitCount) => ({
          lean: async () => {
            let res = [...products];
            if (filter.category) {
              res = res.filter(p => filter.category.test ? filter.category.test(p.category) : p.category === filter.category);
            }
            if (filter.stock) {
              if (filter.stock.$gt === 10) res = res.filter(p => p.stock > 10);
              else if (filter.stock.$lte === 0) res = res.filter(p => p.stock <= 0);
              else if (filter.stock.$gt === 0 && filter.stock.$lte === 10) res = res.filter(p => p.stock > 0 && p.stock <= 10);
            }
            if (filter.$or) {
              res = res.filter(p => filter.$or.some(c => {
                if (c.name && c.name.test(p.name)) return true;
                if (c.id && c.id.test(p.id)) return true;
                if (c.sku && c.sku.test(p.id)) return true;
                if (c.color && c.color.test(p.color)) return true;
                return false;
              }));
            }
            return res.slice(skipCount, skipCount + limitCount);
          }
        })
      })
    })
  }));

  t.mock.method(Product, 'countDocuments', async (filter) => {
    let res = [...products];
    if (filter.category) {
      res = res.filter(p => filter.category.test ? filter.category.test(p.category) : p.category === filter.category);
    }
    if (filter.stock) {
      if (filter.stock.$gt === 10) res = res.filter(p => p.stock > 10);
      else if (filter.stock.$lte === 0) res = res.filter(p => p.stock <= 0);
      else if (filter.stock.$gt === 0 && filter.stock.$lte === 10) res = res.filter(p => p.stock > 0 && p.stock <= 10);
    }
    if (filter.$or) {
      res = res.filter(p => filter.$or.some(c => {
        if (c.name && c.name.test(p.name)) return true;
        if (c.id && c.id.test(p.id)) return true;
        if (c.sku && c.sku.test(p.id)) return true;
        if (c.color && c.color.test(p.color)) return true;
        return false;
      }));
    }
    return res.length;
  });

  // 1. Initial Page 1 load with limit=25: returns first 25 items of 40 total
  const page1Res = await fetch(`${base}/api/admin/products?page=1&limit=25`, { headers: adminHeaders() });
  assert.equal(page1Res.status, 200);
  const page1Body = await page1Res.json();
  assert.equal(page1Body.data.length, 25);
  assert.equal(page1Body.pagination.total, 40);
  assert.equal(page1Body.pagination.totalPages, 2);
  assert.equal(page1Body.pagination.pageSize, 25);
  assert.equal(page1Body.pagination.page, 1);

  // Item 35 ('Vintage Leather Trenchcoat') is NOT on page 1
  assert.ok(!page1Body.data.some(p => p.name === 'Vintage Leather Trenchcoat'));

  // 2. Search for Item 35 from page 1: server-side search MUST find it and return as page 1
  const searchRes = await fetch(`${base}/api/admin/products?page=1&limit=25&search=Vintage+Leather`, { headers: adminHeaders() });
  assert.equal(searchRes.status, 200);
  const searchBody = await searchRes.json();
  assert.equal(searchBody.pagination.total, 1);
  assert.equal(searchBody.pagination.totalPages, 1);
  assert.equal(searchBody.data.length, 1);
  assert.equal(searchBody.data[0].name, 'Vintage Leather Trenchcoat');

  // 3. Category Filter: 'Outerwear' (40 items / 4 = 10 items)
  const catRes = await fetch(`${base}/api/admin/products?page=1&limit=25&category=Outerwear`, { headers: adminHeaders() });
  assert.equal(catRes.status, 200);
  const catBody = await catRes.json();
  assert.equal(catBody.pagination.total, 10);
  assert.equal(catBody.pagination.totalPages, 1);
  assert.ok(catBody.data.every(p => p.category === 'Outerwear'));

  // 4. Status Filter: 'Low Stock' (only 1 item)
  const statusRes = await fetch(`${base}/api/admin/products?page=1&limit=25&status=Low+Stock`, { headers: adminHeaders() });
  assert.equal(statusRes.status, 200);
  const statusBody = await statusRes.json();
  assert.equal(statusBody.pagination.total, 1);
  assert.equal(statusBody.data[0].status, 'Low Stock');
});

test('Task 5 — Orders: Server-side pagination, search finds order from page 2, status filter', async (t) => {
  mockDbConnected(t);
  const orders = generateOrders();

  t.mock.method(Order, 'find', (filter) => ({
    sort: () => ({
      skip: (skipCount) => ({
        limit: (limitCount) => ({
          lean: async () => {
            let res = [...orders];
            if (filter.status) {
              res = res.filter(o => filter.status.test ? filter.status.test(o.status) : o.status === filter.status);
            }
            if (filter.$or) {
              res = res.filter(o => filter.$or.some(c => {
                if (c.orderNumber && c.orderNumber.test(o.orderNumber)) return true;
                if (c.orderId && c.orderId.test(o.orderId)) return true;
                if (c['customer.firstName'] && c['customer.firstName'].test(o.customer.firstName)) return true;
                if (c['customer.email'] && c['customer.email'].test(o.customer.email)) return true;
                return false;
              }));
            }
            return res.slice(skipCount, skipCount + limitCount);
          }
        })
      })
    })
  }));

  t.mock.method(Order, 'countDocuments', async (filter) => {
    let res = [...orders];
    if (filter.status) {
      res = res.filter(o => filter.status.test ? filter.status.test(o.status) : o.status === filter.status);
    }
    if (filter.$or) {
      res = res.filter(o => filter.$or.some(c => {
        if (c.orderNumber && c.orderNumber.test(o.orderNumber)) return true;
        if (c.orderId && c.orderId.test(o.orderId)) return true;
        if (c['customer.firstName'] && c['customer.firstName'].test(o.customer.firstName)) return true;
        if (c['customer.email'] && c['customer.email'].test(o.customer.email)) return true;
        return false;
      }));
    }
    return res.length;
  });

  // 1. Page 1 returns 25 items of 40 total
  const p1Res = await fetch(`${base}/api/admin/orders?page=1&limit=25`, { headers: adminHeaders() });
  assert.equal(p1Res.status, 200);
  const p1Body = await p1Res.json();
  assert.equal(p1Body.data.length, 25);
  assert.equal(p1Body.pagination.total, 40);
  assert.equal(p1Body.pagination.totalPages, 2);
  assert.equal(p1Body.pagination.pageSize, 25);

  // Order 29 (customer Krittaphas) is on page 2
  assert.ok(!p1Body.data.some(o => o.customer.firstName === 'Krittaphas'));

  // 2. Search for Krittaphas finds the order immediately
  const searchRes = await fetch(`${base}/api/admin/orders?page=1&limit=25&search=Krittaphas`, { headers: adminHeaders() });
  assert.equal(searchRes.status, 200);
  const searchBody = await searchRes.json();
  assert.equal(searchBody.pagination.total, 1);
  assert.equal(searchBody.data[0].customer.firstName, 'Krittaphas');
  assert.equal(searchBody.data[0].orderNumber, 'ORD-2026-0029');

  // 3. Status filter: 'Shipped'
  const statusRes = await fetch(`${base}/api/admin/orders?page=1&limit=25&status=Shipped`, { headers: adminHeaders() });
  assert.equal(statusRes.status, 200);
  const statusBody = await statusRes.json();
  assert.ok(statusBody.data.every(o => o.status === 'Shipped'));
  assert.equal(statusBody.pagination.total, orders.filter(o => o.status === 'Shipped').length);
});

test('Task 5 — Members: Server-side pagination, search finds member on page 2, tier filter', async (t) => {
  mockDbConnected(t);
  const members = generateMembers();

  t.mock.method(User, 'find', (filter) => ({
    select: () => ({
      sort: () => ({
        skip: (skipCount) => ({
          limit: (limitCount) => ({
            lean: async () => {
              let res = [...members];
              if (filter.tier) {
                if (filter.tier.test) res = res.filter(m => filter.tier.test(m.tier));
                else if (filter.tier.$not) res = res.filter(m => !filter.tier.$not.test(m.tier));
              }
              if (filter.$or) {
                res = res.filter(m => filter.$or.some(c => {
                  if (c.name && c.name.test(m.name)) return true;
                  if (c.firstName && c.firstName.test(m.firstName)) return true;
                  if (c.lastName && c.lastName.test(m.lastName)) return true;
                  if (c.email && c.email.test(m.email)) return true;
                  return false;
                }));
              }
              return res.slice(skipCount, skipCount + limitCount);
            }
          })
        })
      })
    })
  }));

  t.mock.method(User, 'countDocuments', async (filter) => {
    let res = [...members];
    if (filter.tier) {
      if (filter.tier.test) res = res.filter(m => filter.tier.test(m.tier));
      else if (filter.tier.$not) res = res.filter(m => !filter.tier.$not.test(m.tier));
    }
    if (filter.$or) {
      res = res.filter(m => filter.$or.some(c => {
        if (c.name && c.name.test(m.name)) return true;
        if (c.firstName && c.firstName.test(m.firstName)) return true;
        if (c.lastName && c.lastName.test(m.lastName)) return true;
        if (c.email && c.email.test(m.email)) return true;
        return false;
      }));
    }
    return res.length;
  });

  t.mock.method(Order, 'aggregate', async () => []);

  // 1. Page 1 returns 25 members of 40 total
  const p1Res = await fetch(`${base}/api/users?page=1&limit=25`, { headers: adminHeaders() });
  assert.equal(p1Res.status, 200);
  const p1Body = await p1Res.json();
  assert.equal(p1Body.data.length, 25);
  assert.equal(p1Body.pagination.total, 40);
  assert.equal(p1Body.pagination.pageSize, 25);
  assert.equal(p1Body.pagination.totalPages, 2);

  // Member 32 ('Pornpimol VIP Star') is on page 2
  assert.ok(!p1Body.data.some(m => m.name.includes('Pornpimol')));

  // 2. Search finds Pornpimol from page 1
  const searchRes = await fetch(`${base}/api/users?page=1&limit=25&search=Pornpimol`, { headers: adminHeaders() });
  assert.equal(searchRes.status, 200);
  const searchBody = await searchRes.json();
  assert.equal(searchBody.pagination.total, 1);
  assert.equal(searchBody.data[0].name, 'Pornpimol VIP Star');
  assert.equal(searchBody.data[0].tier, 'VIP Connoisseur');

  // 3. Filter by tier=VIP (40 / 4 = 10 items)
  const vipRes = await fetch(`${base}/api/users?page=1&limit=25&tier=VIP`, { headers: adminHeaders() });
  assert.equal(vipRes.status, 200);
  const vipBody = await vipRes.json();
  assert.equal(vipBody.pagination.total, members.filter(m => m.tier.includes('VIP')).length);
  assert.ok(vipBody.data.every(m => m.tier.includes('VIP')));
});
