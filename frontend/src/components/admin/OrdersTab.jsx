import React from 'react';
import AdminDataState from './AdminDataState';

export default function OrdersTab({ status, errors, setOrderStatusFilter, orderStatusFilter, filteredOrders, setSelectedOrderForModal, saving, isDemo, handleUpdateOrderStatus }) {
  return (<AdminDataState resources={["orders"]} status={status} errors={errors}>
            <div className="space-y-6 animate-fade-in">
              
              {/* Order Status Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['ALL', 'Processing', 'Shipped', 'Delivered', 'Pending'].map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                      orderStatusFilter === st
                        ? 'bg-[#042509] text-white border-[#042509] shadow-xs'
                        : 'bg-white text-[#666666] border-[#DCDCDC] hover:border-[#042509]'
                    }`}
                  >
                    {st === 'ALL' ? 'All Orders' : st}
                  </button>
                ))}
              </div>

              {/* Orders Table */}
              <div className="rounded-2xl bg-white border border-[#DCDCDC] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[#F1F1F1] border-b border-[#DCDCDC] text-[#666666]">
                      <tr>
                        <th className="p-4 font-bold">Order ID</th>
                        <th className="p-4 font-bold">Customer</th>
                        <th className="p-4 font-bold">Items</th>
                        <th className="p-4 font-bold">Amount</th>
                        <th className="p-4 font-bold">Payment</th>
                        <th className="p-4 font-bold">Date</th>
                        <th className="p-4 font-bold">Fulfillment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCDCDC]/40">
                      {filteredOrders.length === 0 && <tr><td colSpan={7} className="p-6 text-center">No records match the current filters.</td></tr>}
                      {filteredOrders.map(ord => (
                        <tr key={ord.id} className="hover:bg-[#F1F1F1]/80 transition-colors">
                          <td className="p-4 font-bold text-[#042509]">{ord.id}</td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForModal(ord)}
                              className="text-left group cursor-pointer"
                              title="Click to view full Order Tracking & Fulfillment status"
                            >
                              <div className="font-bold text-[#000000] group-hover:text-[#042509] group-hover:underline flex items-center gap-1.5">
                                <span>{ord.customer}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#042509]/10 text-[#042509] font-semibold group-hover:bg-[#042509] group-hover:text-white transition-colors">
                                  Track ↗
                                </span>
                              </div>
                              <div className="text-[10px] text-[#666666]">{ord.email}</div>
                            </button>
                          </td>
                          <td className="p-4 text-[#000000]">{ord.items} pcs</td>
                          <td className="p-4 font-bold text-[#042509]">${Number(ord.total).toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              String(ord.paymentStatus || 'Unknown').toLowerCase() === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ord.paymentStatus || 'Unknown'}
                            </span>
                          </td>
                          <td className="p-4 text-[#666666]">{ord.date}</td>
                          <td className="p-4">
                            <select
                              value={ord.status}
                              disabled={saving || isDemo}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              className="px-2.5 py-1 rounded-lg border border-[#DCDCDC] bg-white font-mono text-xs font-bold text-[#000000] outline-none cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
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
