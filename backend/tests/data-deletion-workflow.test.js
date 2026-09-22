import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import adminRoutes from '../routes/adminRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import DeletionRequest from '../models/DeletionRequest.js';
import AuditLog from '../models/AuditLog.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import { User } from '../services/userStore.js';
import { getJwtSecret } from '../middleware/auth.js';

let server, base;
const token = (id, role = 'Member', email = 'user@example.test') =>
  jwt.sign({ id, role, email }, getJwtSecret());
const authHeaders = (id, role = 'Member', email = 'user@example.test') => ({
  Authorization: `Bearer ${token(id, role, email)}`,
  'Content-Type': 'application/json'
});

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
  // `requireAuth` deliberately resolves the account from the user store.  A
  // connected Mongoose instance always has a db object; this lightweight
  // substitute lets the mocked User.findById below exercise that real path.
  mongoose.connection.db = db || {};
  t.after(() => {
    mongoose.connection.readyState = state;
    mongoose.connection.db = db;
  });
}

function mockAuthUsers(t, users) {
  t.mock.method(User, 'findById', (id) => mockUserQuery(users[String(id)] || null));
}

// Mongoose queries work both as promises (`await User.findById`) and through
// `.lean()`.  The account lookup uses the latter, while anonymization uses the
// former so it can save the document.  Keep both paths faithful in this test.
function mockUserQuery(value) {
  return {
    lean: async () => value,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject)
  };
}

test('Task 4 — Authorization: Only Admin can access Deletion Request management & Audit Logs', async (t) => {
  mockDbConnected(t);
  mockAuthUsers(t, {
    u_member_1: { _id: 'u_member_1', role: 'Member', email: 'user@example.test' }
  });

  // 1. Unauthenticated requests return 401
  const unauthList = await fetch(`${base}/api/admin/deletion-requests`);
  assert.equal(unauthList.status, 401);

  const unauthAudit = await fetch(`${base}/api/admin/audit-logs`);
  assert.equal(unauthAudit.status, 401);

  // 2. Regular Member requests return 403
  const memberList = await fetch(`${base}/api/admin/deletion-requests`, {
    headers: authHeaders('u_member_1', 'Member')
  });
  assert.equal(memberList.status, 403);

  const memberReview = await fetch(`${base}/api/admin/deletion-requests/del_1/review`, {
    method: 'PATCH',
    headers: authHeaders('u_member_1', 'Member'),
    body: JSON.stringify({ notes: 'Review attempt' })
  });
  assert.equal(memberReview.status, 403);

  const memberApprove = await fetch(`${base}/api/admin/deletion-requests/del_1/approve`, {
    method: 'PATCH',
    headers: authHeaders('u_member_1', 'Member')
  });
  assert.equal(memberApprove.status, 403);

  const memberReject = await fetch(`${base}/api/admin/deletion-requests/del_1/reject`, {
    method: 'PATCH',
    headers: authHeaders('u_member_1', 'Member'),
    body: JSON.stringify({ reason: 'Reject attempt' })
  });
  assert.equal(memberReject.status, 403);

  const memberComplete = await fetch(`${base}/api/admin/deletion-requests/del_1/complete`, {
    method: 'POST',
    headers: authHeaders('u_member_1', 'Member')
  });
  assert.equal(memberComplete.status, 403);

  const memberAudit = await fetch(`${base}/api/admin/audit-logs`, {
    headers: authHeaders('u_member_1', 'Member')
  });
  assert.equal(memberAudit.status, 403);
});

