const titleCase = value => value ? value[0].toUpperCase() + value.slice(1) : 'Unknown';

export function normalizeProduct(product) {
  const stock = product.quantity ?? product.stock ?? 0;
  return { ...product, id: product.id || product._id, stock,
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
    paymentStatus: titleCase(order.paymentStatus),
    date: order.createdAt?.split('T')[0] || ''
  };
}

export function normalizeMember(user) {
  return { id: user.id || user._id, name: user.name || 'Member', email: user.email,
    tier: user.tier || 'Regular Member', totalSpent: user.totalSpent ?? 0,
    orders: user.ordersCount ?? 0, joined: user.createdAt?.split('T')[0] || '' };
}

export function monthlyRevenue(orders) {
  const months = new Map();
  for (const order of orders) {
    if (!order.date || order.status === 'Cancelled') continue;
    const month = order.date.slice(0, 7);
    const entry = months.get(month) || { month, revenue: 0, orders: 0 };
    entry.orders++;
    if (order.paymentStatus === 'Paid') entry.revenue += order.total;
    months.set(month, entry);
  }
  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
}
