import React from 'react';
import { Package, ShoppingBag, DollarSign, Users, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import AdminDataState from './AdminDataState';

/* One shape for every headline figure, so the four cards read as a row
   rather than four differently-dressed boxes. */
function KpiCard({ label, icon: Icon, value, unit, footnote, footnoteTone = 'muted', footnoteIcon: FootIcon }) {
  const toneClass = footnoteTone === 'alert' ? 'text-matcha-accent' : footnoteTone === 'good' ? 'text-matcha-secondary' : 'text-matcha-muted';
  return (
    <section className="p-5 rounded-2xl bg-white border border-matcha-border flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-matcha-muted leading-snug">{label}</h3>
        <span className="w-8 h-8 rounded-lg bg-matcha-bg text-matcha-primary flex items-center justify-center shrink-0" aria-hidden="true">
          <Icon size={16} />
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl lg:text-[1.75rem] leading-none font-semibold tracking-tight tabular-nums text-matcha-text truncate">
          {value}{unit && <span className="ml-1.5 text-xs font-normal text-matcha-muted">{unit}</span>}
        </p>
        <p className={`mt-2 flex items-center gap-1.5 text-[11px] font-mono ${toneClass}`}>
          {FootIcon && <FootIcon size={12} className="shrink-0" aria-hidden="true" />}
          <span className="truncate">{footnote}</span>
        </p>
      </div>
    </section>
  );
}

function Panel({ title, subtitle, aside, children, className = '' }) {
  return (
    <section className={`p-5 sm:p-6 rounded-2xl bg-white border border-matcha-border min-w-0 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-matcha-text">{title}</h3>
          {subtitle && <p className="text-xs font-mono text-matcha-muted mt-0.5">{subtitle}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

const STATUS_TONE = {
  Delivered: 'bg-green-50 text-green-800 border-green-200',
  Shipped: 'bg-blue-50 text-blue-800 border-blue-200',
  Cancelled: 'bg-matcha-bg text-matcha-muted border-matcha-border'
};

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
  const maxRevenue = Math.max(1, ...monthlyData.map(month => month.revenue));
  const currentMonth = new Date().toISOString().slice(0, 7);
  return (<AdminDataState resources={["stats","orders"]} status={status} errors={errors}>
    <div className="space-y-6 animate-fade-in">

      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Paid Revenue"
          icon={DollarSign}
          value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          footnote="Confirmed paid orders"
          footnoteTone="good"
          footnoteIcon={CheckCircle2}
        />
        <KpiCard
          label="Customer Orders"
          icon={ShoppingBag}
          value={totalOrdersCount}
          unit="orders"
          footnote={`Avg. Paid Order: $${avgPaidOrderValue.toFixed(2)}`}
        />
        <KpiCard
          label="Active Stock Units"
          icon={Package}
          value={totalStockUnits}
          unit="units"
          footnote={`Across ${totalProductsCount} garment lines`}
        />
        <KpiCard
          label="VIP Members"
          icon={Users}
          value={vipMembersCount}
          unit="VIPs"
          footnote={`${lowStockCount} Low stock alerts`}
          footnoteTone={lowStockCount > 0 ? 'alert' : 'muted'}
          footnoteIcon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Panel
          className="lg:col-span-8"
          title="Monthly Revenue"
          subtitle="Confirmed payments by month (USD)"
          aside={<span className="px-2.5 py-1 rounded-lg bg-matcha-bg text-matcha-primary font-mono text-xs font-bold tabular-nums">Total ${totalRevenue.toLocaleString()}</span>}
        >
          {monthlyData.length === 0 ? (
            <p className="h-56 flex items-center justify-center text-xs font-mono text-matcha-muted border border-dashed border-matcha-border rounded-xl">No revenue data yet.</p>
          ) : (
            <div className="h-56 flex items-end justify-between gap-2 sm:gap-3 overflow-x-auto">
              {monthlyData.map((item) => {
                const heightPercent = Math.min(100, Math.round((item.revenue / maxRevenue) * 100));
                const isCurrentMonth = item.month === currentMonth;
                return (
                  <div key={item.month} className="flex-1 min-w-9 flex flex-col items-center gap-2 group h-full justify-end">
                    <span className="text-[10px] font-mono font-bold text-matcha-muted opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                      ${(item.revenue / 1000).toFixed(1)}k
                    </span>
                    <div className="w-full max-w-10 bg-matcha-bg rounded-t-lg h-full flex items-end overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-125 ${isCurrentMonth ? 'bg-matcha-secondary' : 'bg-matcha-primary'}`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-matcha-muted whitespace-nowrap">{item.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          className="lg:col-span-4 flex flex-col"
          title="Category Share"
          subtitle="Garment lines by category"
        >
          <div className="space-y-4 flex-1">
            {categoryDistribution.map(cat => (
              <div key={cat.label} className="space-y-1.5">
                <div className="flex justify-between gap-2 text-xs font-mono">
                  <span className="text-matcha-text truncate">{cat.label}</span>
                  <span className="text-matcha-muted tabular-nums shrink-0">{cat.count} items ({cat.percent}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-matcha-bg overflow-hidden">
                  <div style={{ width: `${cat.percent}%`, backgroundColor: cat.color }} className="h-full rounded-full transition-all duration-500" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-matcha-border text-xs font-mono flex items-center justify-between">
            <span className="text-matcha-muted">Total Catalog</span>
            <strong className="text-matcha-primary tabular-nums">{totalProductsCount} Models</strong>
          </div>
        </Panel>
      </div>

      <Panel
        title="Recent Customer Orders"
        subtitle="Latest four from the orders pipeline"
        aside={
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className="text-xs font-mono font-bold text-matcha-primary hover:underline underline-offset-4 flex items-center gap-1 cursor-pointer"
          >
            <span>View all orders</span>
            <ChevronRight size={12} />
          </button>
        }
      >
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
          <table className="w-full min-w-[520px] text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-matcha-border text-[10px] uppercase tracking-[0.12em] text-matcha-muted">
                <th className="pb-3 font-bold">Order ID</th>
                <th className="pb-3 font-bold">Customer</th>
                <th className="pb-3 font-bold">Date</th>
                <th className="pb-3 font-bold text-right">Total ($)</th>
                <th className="pb-3 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-matcha-border/60">
              {orders.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-matcha-muted">No orders yet.</td></tr>}
              {orders.slice(0, 4).map(ord => (
                <tr key={ord.id} className="hover:bg-matcha-bg/60">
                  <td className="py-3 font-bold text-matcha-primary">{ord.id}</td>
                  <td className="py-3 text-matcha-text">{ord.customer}</td>
                  <td className="py-3 text-matcha-muted">{ord.date}</td>
                  <td className="py-3 font-bold text-matcha-text text-right tabular-nums">${ord.total.toFixed(2)}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${STATUS_TONE[ord.status] || 'bg-orange-50 text-matcha-accent border-orange-200'}`}>
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

    </div>
  </AdminDataState>);
}