test('Task 4 — Duplicate Request Prevention & E11000 handling', async (t) => {
  mockDbConnected(t);
  const targetUserId = 'u_dup_test_1';
  mockAuthUsers(t, {
    [targetUserId]: { _id: targetUserId, role: 'Member', email: 'dup@test.local' }
  });
  let storedRequest = null;

  t.mock.method(DeletionRequest, 'findOne', filter => {
    if (filter && filter.userId === targetUserId && filter.status === 'pending') {
      return storedRequest;
    }
    return null;
  });

  t.mock.method(DeletionRequest, 'create', async doc => {
    storedRequest = { _id: 'del_req_101', ...doc, createdAt: new Date() };
    return storedRequest;
  });

  t.mock.method(AuditLog, 'create', async () => ({}));

  // Initial submission succeeds
  const res1 = await fetch(`${base}/api/users/me/deletion-request`, {
    method: 'POST',
    headers: authHeaders(targetUserId, 'Member', 'dup@test.local'),
    body: JSON.stringify({ reason: 'Account cleanup' })
  });
  assert.equal(res1.status, 201);
  const data1 = await res1.json();
  assert.equal(data1.success, true);
  assert.equal(data1.data.status, 'pending');

  // Second submission while pending returns 409 Conflict
  const res2 = await fetch(`${base}/api/users/me/deletion-request`, {
    method: 'POST',
    headers: authHeaders(targetUserId, 'Member', 'dup@test.local'),
    body: JSON.stringify({ reason: 'Second try' })
  });
  assert.equal(res2.status, 409);
  const data2 = await res2.json();
  assert.equal(data2.success, false);
  assert.match(data2.message, /already pending/i);

  // Simulate concurrent race condition throwing MongoDB duplicate key E11000
  t.mock.method(DeletionRequest, 'findOne', () => null); // findOne did not catch race
  t.mock.method(DeletionRequest, 'create', async () => {
    const err = new Error('E11000 duplicate key error collection: matcha.deletionrequests index: userId_1 dup key');
    err.code = 11000;
    throw err;
  });

  const res3 = await fetch(`${base}/api/users/me/deletion-request`, {
    method: 'POST',
    headers: authHeaders(targetUserId, 'Member', 'dup@test.local'),
    body: JSON.stringify({ reason: 'Race attempt' })
  });
  assert.equal(res3.status, 409);
  const data3 = await res3.json();
  assert.equal(data3.success, false);
  assert.match(data3.message, /already pending/i);
});

test('Task 4 — Admin Deletion Request Lifecycle: Review, Approve, Reject State Transitions', async (t) => {
  mockDbConnected(t);
  mockAuthUsers(t, {
    u_admin_1: { _id: 'u_admin_1', role: 'Admin', email: 'admin@matcha.local' }
  });

  const requestRecord = {
    _id: 'del_flow_1',
    userId: 'u_target_user',
    email: 'target@customer.local',
    reason: 'GDPR Right to be Forgotten',
    status: 'pending',
    createdAt: new Date(),
    save: async function () { return this; }
  };

  t.mock.method(DeletionRequest, 'findById', async (id) => {
    if (id === 'del_flow_1') return requestRecord;
    return null;
  });

  const auditEvents = [];
  t.mock.method(AuditLog, 'create', async (entry) => {
    auditEvents.push(entry);
    return entry;
  });

  // 1. Admin reviews request
  const reviewRes = await fetch(`${base}/api/admin/deletion-requests/del_flow_1/review`, {
    method: 'PATCH',
    headers: authHeaders('u_admin_1', 'Admin', 'admin@matcha.local'),
    body: JSON.stringify({ notes: 'Identity verified via ticket' })
  });
  assert.equal(reviewRes.status, 200);
  assert.equal(requestRecord.status, 'reviewed');
  assert.equal(requestRecord.reviewedBy, 'admin@matcha.local');
  assert.equal(requestRecord.notes, 'Identity verified via ticket');
  assert.equal(auditEvents[0].action, 'DELETION_REQUEST_REVIEWED');

  // 2. Rejecting from reviewed state
  const rejectRes = await fetch(`${base}/api/admin/deletion-requests/del_flow_1/reject`, {
    method: 'PATCH',
    headers: authHeaders('u_admin_1', 'Admin', 'admin@matcha.local'),
    body: JSON.stringify({ reason: 'Active unresolved dispute', notes: 'Cannot delete during ongoing dispute' })
  });
  assert.equal(rejectRes.status, 200);
  assert.equal(requestRecord.status, 'rejected');
  assert.equal(requestRecord.rejectionReason, 'Active unresolved dispute');
  assert.equal(auditEvents[1].action, 'DELETION_REQUEST_REJECTED');

  // 3. Invalid state transition: Cannot review an already rejected request
  const invalidReview = await fetch(`${base}/api/admin/deletion-requests/del_flow_1/review`, {
    method: 'PATCH',
    headers: authHeaders('u_admin_1', 'Admin', 'admin@matcha.local')
  });
  assert.equal(invalidReview.status, 400);

  // 4. Approve a pending request
  requestRecord.status = 'pending';
  const approveRes = await fetch(`${base}/api/admin/deletion-requests/del_flow_1/approve`, {
    method: 'PATCH',
    headers: authHeaders('u_admin_1', 'Admin', 'admin@matcha.local'),
    body: JSON.stringify({ notes: 'Approved for completion' })
  });
  assert.equal(approveRes.status, 200);
  assert.equal(requestRecord.status, 'approved');
  assert.equal(requestRecord.approvedBy, 'admin@matcha.local');
  assert.equal(auditEvents[2].action, 'DELETION_REQUEST_APPROVED');
});

