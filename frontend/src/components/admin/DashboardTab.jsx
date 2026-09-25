import React, { useState } from 'react';
import { Package, ShoppingBag, DollarSign, Users, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import AdminDataState from './AdminDataState';
import BreakdownChart, { ChartModeToggle } from './BreakdownChart';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { statusText } from './adminI18n';

/* One shape for every headline figure, so the four cards read as a row
   rather than four differently-dressed boxes. */
function KpiCard({ label, icon: Icon, value, unit, footnote, footnoteTone = 'muted', footnoteIcon: FootIcon, note }) {
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
        {note && <p className="mt-1 text-[11px] font-mono text-matcha-muted truncate">{note}</p>}
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

const ORDER_GROUPS = [
  { key: 'paid', labelKey: 'admin.dashboard.groupPaid', color: '#042509' },
  { key: 'awaiting', labelKey: 'admin.dashboard.groupAwaiting', color: '#518F5C' },
  { key: 'cancelled', labelKey: 'admin.dashboard.groupCancelled', color: '#C91D1D' },
  { key: 'other', labelKey: 'admin.dashboard.groupOther', color: '#D4A338' }
];
const money = value => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
export default function DashboardTab({ status, errors, totalRevenue, orders, totalOrdersCount, paidOrdersCount = 0, orderStatus = null, totalStockUnits, totalProductsCount, vipMembersCount, lowStockCount, monthlyData, categoryDistribution, setActiveTab }) {
  const { t } = useLanguage();
  const [statusMode, setStatusMode] = useState('pie');
  const [statusMetric, setStatusMetric] = useState('count');
  const [categoryMode, setCategoryMode] = useState('bar');
  // Average paid order value: paid revenue over the orders that were actually
  // paid. Dividing by every order — including those still awaiting payment —
  // reported a smaller, meaningless figure.
  const avgPaidOrderValue = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;
  /* "Customer Orders" counts orders that are still trade. It used to count
     every document, cancelled ones included, while revenue, the average and
     the monthly chart all leave cancelled orders out. `totalOrdersCount`
     stays whole-collection for the Orders Pipeline badge, which lists every
     order. A server without the status breakdown falls back to the total. */
  const cancelledCount = orderStatus?.cancelled?.count ?? null;
  const activeOrdersCount = cancelledCount === null ? totalOrdersCount : Math.max(0, totalOrdersCount - cancelledCount);
  const statusItems = orderStatus
    ? ORDER_GROUPS.map(group => ({ label: t(group.labelKey), color: group.color, value: orderStatus[group.key]?.[statusMetric] || 0 }))
    : [];
  const categoryItems = categoryDistribution.map(cat => ({ label: cat.label, color: cat.color, value: cat.count }));
  const maxRevenue = Math.max(1, ...monthlyData.map(month => month.revenue));
  const currentMonth = new Date().toISOString().slice(0, 7);
  return (<AdminDataState resources={["stats","orders"]} status={status} errors={errors}>
    <div className="space-y-6 animate-fade-in">

      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label={t('admin.dashboard.paidRevenue')}
          icon={DollarSign}
          value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          footnote={t('admin.dashboard.confirmedPaid')}
          footnoteTone="good"
          footnoteIcon={CheckCircle2}
        />
        <KpiCard
          label={t('admin.dashboard.customerOrders')}
          icon={ShoppingBag}
          value={activeOrdersCount}
          unit={t('admin.dashboard.ordersUnit')}
          footnote={t('admin.dashboard.avgPaidOrder', { amount: `$${avgPaidOrderValue.toFixed(2)}` })}
          note={cancelledCount ? t('admin.dashboard.cancelledNotCounted', { count: cancelledCount }) : null}
        />
        <KpiCard
          label={t('admin.dashboard.activeStock')}
          icon={Package}
          value={totalStockUnits}
          unit={t('admin.dashboard.unitsUnit')}
          footnote={t('admin.dashboard.acrossLines', { count: totalProductsCount })}
        />
        <KpiCard
          label={t('admin.dashboard.vipMembers')}
          icon={Users}
          value={vipMembersCount}
          unit={t('admin.dashboard.vipUnit')}
          footnote={t('admin.dashboard.lowStockAlerts', { count: lowStockCount })}
          footnoteTone={lowStockCount > 0 ? 'alert' : 'muted'}
          footnoteIcon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Panel
          className="lg:col-span-12"
          title={t('admin.dashboard.monthlyRevenue')}
          subtitle={t('admin.dashboard.monthlySubtitle')}
          aside={<span className="px-2.5 py-1 rounded-lg bg-matcha-bg text-matcha-primary font-mono text-xs font-bold tabular-nums">{t('admin.dashboard.total', { amount: `$${totalRevenue.toLocaleString()}` })}</span>}
        >
          {monthlyData.length === 0 ? (
            <p className="h-56 flex items-center justify-center text-xs font-mono text-matcha-muted border border-dashed border-matcha-border rounded-xl">{t('admin.dashboard.noRevenue')}</p>
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

        {orderStatus && (
          <Panel
            className="lg:col-span-6"
            title={t('admin.dashboard.orderStatus')}
            subtitle={statusMetric === 'count' ? t('admin.dashboard.orderStatusByCount') : t('admin.dashboard.orderStatusByValue')}
            aside={
              <div className="flex flex-wrap gap-2">
                <div role="group" aria-label={t('admin.dashboard.measureLabel')} className="inline-flex p-0.5 rounded-lg bg-matcha-bg border border-matcha-border">
                  {[['count', t('admin.dashboard.measureOrders')], ['amount', t('admin.dashboard.measureValue')]].map(([id, text]) => (
                    <button key={id} type="button" aria-pressed={statusMetric === id} onClick={() => setStatusMetric(id)} className={`h-7 px-2.5 rounded-md text-[11px] font-mono font-bold cursor-pointer transition-colors ${statusMetric === id ? 'bg-white text-matcha-primary shadow-xs' : 'text-matcha-muted hover:text-matcha-text'}`}>{text}</button>
                  ))}
                </div>
                <ChartModeToggle mode={statusMode} onChange={setStatusMode} label={t('admin.dashboard.statusChartType')} />
              </div>
            }
          >
            <BreakdownChart items={statusItems} mode={statusMode} format={statusMetric === 'amount' ? money : String} emptyText={t('admin.dashboard.noOrdersYet')} summaryLabel={t('admin.dashboard.orderStatus')} />
          </Panel>
        )}

        <Panel
          className={`${orderStatus ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col`}
          title={t('admin.dashboard.categoryShare')}
          subtitle={t('admin.dashboard.categorySubtitle')}
          aside={<ChartModeToggle mode={categoryMode} onChange={setCategoryMode} label={t('admin.dashboard.categoryChartType')} />}
        >
          <div className="flex-1">
            <BreakdownChart items={categoryItems} mode={categoryMode} format={value => t('admin.dashboard.itemsCount', { count: value })} emptyText={t('admin.dashboard.noGarments')} summaryLabel={t('admin.dashboard.categoryShare')} />
          </div>
          <div className="mt-6 pt-4 border-t border-matcha-border text-xs font-mono flex items-center justify-between">
            <span className="text-matcha-muted">{t('admin.dashboard.totalCatalog')}</span>
            <strong className="text-matcha-primary tabular-nums">{t('admin.dashboard.models', { count: totalProductsCount })}</strong>
          </div>
        </Panel>
      </div>

      <Panel
        title={t('admin.dashboard.recentOrders')}
        subtitle={t('admin.dashboard.recentSubtitle')}
        aside={
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className="text-xs font-mono font-bold text-matcha-primary hover:underline underline-offset-4 flex items-center gap-1 cursor-pointer"
          >
            <span>{t('admin.dashboard.viewAllOrders')}</span>
            <ChevronRight size={12} />
          </button>
        }
      >
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
          <table className="w-full min-w-[520px] text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-matcha-border text-[10px] uppercase tracking-[0.12em] text-matcha-muted">
                <th className="pb-3 font-bold">{t('admin.dashboard.colOrderId')}</th>
                <th className="pb-3 font-bold">{t('admin.dashboard.colCustomer')}</th>
                <th className="pb-3 font-bold">{t('admin.dashboard.colDate')}</th>
                <th className="pb-3 font-bold text-right">{t('admin.dashboard.colTotal')}</th>
                <th className="pb-3 font-bold text-right">{t('admin.dashboard.colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-matcha-border/60">
              {orders.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-matcha-muted">{t('admin.dashboard.noOrdersYet')}</td></tr>}
              {orders.slice(0, 4).map(ord => (
                <tr key={ord.id} className="hover:bg-matcha-bg/60">
                  <td className="py-3 font-bold text-matcha-primary">{ord.id}</td>
                  <td className="py-3 text-matcha-text">{ord.customer}</td>
                  <td className="py-3 text-matcha-muted">{ord.date}</td>
                  <td className="py-3 font-bold text-matcha-text text-right tabular-nums">${ord.total.toFixed(2)}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${STATUS_TONE[ord.status] || 'bg-orange-50 text-matcha-accent border-orange-200'}`}>
                      {statusText(t, ord.status)}
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
