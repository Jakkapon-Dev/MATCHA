import React from 'react';
import AdminDataState from './AdminDataState';

export default function MembersTab({ status, errors, setMemberTierFilter, memberTierFilter, filteredMembers, handleToggleVIPTier, saving, isDemo }) {
  return (<AdminDataState resources={["members"]} status={status} errors={errors}>
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex items-center gap-2">
                {['ALL', 'VIP', 'Regular'].map(t => (
                  <button
                    key={t}
                    onClick={() => setMemberTierFilter(t)}
                    className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                      memberTierFilter === t
                        ? 'bg-matcha-primary text-white border-matcha-primary'
                        : 'bg-white text-matcha-muted border-matcha-border hover:border-matcha-primary'
                    }`}
                  >
                    {t === 'ALL' ? 'All Customers' : `${t} Tier`}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl bg-white border border-matcha-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-matcha-bg border-b border-matcha-border text-matcha-muted">
                      <tr>
                        <th className="p-4 font-bold">Member ID</th>
                        <th className="p-4 font-bold">Customer Name</th>
                        <th className="p-4 font-bold">Email</th>
                        <th className="p-4 font-bold">Total Spent</th>
                        <th className="p-4 font-bold">Tier Level</th>
                        <th className="p-4 font-bold text-right">VIP Tier Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-matcha-border/40">
                      {filteredMembers.length === 0 && <tr><td colSpan={6} className="p-6 text-center">No records match the current filters.</td></tr>}
                      {filteredMembers.map(mem => (
                        <tr key={mem.id} className="hover:bg-matcha-bg/80 transition-colors">
                          <td className="p-4 font-bold text-matcha-primary">{mem.id}</td>
                          <td className="p-4 font-bold text-matcha-text">{mem.name}</td>
                          <td className="p-4 text-matcha-muted">{mem.email}</td>
                          <td className="p-4 font-bold text-matcha-primary">${mem.totalSpent.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              mem.tier.includes('VIP')
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {mem.tier}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleToggleVIPTier(mem.id)}
                              disabled={saving || isDemo}
                              className="px-3 py-1 rounded-lg border border-matcha-border hover:border-matcha-primary text-xs font-mono font-bold text-matcha-text transition-all cursor-pointer"
                            >
                              {mem.tier.includes('VIP') ? 'Demote to Regular' : 'Promote to VIP 👑'}
                            </button>
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
