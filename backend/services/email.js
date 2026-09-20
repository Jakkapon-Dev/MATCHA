/* Sending mail.
 *
 * The shop could not send a single message before this. Someone who ordered
 * had the confirmation screen and nothing else: close the tab and the order
 * number was gone, and the shop had no way to reach them about it either.
 *
 * Resend over plain HTTPS rather than an SDK — it is one POST, and a
 * dependency that exists to build one POST is a dependency to keep updated
 * for no gain. Swapping provider means changing `deliver` below and nothing
 * above it.
 *
 * Two rules hold everywhere in this file:
 *
 *   Nothing here may ever throw at a caller. An order that succeeded must not
 *   be reported as failed because a mail provider was slow, and a shop with no
 *   mail configured at all must still be able to sell.
 *
 *   Nothing here logs an address or the contents of a message. Failures log
 *   the reason and the order number, which is enough to find it again.
 */

/* Read when a message is sent, not when this module is imported.

   Every other setting here is read per call, and this one being fixed at import
   time meant a value set afterwards was silently ignored — which is exactly how
   a shop that sets its key late ends up wondering why nothing sends.

   Overridable so a test can watch what would go out, and so a shop behind an
   egress proxy can point at it. Unset, it is Resend. */
const endpoint = () => process.env.RESEND_ENDPOINT || 'https://api.resend.com/emails';
const TIMEOUT_MS = 8000;

// Warn once rather than on every order, so an unconfigured shop does not fill
// its log with the same line.
let warnedUnconfigured = false;

function config() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  return { apiKey, from, ready: Boolean(apiKey && from) };
}

export function emailIsConfigured() {
  return config().ready;
}

async function deliver({ to, subject, html, text }) {
  const { apiKey, from, ready } = config();

  if (!ready) {
    if (!warnedUnconfigured) {
      warnedUnconfigured = true;
      console.warn('[email] RESEND_API_KEY or EMAIL_FROM is not set — no mail will be sent. Orders are unaffected.');
    }
    return { sent: false, reason: 'not configured' };
  }

  // A provider that stops answering must not hold a request open.
  const abort = AbortSignal.timeout(TIMEOUT_MS);

  try {
    const res = await fetch(endpoint(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
      signal: abort,
    });

    if (!res.ok) {
      // The body carries the provider's reason — a rejected sender domain, a
      // spent quota — and none of the message.
      const detail = await res.text().catch(() => '');
      return { sent: false, reason: `provider ${res.status}`, detail: detail.slice(0, 300) };
    }

    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err?.name === 'TimeoutError' ? 'timed out' : err?.message || 'unknown error' };
  }
}

/* Copy lives here rather than in the frontend dictionary: this is written by
   the server, for a reader who is no longer looking at the site, and the
   language is whichever one they were shopping in. */
