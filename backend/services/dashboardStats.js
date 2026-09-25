import { AWAITING_PAYMENT } from '../config/paymentStates.js';

/* The admin dashboard's figures, counted by the database.
 *
 * They used to be added up in the browser from whatever the three tables were
 * holding. Those tables are paginated at 25 rows, so with 75 garments in the
 * catalogue "Active Stock Units", "Low Stock", "garment lines", the category
 * split and the revenue chart all described the first page and nothing else —
 * every one of them understated, and every one of them changing when an
 * administrator turned a page.
 *
 * The pipelines live here, named and exported, so the rules they encode can be
 * asserted directly rather than inferred from a rendered number.
 *
 * These are deliberately unfiltered by the tables' own search and category
 * controls: they describe the shop, not the view.
 */

/* Low stock is ten units or fewer, the same threshold the inventory table's
   own status column uses. The two must agree, or the dashboard's alert count
   and the list it sends you to will disagree. */
export const LOW_STOCK_THRESHOLD = 10;

export const PRODUCT_TOTALS_PIPELINE = [
  {
    $group: {
      _id: null,
      totalProducts: { $sum: 1 },
      totalStockUnits: { $sum: { $ifNull: ['$stock', 0] } },
      lowStockCount: {
        $sum: { $cond: [{ $lte: [{ $ifNull: ['$stock', 0] }, LOW_STOCK_THRESHOLD] }, 1, 0] }
      }
    }
  }
];

// No $match: the category split is over the whole catalogue.
export const CATEGORY_PIPELINE = [
  { $group: { _id: '$category', count: { $sum: 1 } } }
];

/* Revenue counts an order only when it was actually paid and was not
   cancelled. Both conditions matter: a cancelled order can have been paid and
   later refunded, and an unpaid order is not money. */
export const ORDER_TOTALS_PIPELINE = [
  {
    $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      // The paid, non-cancelled orders — the ones paidRevenue is summed from.
      // The average order value has to divide by these, not by every order:
      // dividing paid revenue by a count that includes unpaid orders invents a
      // figure that is neither the average paid order nor anything else.
      paidOrders: {
        $sum: {
          $cond: [
            { $and: [{ $ne: ['$status', 'cancelled'] }, { $eq: ['$paymentStatus', 'paid'] }] },
            1,
            0
          ]
        }
      },
      paidRevenue: {
        $sum: {
          $cond: [
            { $and: [{ $ne: ['$status', 'cancelled'] }, { $eq: ['$paymentStatus', 'paid'] }] },
            { $ifNull: ['$total', 0] },
            0
          ]
        }
      }
    }
  }
];

/* The chart. Cancelled orders are excluded outright — they are not part of
   the month's trade at all — and within what is left only paid orders add to
   the revenue bar, while the order count includes those still awaiting
   payment. */
export const MONTHLY_PIPELINE = [
  { $match: { status: { $ne: 'cancelled' } } },
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
      orders: { $sum: 1 },
      revenue: {
        $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, { $ifNull: ['$total', 0] }, 0] }
      }
    }
  },
  { $sort: { _id: 1 } }
];

/* Every order in exactly one of four groups, for the order-status chart.

   Cancelled comes first whatever the payment says: a cancelled order is not
   trade, paid or not. Of the rest, a confirmed payment is "paid", the states
   that still owe money are "awaiting", and anything else (refunded, expired)
   is "other". An order with no paymentStatus predates the payment lifecycle
   and is read as unpaid, the state those orders were written in. */
export const ORDER_STATUS_GROUPS = ['paid', 'awaiting', 'cancelled', 'other'];
export const ORDER_STATUS_PIPELINE = [
  {
    $group: {
      _id: {
        $switch: {
          branches: [
            { case: { $eq: ['$status', 'cancelled'] }, then: 'cancelled' },
            { case: { $eq: ['$paymentStatus', 'paid'] }, then: 'paid' },
            { case: { $in: [{ $ifNull: ['$paymentStatus', 'unpaid'] }, [...AWAITING_PAYMENT]] }, then: 'awaiting' }
          ],
          default: 'other'
        }
      },
      count: { $sum: 1 },
      amount: { $sum: { $ifNull: ['$total', 0] } }
    }
  }
];

// A member is VIP when their tier says so; the tier strings carry a grade.
export const MEMBER_PIPELINE = [
  {
    $group: {
      _id: null,
      totalMembers: { $sum: 1 },
      vipMembers: {
        $sum: { $cond: [{ $regexMatch: { input: { $ifNull: ['$tier', ''] }, regex: 'VIP' } }, 1, 0] }
      }
    }
  }
];

/* Run all six and shape them into what the dashboard reads.
 *
 * The models are passed in rather than imported so this can be exercised
 * without a database. Nothing here invents a figure: an empty collection
 * answers zero, which is true, and a failure propagates to the caller so the
 * route can say the numbers are unavailable rather than serve made-up ones.
 */
export async function collectDashboardStats({ Product, Order, User }) {
  const [productAgg, categoryAgg, orderAgg, monthlyAgg, memberAgg, statusAgg] = await Promise.all([
    Product.aggregate(PRODUCT_TOTALS_PIPELINE),
    Product.aggregate(CATEGORY_PIPELINE),
    Order.aggregate(ORDER_TOTALS_PIPELINE),
    Order.aggregate(MONTHLY_PIPELINE),
    User.aggregate(MEMBER_PIPELINE),
    Order.aggregate(ORDER_STATUS_PIPELINE)
  ]);

  const products = productAgg?.[0] || { totalProducts: 0, totalStockUnits: 0, lowStockCount: 0 };
  const orders = orderAgg?.[0] || { totalOrders: 0, paidOrders: 0, paidRevenue: 0 };
  const members = memberAgg?.[0] || { totalMembers: 0, vipMembers: 0 };

  // Every group is always present, so the chart never meets a missing slice.
  const orderStatus = Object.fromEntries(ORDER_STATUS_GROUPS.map(key => [key, { count: 0, amount: 0 }]));
  for (const row of statusAgg || []) {
    if (orderStatus[row?._id]) {
      orderStatus[row._id] = { count: row.count || 0, amount: Math.round((row.amount || 0) * 100) / 100 };
    }
  }

  const categories = {};
  for (const row of categoryAgg || []) {
    if (row._id) categories[row._id] = row.count;
  }

  return {
    totalProducts: products.totalProducts || 0,
    totalStockUnits: products.totalStockUnits || 0,
    lowStockCount: products.lowStockCount || 0,
    categories,
    totalOrders: orders.totalOrders || 0,
    paidOrders: orders.paidOrders || 0,
    paidRevenue: orders.paidRevenue || 0,
    orderStatus,
    monthly: (monthlyAgg || [])
      .filter(row => row._id)
      .map(row => ({ month: row._id, orders: row.orders, revenue: row.revenue })),
    totalMembers: members.totalMembers || 0,
    vipMembers: members.vipMembers || 0
  };
}

export default collectDashboardStats;
