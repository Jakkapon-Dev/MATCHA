import React from 'react';
import { Package, ShoppingBag, DollarSign, Users, ChevronRight, AlertTriangle, ArrowUpRight, Activity } from 'lucide-react';
import AdminDataState from './AdminDataState';

/* `orders` is the current page of the orders table and is only used for the
   recent-orders list. Every headline figure arrives already counted across
   the whole collection by GET /admin/stats — totalling the paginated arrays
   here reported on 25 rows out of 75.

   `stats` is listed as a resource so the gate below shows "loading" until
   the aggregate is in, and an error if it never arrives. The alternative —
   falling back to per-page arithmetic — is a KPI that is quietly wrong, and
   nothing on this screen is worth more than being right. */
export default function DashboardTab({ status, errors, totalRevenue, orders, totalOrdersCount, paidOrdersCount = 0, totalStockUnits, totalProductsCount, vipMembersCount, lowStockCount, monthlyData, categoryDistribution, setActiveTab }) {
  // Average paid order value: paid revenue over the orders that were actually
  // paid. Dividing by every order — including those still awaiting payment —
  // reported a smaller, meaningless figure.
  const avgPaidOrderValue = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;
  return (<AdminDataState resources={["stats","orders"]} status={status} errors={errors}>
            <div className="space-y-8 animate-fade-in">
              
              {/* 4 Top Metric KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* KPI 1: Gross Revenue */}
                <div className="p-5 rounded-2xl bg-white border border-matcha-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-matcha-muted">
                    <span>Paid Revenue</span>
                    <div className="w-8 h-8 rounded-xl bg-matcha-secondary/50 text-matcha-primary flex items-center justify-center font-bold">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-matcha-primary font-mono">
                      ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-matcha-primary font-bold mt-1">
                      <ArrowUpRight size={13} />
                      <span>Confirmed paid orders</span>
                    </div>
                  </div>
                </div>

                {/* KPI 2: Total Orders */}
                <div className="p-5 rounded-2xl bg-white border border-matcha-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-matcha-muted">
                    <span>Customer Orders</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-matcha-accent flex items-center justify-center font-bold">
                      <ShoppingBag size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-matcha-text font-mono">
                      {totalOrdersCount} <span className="text-xs font-normal text-matcha-muted">orders</span>
                    </div>
                    <div className="text-[11px] font-mono text-matcha-muted mt-1">
                      Avg. Paid Order: ${avgPaidOrderValue.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* KPI 3: Stock Units */}
                <div className="p-5 rounded-2xl bg-white border border-matcha-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-matcha-muted">
                    <span>Active Stock Units</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                      <Package size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-matcha-text font-mono">
                      {totalStockUnits} <span className="text-xs font-normal text-matcha-muted">units</span>
                    </div>
                    <div className="text-[11px] font-mono text-matcha-muted mt-1">
                      Across {totalProductsCount} garment lines
                    </div>
                  </div>
                </div>

                {/* KPI 4: VIP Customers & Alerts */}
                <div className="p-5 rounded-2xl bg-white border border-matcha-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-matcha-muted">
                    <span>VIP Member Vault</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <Users size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
                      {vipMembersCount} <span className="text-xs font-normal text-matcha-muted">VIPs</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-matcha-accent font-bold mt-1">
                      <AlertTriangle size={12} />
                      <span>{lowStockCount} Low stock alerts</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Monthly Revenue Bar Chart & Category Share Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Chart: Monthly Revenue Histogram */}
                <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-matcha-border shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-matcha-border">
                    <div>
                      <h3 className="font-bold text-base uppercase font-sans">Monthly Revenue Performance</h3>
                      <p className="text-xs font-mono text-matcha-muted">Confirmed payments by month ($USD)</p>
                    </div>
                    <span className="px-3 py-1 bg-matcha-secondary/50 text-matcha-primary font-mono text-xs font-bold rounded-lg">
                      Total: ${totalRevenue.toLocaleString()}
                    </span>
                  </div>

                  {/* Histogram Bars */}
                  <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2">
                    {monthlyData.length === 0 && <p>No revenue data yet.</p>}
                    {monthlyData.map((item) => {
                      const maxRevenue = Math.max(1, ...monthlyData.map(month => month.revenue));
                      const heightPercent = Math.min(100, Math.round((item.revenue / maxRevenue) * 100));
                      const isCurrentMonth = item.month === new Date().toISOString().slice(0, 7);

                      return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          {/* Hover Tooltip Value */}
                          <span className="text-[10px] font-mono font-bold text-matcha-muted opacity-0 group-hover:opacity-100 transition-opacity">
                            ${(item.revenue / 1000).toFixed(1)}k
                          </span>
                          
                          {/* Bar Container */}
                          <div className="w-full max-w-10.5 bg-matcha-bg rounded-t-xl h-full flex items-end p-1 relative overflow-hidden">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${
                                isCurrentMonth ? 'bg-matcha-accent' : 'bg-matcha-primary'
                              }`}
                            />
                          </div>

                          <span className="text-xs font-mono font-bold text-matcha-text">
                            {item.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Chart: Category Distribution */}
                <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-matcha-border shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-matcha-border">
                      <h3 className="font-bold text-sm uppercase font-sans">Category Share</h3>
                      <span className="text-[10px] font-mono text-matcha-muted">Volume</span>
                    </div>

                    <div className="space-y-4">
                      {categoryDistribution.map(cat => (
                        <div key={cat.label} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-matcha-text font-medium">{cat.label}</span>
                            <span className="font-bold text-matcha-muted">{cat.count} items ({cat.percent}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-matcha-bg overflow-hidden border border-matcha-border/40">
                            <div
                              style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                              className="h-full rounded-full transition-all duration-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-matcha-bg border border-matcha-border mt-6 text-xs font-mono flex items-center justify-between">
                    <span className="text-matcha-muted">Total Catalog</span>
                    <strong className="text-matcha-primary">{totalProductsCount} Models</strong>
                  </div>
                </div>

              </div>

              {/* Recent Orders Live Activity Table */}
              <div className="p-6 rounded-2xl bg-white border border-matcha-border shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-matcha-border">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-matcha-primary" />
                    <h3 className="font-bold text-base uppercase font-sans">Recent Customer Orders</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-mono font-bold text-matcha-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Pipeline</span>
                    <ChevronRight size={12} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-matcha-border text-matcha-muted">
                        <th className="pb-3 font-bold">Order ID</th>
                        <th className="pb-3 font-bold">Customer</th>
                        <th className="pb-3 font-bold">Date</th>
                        <th className="pb-3 font-bold">Total ($)</th>
                        <th className="pb-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-matcha-border/40">
                      {orders.length === 0 && <tr><td colSpan={5} className="py-6 text-center">No orders yet.</td></tr>}
                      {orders.slice(0, 4).map(ord => (
                        <tr key={ord.id} className="hover:bg-matcha-bg/80">
                          <td className="py-3 font-bold text-matcha-primary">{ord.id}</td>
                          <td className="py-3 text-matcha-text">{ord.customer}</td>
                          <td className="py-3 text-matcha-muted">{ord.date}</td>
                          <td className="py-3 font-bold text-matcha-text">${ord.total.toFixed(2)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              ord.status === 'Delivered'
                                ? 'bg-green-100 text-green-800'
                                : ord.status === 'Shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-matcha-accent'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
            </AdminDataState>);
}