test('Task 4 — Complete & Anonymization Engine: Orders Sanitized, User Redacted, Tax/Accounting Retained', async (t) => {
  mockDbConnected(t);

  const mockTargetUser = {
    _id: 'u_erase_me',
    name: 'Somchai Prasert',
    firstName: 'Somchai',
    lastName: 'Prasert',
    email: 'somchai@test.local',
    phone: '0812345678',
    passwordHash: '$2a$10$xyz',
    addresses: [{ recipientName: 'Somchai' }],
    avatarUrl: 'https://res.cloudinary.com/avatar.jpg',
    avatarPublicId: 'avatars/somchai',
    isAnonymized: false,
    save: async function () { return this; }
  };

  const mockOrders = [
    {
      _id: 'ord_1',
      orderNumber: 'ORD-2026-001',
      userId: 'u_erase_me',
      totalAmount: 3200,
      paymentMethod: 'Credit Card',
      paymentStatus: 'PAID',
      items: [{ productId: 'p1', name: 'Ceramic Bowl', priceAtPurchase: 1600, quantity: 2 }],
      customer: {
        firstName: 'Somchai',
        lastName: 'Prasert',
        email: 'somchai@test.local',
        phone: '0812345678',
        address: '123 Sukhumvit Rd',
        city: 'Bangkok',
        zipCode: '10110',
        country: 'Thailand'
      },
      isAnonymized: false,
      save: async function () { return this; }
    }
  ];

  const approvedRequest = {
    _id: 'del_approved_1',
    userId: 'u_erase_me',
    email: 'somchai@test.local',
    status: 'approved',
    save: async function () { return this; }
  };

  t.mock.method(DeletionRequest, 'findById', async (id) => {
    if (id === 'del_approved_1') return approvedRequest;
    return null;
  });

  t.mock.method(User, 'findById', (id) => mockUserQuery(
    (() => {
      if (id === 'u_erase_me') return mockTargetUser;
      if (id === 'u_admin_super') {
        return { _id: 'u_admin_super', role: 'Admin', email: 'superadmin@matcha.local' };
      }
      return null;
    })()
  ));

  t.mock.method(Order, 'find', async () => mockOrders);

  let cartDeleted = false;
  t.mock.method(Cart, 'deleteMany', async (filter) => {
    if (filter.userId === 'u_erase_me') cartDeleted = true;
    return { deletedCount: 1 };
  });

  const auditLogs = [];
  t.mock.method(AuditLog, 'create', async (entry) => {
    auditLogs.push(entry);
    return entry;
  });

  // Admin executes complete
  const completeRes = await fetch(`${base}/api/admin/deletion-requests/del_approved_1/complete`, {
    method: 'POST',
    headers: authHeaders('u_admin_super', 'Admin', 'superadmin@matcha.local'),
    body: JSON.stringify({ notes: 'Processed right to erasure' })
  });

  assert.equal(completeRes.status, 200);
  const resBody = await completeRes.json();
  assert.equal(resBody.success, true);
  assert.equal(approvedRequest.status, 'completed');
  assert.equal(approvedRequest.completedBy, 'superadmin@matcha.local');

  // Verify Cart was purged
  assert.equal(cartDeleted, true);

  // Verify User record personal identification was deleted / anonymized
  assert.equal(mockTargetUser.name, 'Deleted User');
  assert.equal(mockTargetUser.firstName, 'Deleted');
  assert.equal(mockTargetUser.lastName, 'User');
  assert.equal(mockTargetUser.phone, '');
  assert.equal(mockTargetUser.passwordHash, '');
  assert.equal(mockTargetUser.addresses.length, 0);
  assert.equal(mockTargetUser.avatarUrl, '');
  assert.equal(mockTargetUser.avatarPublicId, '');
  assert.equal(mockTargetUser.isAnonymized, true);
  assert.match(mockTargetUser.email, /^deleted_.*@anonymized\.local$/);

  // Verify Order customer identifiers were redacted while retaining financial compliance records
  const sanitizedOrder = mockOrders[0];
  assert.equal(sanitizedOrder.orderNumber, 'ORD-2026-001');
  assert.equal(sanitizedOrder.totalAmount, 3200);
  assert.equal(sanitizedOrder.paymentStatus, 'PAID');
  assert.equal(sanitizedOrder.items.length, 1);
  assert.equal(sanitizedOrder.isAnonymized, true);
  assert.equal(sanitizedOrder.customer.firstName, 'Anonymized');
  assert.equal(sanitizedOrder.customer.lastName, 'Customer');
  assert.equal(sanitizedOrder.customer.phone, '0000000000');
  assert.equal(sanitizedOrder.customer.zipCode, '00000');
  assert.match(sanitizedOrder.customer.address, /Redacted/);

  // Verify AuditLog recorded DELETION_REQUEST_COMPLETED
  const completeAudit = auditLogs.find(a => a.action === 'DELETION_REQUEST_COMPLETED');
  assert.ok(completeAudit, 'DELETION_REQUEST_COMPLETED audit log entry must exist');
  assert.equal(completeAudit.performedBy, 'superadmin@matcha.local');
  assert.equal(completeAudit.targetUserId, 'u_erase_me');
  assert.equal(completeAudit.details.anonymizedOrdersCount, 1);
  assert.equal(completeAudit.details.financialRecordsPreserved, true);
});

