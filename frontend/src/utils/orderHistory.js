/* One shape for an order on screen, used by the account page and by the guest
   order page.

   Both show the same list through the same OrdersTab, and the mapping between
   what the API returns and what that component reads lived only inside
   UserAccount. Copying it into a second page is how getCartKey ended up with
   two definitions that disagreed, and how a working button quietly stopped
   working. One definition, imported twice. */

const FALLBACK_ITEM_IMAGE = '/images/products/autumn/tops/shirts/color_1_brown.jpeg';

export function formatOrderForDisplay(order) {
  return {
    id: order.orderId || order.orderNumber || order._id,
    date: order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Today',
    status: order.status || 'pending',
    paymentStatus: order.paymentStatus || 'unpaid',
    paymentMethod: order.paymentMethod || 'visa',
    total: Number(order.total) || 0,
    items: (order.items || []).map((item) => ({
      name: item.name || 'MatchA Garment',
      color: item.color || 'Default',
      size: item.size || '',
      qty: item.quantity || 1,
      price: item.price || 0,
      image: item.image || FALLBACK_ITEM_IMAGE
    }))
  };
}

export function formatOrdersForDisplay(orders = []) {
  return orders.map(formatOrderForDisplay);
}
