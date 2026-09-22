import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { sendOrderConfirmation, emailIsConfigured, __test__ } from '../services/email.js';

const { render, COPY } = __test__;

const ORDER = {
  orderNumber: 'MTA-2026-123456-789',
  locale: 'th',
  customer: {
    firstName: 'สมชาย', lastName: 'ใจดี', email: 'somchai@example.test',
    address: '99 ถนนสุขุมวิท', city: 'กรุงเทพฯ', zipCode: '10110',
  },
  items: [
    { name: 'MatchA Autumn Chinos', quantity: 2, size: 'M', color: 'Olive', priceAtPurchase: 81.99 },
    { name: 'MatchA Autumn Loafers', quantity: 1, size: 'EU 41', color: 'Burnt Orange', priceAtPurchase: 61.99 },
  ],
  subtotal: 225.97, shippingCost: 0, discount: 20, total: 205.97, paymentMethod: 'cod',
};

test('the confirmation carries what the customer needs to recognise their order', () => {
  const { text, html } = render(ORDER, COPY.th);

  assert.ok(text.includes('MTA-2026-123456-789'), 'the order number');
  assert.ok(text.includes('MatchA Autumn Chinos'), 'every line, first');
  assert.ok(text.includes('MatchA Autumn Loafers'), 'every line, second');
  assert.ok(text.includes('$205.97'), 'the total actually charged');

  // 2 x 81.99: a line priced per unit rather than per line is the kind of
  // error a customer only notices on their statement.
  assert.ok(text.includes('$163.98'), 'lines are priced by quantity');

  assert.ok(text.includes('-$20.00'), 'a discount reads as a deduction');
  assert.ok(text.includes('ฟรี'), 'free delivery says so rather than showing $0.00');
  assert.ok(html.startsWith('<!doctype html'), 'the HTML part is a whole document');
});

test('each language is written in that language alone', () => {
  const thai = /[฀-๿]/;
  const { text } = render({ ...ORDER, locale: 'en' }, COPY.en);

  // The address and the customer's own name stay as they were written. Those
  // belong to the customer; the rest is the shop speaking.
  const shopsWords = text.split('\n').filter(
    l => !l.includes('สุขุมวิท') && !l.includes('กรุงเทพ') && !l.includes('สมชาย')
  );

  assert.ok(!shopsWords.some(l => thai.test(l)), 'no Thai in the English email');
  assert.ok(text.includes('Order reference') && text.includes('Total'));
  assert.ok(COPY.th.subject('X').includes('ยืนยัน'), 'and the Thai subject is Thai');
});

test('a name cannot carry markup into the message', () => {
  const nasty = { ...ORDER, customer: { ...ORDER.customer, firstName: '<script>alert(1)</script>', lastName: '' } };
  const { html } = render(nasty, COPY.en);
  assert.ok(!html.includes('<script>'), 'not emitted as a tag');
  assert.ok(html.includes('&lt;script&gt;'), 'still readable as text');
});

test('with no provider configured, sending is a quiet no-op', async () => {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  try {
    assert.equal(emailIsConfigured(), false);
    const result = await sendOrderConfirmation(ORDER);
    assert.equal(result.sent, false);
    assert.match(result.reason, /not configured/);
  } finally {
    if (key !== undefined) process.env.RESEND_API_KEY = key;
    if (from !== undefined) process.env.EMAIL_FROM = from;
  }
});

test('an order with no address on it never reaches the provider', async () => {
  const result = await sendOrderConfirmation({ ...ORDER, customer: { ...ORDER.customer, email: '' } });
  assert.equal(result.sent, false);
  assert.match(result.reason, /no address/);
});

/* What actually goes over the wire.
 *
 * A stand-in provider on localhost, so the request can be inspected without an
 * account, a key, or anything leaving the machine. */
let server;
let received;
let baseUrl;

before(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      received = { method: req.method, auth: req.headers.authorization, type: req.headers['content-type'], body: JSON.parse(body || '{}') };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'stub' }));
    });
  });
  await new Promise(resolve => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => { if (server) server.close(); });

test('a configured shop posts the message the provider expects', async () => {
  const before = { key: process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM, url: process.env.RESEND_ENDPOINT };
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'shop@matcha.test';
  process.env.RESEND_ENDPOINT = baseUrl;

  try {
    const result = await sendOrderConfirmation(ORDER);
    assert.equal(result.sent, true, 'a 200 from the provider counts as sent');

    assert.equal(received.method, 'POST');
    assert.equal(received.auth, 'Bearer test-key', 'the key travels as a bearer token');
    assert.match(received.type, /application\/json/);
    assert.deepEqual(received.body.to, ['somchai@example.test'], 'addressed to the customer');
    assert.equal(received.body.from, 'shop@matcha.test');
    assert.ok(received.body.subject.includes('MTA-2026-123456-789'), 'the subject names the order');

    // Both parts, so a client that refuses HTML still shows something useful.
    assert.ok(received.body.html && received.body.text, 'HTML and plain text both go');
  } finally {
    process.env.RESEND_API_KEY = before.key;
    process.env.EMAIL_FROM = before.from;
    if (before.url === undefined) delete process.env.RESEND_ENDPOINT; else process.env.RESEND_ENDPOINT = before.url;
  }
});

test('a provider that refuses is reported, not thrown', async () => {
  const before = { key: process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM, url: process.env.RESEND_ENDPOINT };
  const refusing = http.createServer((req, res) => {
    req.resume();
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'domain not verified' }));
  });
  await new Promise(resolve => refusing.listen(0, resolve));

  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'shop@matcha.test';
  process.env.RESEND_ENDPOINT = `http://127.0.0.1:${refusing.address().port}`;

  try {
    const result = await sendOrderConfirmation(ORDER);
    assert.equal(result.sent, false);
    assert.match(result.reason, /provider 403/, 'the status is carried back');
    assert.match(result.detail, /domain not verified/, "and the provider's reason with it");
  } finally {
    refusing.close();
    process.env.RESEND_API_KEY = before.key;
    process.env.EMAIL_FROM = before.from;
    if (before.url === undefined) delete process.env.RESEND_ENDPOINT; else process.env.RESEND_ENDPOINT = before.url;
  }
});