test('Task 4 — Admin Server-Side Search, Filter, and Pagination for Deletion Requests', async (t) => {
  mockDbConnected(t);
  mockAuthUsers(t, {
    u_admin: { _id: 'u_admin', role: 'Admin', email: 'user@example.test' }
  });

  const sampleRequests = [
    { _id: 'd1', userId: 'u1', email: 'alice@test.local', status: 'pending', createdAt: new Date('2026-09-01') },
    { _id: 'd2', userId: 'u2', email: 'bob@test.local', status: 'reviewed', createdAt: new Date('2026-09-02') },
    { _id: 'd3', userId: 'u3', email: 'carol@test.local', status: 'completed', createdAt: new Date('2026-09-03') }
  ];

  t.mock.method(DeletionRequest, 'find', (filter) => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          lean: async () => {
            if (filter.status) {
              return sampleRequests.filter(r => r.status === filter.status);
            }
            if (filter.$or) {
              return sampleRequests.filter(r => r.email.includes('bob'));
            }
            return sampleRequests;
          }
        })
      })
    })
  }));

  t.mock.method(DeletionRequest, 'countDocuments', async (filter) => {
    if (filter.status) {
      return sampleRequests.filter(r => r.status === filter.status).length;
    }
    return sampleRequests.length;
  });

  // 1. List all
  const listAll = await fetch(`${base}/api/admin/deletion-requests?page=1&limit=10`, {
    headers: authHeaders('u_admin', 'Admin')
  });
  assert.equal(listAll.status, 200);
  const dataAll = await listAll.json();
  assert.equal(dataAll.pagination.total, 3);
  assert.equal(dataAll.data.length, 3);

  // 2. Filter by status=pending
  const listPending = await fetch(`${base}/api/admin/deletion-requests?status=pending`, {
    headers: authHeaders('u_admin', 'Admin')
  });
  assert.equal(listPending.status, 200);
  const dataPending = await listPending.json();
  assert.equal(dataPending.pagination.total, 1);
  assert.equal(dataPending.data[0].status, 'pending');

  // 3. Search query
  const listSearch = await fetch(`${base}/api/admin/deletion-requests?search=bob`, {
    headers: authHeaders('u_admin', 'Admin')
  });
  assert.equal(listSearch.status, 200);
  const dataSearch = await listSearch.json();
  assert.equal(dataSearch.data[0].email, 'bob@test.local');
});
