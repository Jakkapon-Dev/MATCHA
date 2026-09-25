import { extractAuthUser } from '../middleware/auth.js';

/* Who is allowed to see, or act on, one order.

   An order number is readable — MTA-2026-439417-924 — and therefore worth
   guessing at, so holding one is never enough on its own. An administrator
   qualifies, as does the account the order belongs to, the email on it, or
   the browser that placed it as a guest. */
export function ownsOrder(req, order) {
  const viewer = extractAuthUser(req);
  const callerGuestId = String(req.headers['x-guest-id'] || '').trim();
  return (viewer && (
    String(viewer.role || '').toLowerCase() === 'admin' ||
    (viewer.email && order.customer?.email &&
      String(viewer.email).toLowerCase() === String(order.customer.email).toLowerCase()) ||
    (order.userId && String(order.userId) === String(viewer.id || viewer.userId || viewer._id || ''))
  )) || Boolean(order.guestId && callerGuestId && order.guestId === callerGuestId);
}

export default {
  ownsOrder
};