const COPY = {
  th: {
    subject: (n) => `ยืนยันคำสั่งซื้อ ${n} — MatchA`,
    greeting: (name) => `สวัสดีคุณ ${name}`,
    placed: 'เราได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว',
    reference: 'เลขที่คำสั่งซื้อ',
    items: 'รายการสินค้า',
    qty: 'จำนวน',
    size: 'ไซซ์',
    subtotal: 'ยอดรวมสินค้า',
    shipping: 'ค่าจัดส่ง',
    discount: 'ส่วนลด',
    total: 'ยอดรวมทั้งสิ้น',
    free: 'ฟรี',
    deliverTo: 'จัดส่งถึง',
    payment: 'วิธีชำระเงิน',
    unpaidNote: 'สถานะการชำระเงินจะอัปเดตเมื่อร้านได้รับเงินแล้ว',
    viewOrders: 'ดูคำสั่งซื้อของคุณ',
    footer: 'อีเมลฉบับนี้ส่งอัตโนมัติ หากมีคำถามกรุณาตอบกลับอีเมลนี้ได้เลย',
  },
  en: {
    subject: (n) => `Order ${n} confirmed — MatchA`,
    greeting: (name) => `Hello ${name}`,
    placed: 'We have your order.',
    reference: 'Order reference',
    items: 'What you ordered',
    qty: 'Qty',
    size: 'Size',
    subtotal: 'Subtotal',
    shipping: 'Delivery',
    discount: 'Discount',
    total: 'Total',
    free: 'Free',
    deliverTo: 'Delivering to',
    payment: 'Payment method',
    unpaidNote: 'The payment status updates once the shop has received the money.',
    viewOrders: 'View your orders',
    footer: 'This message was sent automatically. Reply to it if you have a question.',
  },
};

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;
const escape = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function render(order, copy) {
  const lines = (order.items || []).map((item) => {
    const bits = [`${copy.qty} ${item.quantity}`];
    if (item.size) bits.push(`${copy.size} ${item.size}`);
    if (item.color) bits.push(item.color);
    return { name: item.name, meta: bits.join(' · '), price: money((item.priceAtPurchase || 0) * (item.quantity || 1)) };
  });

  const name = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ').trim() || '—';
  const ref = order.orderNumber || order.orderId || '—';
  const shopUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');

  const text = [
    copy.greeting(name),
    copy.placed,
    '',
    `${copy.reference}: ${ref}`,
    '',
    copy.items,
    ...lines.map((l) => `  - ${l.name} (${l.meta})  ${l.price}`),
    '',
    `${copy.subtotal}: ${money(order.subtotal)}`,
    `${copy.shipping}: ${order.shippingCost ? money(order.shippingCost) : copy.free}`,
    ...(order.discount ? [`${copy.discount}: -${money(order.discount)}`] : []),
    `${copy.total}: ${money(order.total)}`,
    '',
    `${copy.payment}: ${order.paymentMethod}`,
    copy.unpaidNote,
    '',
    `${copy.deliverTo}: ${order.customer?.address || ''} ${order.customer?.city || ''} ${order.customer?.zipCode || ''}`.trim(),
    ...(shopUrl ? ['', `${copy.viewOrders}: ${shopUrl}/orders`] : []),
    '',
    copy.footer,
  ].join('\n');

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#F1F1F1;font-family:ui-monospace,Menlo,Consolas,monospace;color:#0A0A0A">
<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #DCDCDC;padding:28px">
<p style="margin:0 0 4px;font-size:13px">${escape(copy.greeting(name))}</p>
<p style="margin:0 0 20px;font-size:13px">${escape(copy.placed)}</p>
<p style="margin:0 0 20px;font-size:12px;color:#666666">${escape(copy.reference)}<br><strong style="font-size:15px;color:#042509">${escape(ref)}</strong></p>
<p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#666666">${escape(copy.items)}</p>
<table style="width:100%;border-collapse:collapse;font-size:12px">
${lines.map((l) => `<tr><td style="padding:8px 0;border-top:1px solid #DCDCDC">${escape(l.name)}<br><span style="color:#666666">${escape(l.meta)}</span></td><td style="padding:8px 0;border-top:1px solid #DCDCDC;text-align:right;white-space:nowrap">${escape(l.price)}</td></tr>`).join('')}
<tr><td style="padding:8px 0;border-top:1px solid #DCDCDC;color:#666666">${escape(copy.subtotal)}</td><td style="padding:8px 0;border-top:1px solid #DCDCDC;text-align:right">${escape(money(order.subtotal))}</td></tr>
<tr><td style="padding:4px 0;color:#666666">${escape(copy.shipping)}</td><td style="padding:4px 0;text-align:right">${escape(order.shippingCost ? money(order.shippingCost) : copy.free)}</td></tr>
${order.discount ? `<tr><td style="padding:4px 0;color:#666666">${escape(copy.discount)}</td><td style="padding:4px 0;text-align:right">-${escape(money(order.discount))}</td></tr>` : ''}
<tr><td style="padding:10px 0;border-top:1px solid #0A0A0A;font-weight:bold">${escape(copy.total)}</td><td style="padding:10px 0;border-top:1px solid #0A0A0A;text-align:right;font-weight:bold">${escape(money(order.total))}</td></tr>
</table>
<p style="margin:20px 0 4px;font-size:12px"><span style="color:#666666">${escape(copy.payment)}:</span> ${escape(order.paymentMethod)}</p>
<p style="margin:0 0 20px;font-size:11px;color:#666666">${escape(copy.unpaidNote)}</p>
<p style="margin:0 0 20px;font-size:12px"><span style="color:#666666">${escape(copy.deliverTo)}:</span><br>${escape(`${order.customer?.address || ''} ${order.customer?.city || ''} ${order.customer?.zipCode || ''}`.trim())}</p>
${shopUrl ? `<p style="margin:0 0 20px"><a href="${escape(shopUrl)}/orders" style="display:inline-block;background:#042509;color:#FFFFFF;text-decoration:none;padding:10px 18px;font-size:12px">${escape(copy.viewOrders)}</a></p>` : ''}
<p style="margin:0;font-size:11px;color:#666666;border-top:1px solid #DCDCDC;padding-top:14px">${escape(copy.footer)}</p>
</div></body></html>`;

  return { text, html };
}

/* Tell a customer their order was taken.
 *
 * Returns a result rather than throwing, and the caller is expected to log it
 * and carry on: the order is already written, and nothing about it depends on
 * whether this arrived. */
export async function sendOrderConfirmation(order) {
  const to = order?.customer?.email;
  if (!to) return { sent: false, reason: 'no address on the order' };

  const copy = COPY[order.locale === 'en' ? 'en' : 'th'];
  const { text, html } = render(order, copy);

  return deliver({
    to,
    subject: copy.subject(order.orderNumber || order.orderId || ''),
    html,
    text,
  });
}

export const __test__ = { render, COPY, escape };
