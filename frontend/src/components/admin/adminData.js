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

export function normalizeProduct(product) {
  const stock = product.quantity ?? product.stock ?? 0;
  /* Kept as its own field so the inventory table can offer the sizes that
     actually exist. A product with buckets can only be restocked per size —
     `stock` is the sum of them, not somewhere you can put units. */
  const sizeStock = Array.isArray(product.sizeStock)
    ? product.sizeStock.map(row => ({ size: row.size, stock: Number(row.stock) || 0 }))
    : [];
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
    status: titleCase(order.status),
    paymentStatus: paymentLabel(order.paymentStatus),
    date: order.createdAt?.split('T')[0] || ''
  };
}

export function normalizeMember(user) {
  return { id: user.id || user._id, name: user.name || 'Member', email: user.email,
    tier: user.tier || 'Regular Member', totalSpent: user.totalSpent ?? 0,
    orders: user.ordersCount ?? 0, joined: user.createdAt?.split('T')[0] || '' };
}
