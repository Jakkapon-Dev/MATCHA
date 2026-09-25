const titleCase = value => value ? value[0].toUpperCase() + value.slice(1) : 'Unknown';

/* The payment lifecycle carries more than three states now, and two of them
   are two words. Without this the admin table reads "Pending_payment". */
const PAYMENT_LABELS = {
  unpaid: 'Unpaid',
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  failed: 'Failed',
  expired: 'Expired',
  refunded: 'Refunded'
};

export const paymentLabel = value => PAYMENT_LABELS[value] || titleCase(value);

/* The order statuses an admin can set, as the status control shows them.

   Stored rows do not all agree on case — "pending" next to "Processing" and
   "Delivered" — and older ones carry "completed", which is not one of these.
   titleCase only raised the first letter, so "completed" became "Completed",
   matched no option, and the status control fell back to showing Pending: an
   admin read a finished order as untouched. Statuses are now matched without
   regard to case, and one outside the list is shown as it is, not as Pending. */
export const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const ORDER_STATUS_BY_KEY = Object.fromEntries(ORDER_STATUSES.map((label) => [label.toLowerCase(), label]));

export const orderStatusLabel = (value) => {
  const key = String(value ?? '').trim().toLowerCase();
  if (!key) return 'Unknown';
  return ORDER_STATUS_BY_KEY[key] || key[0].toUpperCase() + key.slice(1);
};

export const isKnownOrderStatus = (label) => ORDER_STATUSES.includes(label);

export function normalizeProduct(product) {
  /* Kept as its own field so the inventory table can offer the sizes that
     actually exist. A product with buckets can only be restocked per size —
     `stock` is the sum of them, not somewhere you can put units. */
  const sizeStock = Array.isArray(product.sizeStock)
    ? product.sizeStock.map(row => ({ size: row.size, stock: Number(row.stock) || 0 }))
    : [];
  /* `quantity` is legacy seed data. A restock changes `stock` (and each size
     bucket), so preferring quantity made the admin table appear not to update
     even after the server had saved the mutation. Size buckets are the source
     of truth once present; otherwise use the current stock field first. */
  const bucketTotal = sizeStock.reduce((sum, row) => sum + row.stock, 0);
  const stock = sizeStock.length > 0
    ? bucketTotal
    : Number(product.stock ?? product.quantity ?? 0) || 0;
  /* A garment sold without sizes keeps everything in the single ONE bucket.
     There is nothing to choose there, so the row does not ask. */
  const needsSizeChoice = sizeStock.length > 1 || (sizeStock.length === 1 && sizeStock[0].size !== 'ONE');
  return { ...product, id: product.id || product._id, stock, sizeStock, needsSizeChoice,
    status: stock === 0 ? 'Out of Stock' : stock <= 10 ? 'Low Stock' : 'In Stock' };
}

export function normalizeOrder(order) {
  return {
    id: order.orderId || order.orderNumber || order._id,
    customer: [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Guest',
    email: order.customer?.email || 'Not recorded',
    phone: order.customer?.phone || null,
    address: [order.customer?.address, order.customer?.city, order.customer?.zipCode, order.customer?.country].filter(Boolean).join(', ') || null,
    items: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    total: order.total ?? 0,
    discount: Number(order.discount) || 0,
    // The coupon as it was when the order was placed — never the live coupon.
    coupon: order.coupon ? { code: order.coupon.code, type: order.coupon.type, value: order.coupon.value, discountAmount: Number(order.coupon.discountAmount) || 0 } : null,
    status: orderStatusLabel(order.status),
    paymentStatus: paymentLabel(order.paymentStatus),
    date: order.createdAt?.split('T')[0] || ''
  };
}

export function normalizeMember(user) {
  return { id: user.id || user._id, name: user.name || 'Member', email: user.email,
    tier: user.tier || 'Regular Member', totalSpent: user.totalSpent ?? 0,
    orders: user.ordersCount ?? 0, joined: user.createdAt?.split('T')[0] || '' };
}
