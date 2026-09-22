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

/* Run all five and shape them into what the dashboard reads.
 *
 * The models are passed in rather than imported so this can be exercised
 * without a database. Nothing here invents a figure: an empty collection
 * answers zero, which is true, and a failure propagates to the caller so the
 * route can say the numbers are unavailable rather than serve made-up ones.
 */
export async function collectDashboardStats({ Product, Order, User }) {
  const [productAgg, categoryAgg, orderAgg, monthlyAgg, memberAgg] = await Promise.all([
    Product.aggregate(PRODUCT_TOTALS_PIPELINE),
    Product.aggregate(CATEGORY_PIPELINE),
    Order.aggregate(ORDER_TOTALS_PIPELINE),
    Order.aggregate(MONTHLY_PIPELINE),
    User.aggregate(MEMBER_PIPELINE)
  ]);

  const products = productAgg?.[0] || { totalProducts: 0, totalStockUnits: 0, lowStockCount: 0 };
  const orders = orderAgg?.[0] || { totalOrders: 0, paidRevenue: 0 };
  const members = memberAgg?.[0] || { totalMembers: 0, vipMembers: 0 };

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
    paidRevenue: orders.paidRevenue || 0,
    monthly: (monthlyAgg || [])
      .filter(row => row._id)
      .map(row => ({ month: row._id, orders: row.orders, revenue: row.revenue })),
    totalMembers: members.totalMembers || 0,
    vipMembers: members.vipMembers || 0
  };
}

export default collectDashboardStats;
