import React from 'react';
import AdminDataState from './AdminDataState';
import AdminPagination from './AdminPagination';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { tr } from './adminI18n';
import { formatCurrency } from '../../utils/currency.js';

const TIER_FILTER_KEYS = { VIP: 'admin.members.vipTier', Regular: 'admin.members.regularTier' };
// Tier names come from the API ('VIP Connoisseur'); an unknown one is shown as stored.
const tierText = (t, tier) => tr(t, `admin.members.tiers.${String(tier ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`, tier);

export default function MembersTab({ status, errors, setMemberTierFilter, memberTierFilter, filteredMembers, handleToggleVIPTier, saving, isDemo, pagination, onPageChange }) {
  const { t } = useLanguage();
  return (<AdminDataState resources={["members"]} status={status} errors={errors}>
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex flex-wrap items-center gap-2">
                {['ALL', 'VIP', 'Regular'].map(tier => (
                  <button
                    key={tier}
                    onClick={() => setMemberTierFilter(tier)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                      memberTierFilter === tier
                        ? 'bg-matcha-primary text-white border-matcha-primary'
                        : 'bg-white text-matcha-muted border-matcha-border hover:border-matcha-primary'
                    }`}
                  >
                    {tier === 'ALL' ? t('admin.members.allCustomers') : t(TIER_FILTER_KEYS[tier])}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl bg-white border border-matcha-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-matcha-bg border-b border-matcha-border text-matcha-muted">
                      <tr>
                        <th className="p-4 font-bold">{t('admin.members.colMemberId')}</th>
                        <th className="p-4 font-bold">{t('admin.members.colName')}</th>
                        <th className="p-4 font-bold">{t('admin.members.colEmail')}</th>
                        <th className="p-4 font-bold">{t('admin.members.colTotalSpent')}</th>
                        <th className="p-4 font-bold">{t('admin.members.colTier')}</th>
                        <th className="p-4 font-bold text-right">{t('admin.members.colActions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-matcha-border/40">
                      {filteredMembers.length === 0 && <tr><td colSpan={6} className="p-6 text-center">{t('admin.members.noMembers')}</td></tr>}
                      {filteredMembers.map(mem => (
                        <tr key={mem.id} className="hover:bg-matcha-bg/80 transition-colors">
                          <td className="p-4 font-bold text-matcha-primary">{mem.id}</td>
                          <td className="p-4 font-bold text-matcha-text">{mem.name}</td>
                          <td className="p-4 text-matcha-muted">{mem.email}</td>
                          <td className="p-4 font-bold text-matcha-primary">{formatCurrency(mem.totalSpent)}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              mem.tier.includes('VIP')
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {tierText(t, mem.tier)}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleToggleVIPTier(mem.id)}
                              disabled={saving || isDemo}
                              className="px-3 py-1 rounded-lg border border-matcha-border hover:border-matcha-primary text-xs font-mono font-bold text-matcha-text transition-all cursor-pointer"
                            >
                              {mem.tier.includes('VIP') ? t('admin.members.demote') : t('admin.members.promote')}
                            </button>
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
                  loading={status?.members === 'loading'}
                />
              </div>

            </div>
            </AdminDataState>);
}
