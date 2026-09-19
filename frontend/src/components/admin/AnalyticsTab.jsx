import React from 'react';
import AdminDataState from './AdminDataState';

export default function AnalyticsTab({ status, errors, totalRevenue, monthlyData }) {
  return (<AdminDataState resources={["orders"]} status={status} errors={errors}>
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-6 rounded-2xl bg-white border border-[#DCDCDC] shadow-sm">
                <h3 className="font-bold text-base uppercase font-sans mb-4">Financial Performance Breakdown</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-[#F1F1F1] border border-[#DCDCDC]">
                    <div className="text-xs font-mono text-[#666666]">Paid Revenue</div>
                    <div className="text-2xl font-black text-[#042509] font-mono mt-1">${totalRevenue.toLocaleString()}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F1F1F1] border border-[#DCDCDC]">
                    <div className="text-xs font-mono text-[#666666]">Estimated Profit Margin</div>
                    <div className="text-2xl font-black text-[#000000] font-mono mt-1">Not tracked</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F1F1F1] border border-[#DCDCDC]">
                    <div className="text-xs font-mono text-[#666666]">Cart Conversion Rate</div>
                    <div className="text-2xl font-black text-[#C91D1D] font-mono mt-1">Not tracked</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[#DCDCDC] text-[#666666]">
                        <th className="pb-3 font-bold">Month</th>
                        <th className="pb-3 font-bold">Revenue ($)</th>
                        <th className="pb-3 font-bold">Orders</th>
                        
                        
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCDCDC]/40">
                      {monthlyData.length === 0 && <tr><td colSpan={3} className="py-6 text-center">No revenue data yet.</td></tr>}
                      {monthlyData.map(m => (
                        <tr key={m.month} className="hover:bg-[#F1F1F1]/80">
                          <td className="py-3 font-bold text-[#000000]">{m.month}</td>
                          <td className="py-3 font-bold text-[#042509]">${m.revenue.toLocaleString()}</td>
                          <td className="py-3">{m.orders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
            </AdminDataState>);
}
