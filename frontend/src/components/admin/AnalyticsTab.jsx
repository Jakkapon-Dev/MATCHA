import React from 'react';
import AdminDataState from './AdminDataState';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function AnalyticsTab({ status, errors, totalRevenue, monthlyData }) {
  const { t } = useLanguage();
  return (<AdminDataState resources={["stats"]} status={status} errors={errors}>
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-6 rounded-2xl bg-white border border-matcha-border shadow-sm">
                <h3 className="font-bold text-base uppercase font-sans mb-4">{t('admin.analytics.title')}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-matcha-bg border border-matcha-border">
                    <div className="text-xs font-mono text-matcha-muted">{t('admin.analytics.paidRevenue')}</div>
                    <div className="text-2xl font-black text-matcha-primary font-mono mt-1">${totalRevenue.toLocaleString()}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-matcha-bg border border-matcha-border">
                    <div className="text-xs font-mono text-matcha-muted">{t('admin.analytics.profitMargin')}</div>
                    <div className="text-2xl font-black text-matcha-text font-mono mt-1">{t('admin.analytics.notTracked')}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-matcha-bg border border-matcha-border">
                    <div className="text-xs font-mono text-matcha-muted">{t('admin.analytics.conversionRate')}</div>
                    <div className="text-2xl font-black text-matcha-accent font-mono mt-1">{t('admin.analytics.notTracked')}</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-matcha-border text-matcha-muted">
                        <th className="pb-3 font-bold">{t('admin.analytics.colMonth')}</th>
                        <th className="pb-3 font-bold">{t('admin.analytics.colRevenue')}</th>
                        <th className="pb-3 font-bold">{t('admin.analytics.colOrders')}</th>
                        
                        
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-matcha-border/40">
                      {monthlyData.length === 0 && <tr><td colSpan={3} className="py-6 text-center">{t('admin.analytics.noData')}</td></tr>}
                      {monthlyData.map(m => (
                        <tr key={m.month} className="hover:bg-matcha-bg/80">
                          <td className="py-3 font-bold text-matcha-text">{m.month}</td>
                          <td className="py-3 font-bold text-matcha-primary">${m.revenue.toLocaleString()}</td>
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
