import React from 'react';
import AdminDataState from './AdminDataState';
import AdminPagination from './AdminPagination';
import { ORDER_STATUSES, isKnownOrderStatus } from './adminData';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { statusText, paymentText } from './adminI18n';
import { formatCurrency } from '../../utils/currency.js';

export default function OrdersTab({ status, errors, setOrderStatusFilter, orderStatusFilter, filteredOrders, setSelectedOrderForModal, saving, isDemo, handleUpdateOrderStatus, pagination, onPageChange }) {
  const { t } = useLanguage();
  return (<AdminDataState resources={["orders"]} status={status} errors={errors}>
            <div className="space-y-6 animate-fade-in">
              
              {/* Order Status Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['ALL', 'Processing', 'Shipped', 'Delivered', 'Pending'].map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                      orderStatusFilter === st
                        ? 'bg-matcha-primary text-white border-matcha-primary shadow-xs'
                        : 'bg-white text-matcha-muted border-matcha-border hover:border-matcha-primary'
                    }`}
                  >
                    {st === 'ALL' ? t('admin.ordersTab.allOrders') : statusText(t, st)}
                  </button>
                ))}
              </div>

              {/* Orders Table */}
              <div className="rounded-2xl bg-white border border-matcha-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-matcha-bg border-b border-matcha-border text-matcha-muted">
                      <tr>
                        <th className="p-4 font-bold">{t('admin.ordersTab.colOrderRef')}</th>
                        <th className="p-4 font-bold">{t('admin.ordersTab.colCustomer')}</th>
                        <th className="p-4 font-bold">{t('admin.ordersTab.colDate')}</th>
                        <th className="p-4 font-bold">{t('admin.ordersTab.colItems')}</th>
                        <th className="p-4 font-bold">{t('admin.ordersTab.colTotal')}</th>
                        <th className="p-4 font-bold">{t('admin.ordersTab.colPayment')}</th>
                        <th className="p-4 font-bold text-right">{t('admin.ordersTab.colFulfillment')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-matcha-border/40">
                      {filteredOrders.length === 0 && <tr><td colSpan={7} className="p-6 text-center">{t('admin.ordersTab.noOrders')}</td></tr>}
                      {filteredOrders.map(order => (
                        <tr 
                          key={order.id}
                          onClick={() => setSelectedOrderForModal(order)}
                          className="hover:bg-matcha-bg/80 transition-colors cursor-pointer"
                        >
                          <td className="p-4 font-bold text-matcha-primary">{order.id}</td>
                          <td className="p-4">
                            <div className="font-bold text-matcha-text">{order.customer}</div>
                            <div className="text-[10px] text-matcha-muted">{order.email}</div>
                          </td>
                          <td className="p-4 text-matcha-muted">{order.date}</td>
                          <td className="p-4">{order.items}</td>
                          <td className="p-4 font-bold text-matcha-text">{formatCurrency(order.total)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.paymentStatus === 'Paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {paymentText(t, order.paymentStatus)}
                            </span>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={order.status}
                              disabled={saving || isDemo}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border outline-none cursor-pointer ${
                                order.status === 'Delivered' ? 'bg-green-50 border-green-300 text-green-800' :
                                order.status === 'Shipped' ? 'bg-blue-50 border-blue-300 text-blue-800' :
                                order.status === 'Processing' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                                'bg-matcha-bg border-matcha-border text-matcha-text'
                              }`}
                            >
                              {!isKnownOrderStatus(order.status) && (
                                // A stored status outside the list is shown, not replaced by Pending.
                                <option value={order.status} disabled>{statusText(t, order.status)}</option>
                              )}
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>{statusText(t, status)}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <AdminPagination
                  page={pagination?.page}
                  totalPages={pagination?.totalPages}
                  total={pagination?.total}
                  onPageChange={onPageChange}
                  loading={status?.orders === 'loading'}
                />
              </div>

            </div>
            </AdminDataState>);
}
