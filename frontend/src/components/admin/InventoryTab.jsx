import React from 'react';
import { Trash2 } from 'lucide-react';
import AdminDataState from './AdminDataState';
import { webpSrc } from '../../utils/imageFallback';
import AdminPagination from './AdminPagination';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { statusText, categoryText } from './adminI18n';

export default function InventoryTab({ status, errors, setInventoryCategoryFilter, inventoryCategoryFilter, inventoryStatusFilter, setInventoryStatusFilter, filteredInventory, restockAmounts, restockSizes, handleRestockSizeChange, handleRestockInputChange, handleRestockSubmit, saving, isDemo, handleDeleteProduct, pagination, onPageChange }) {
  const { t } = useLanguage();
  return (<AdminDataState resources={["inventory"]} status={status} errors={errors}>
            <div className="space-y-6 animate-fade-in">
              
              {/* Category Filter Pills & Status Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-matcha-border shadow-sm">
                
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {['ALL', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setInventoryCategoryFilter(cat)}
                      className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                        inventoryCategoryFilter === cat
                          ? 'bg-matcha-primary text-white shadow-xs'
                          : 'bg-matcha-bg text-matcha-muted hover:text-matcha-text'
                      }`}
                    >
                      {cat === 'ALL' ? t('admin.inventory.allCategories') : categoryText(t, cat)}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-matcha-muted">{t('admin.inventory.stockLabel')}</span>
                  <select
                    value={inventoryStatusFilter}
                    onChange={(e) => setInventoryStatusFilter(e.target.value)}
                    className="px-3 py-1 rounded-xl border border-matcha-border bg-matcha-bg text-xs font-mono font-bold text-matcha-text outline-none cursor-pointer"
                  >
                    <option value="ALL">{t('admin.inventory.allStatuses')}</option>
                    <option value="In Stock">{statusText(t, 'In Stock')}</option>
                    <option value="Low Stock">{statusText(t, 'Low Stock')}</option>
                    <option value="Out of Stock">{statusText(t, 'Out of Stock')}</option>
                  </select>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="rounded-2xl bg-white border border-matcha-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-matcha-bg border-b border-matcha-border text-matcha-muted">
                      <tr>
                        <th className="p-4 font-bold">{t('admin.inventory.colGarment')}</th>
                        <th className="p-4 font-bold">{t('admin.inventory.colCategory')}</th>
                        <th className="p-4 font-bold">{t('admin.inventory.colPrice')}</th>
                        <th className="p-4 font-bold">{t('admin.inventory.colStock')}</th>
                        <th className="p-4 font-bold">{t('admin.inventory.colStatus')}</th>
                        <th className="p-4 font-bold text-right">{t('admin.inventory.colActions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-matcha-border/40">
                      {filteredInventory.length === 0 && <tr><td colSpan={6} className="p-6 text-center">{t('admin.inventory.noRecords')}</td></tr>}
                      {filteredInventory.map(item => (
                        <tr key={item.id} className="hover:bg-matcha-bg/80 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={webpSrc(item.image)} data-original-src={item.image}
                                loading="lazy"
                                decoding="async"
                                alt={item.name}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/images/products/autumn/tops/shirts/color_1_brown.jpeg';
                                }}
                                className="w-10 h-10 rounded-xl object-cover border border-matcha-border"
                              />
                              <div>
                                <div className="font-bold text-matcha-text text-sm">{item.name}</div>
                                <div className="text-[10px] text-matcha-muted">{item.id} • {item.color} • {item.fit}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-matcha-text">{categoryText(t, item.category)}</td>
                          <td className="p-4 font-bold text-matcha-primary">${item.price}</td>
                          <td className="p-4 font-bold">{item.stock}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              item.status === 'In Stock'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'Low Stock'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {statusText(t, item.status)}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="flex items-center gap-1.5 bg-matcha-bg p-1 rounded-xl border border-matcha-border">
                                {/* A garment with size buckets has no total to
                                    add to — the units have to land in a size.
                                    One sold without sizes has a single ONE
                                    bucket and nothing to ask about. */}
                                {item.needsSizeChoice && (
                                  <select
                                    aria-label={t('admin.inventory.sizeToRestock', { name: item.name })}
                                    value={restockSizes?.[item.id] || ''}
                                    onChange={(e) => handleRestockSizeChange(item.id, e.target.value)}
                                    className="px-1.5 py-1 font-mono text-xs font-bold border border-matcha-border rounded-lg bg-white text-matcha-text outline-none focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary cursor-pointer"
                                  >
                                    <option value="">{t('admin.inventory.sizePlaceholder')}</option>
                                    {item.sizeStock.map(row => (
                                      <option key={row.size} value={row.size}>{row.size} ({row.stock})</option>
                                    ))}
                                  </select>
                                )}
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  aria-label={t('admin.inventory.stockAdjustment', { name: item.name })}
                                  value={restockAmounts[item.id] || ''}
                                  onChange={(e) => handleRestockInputChange(item.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRestockSubmit(item.id);
                                  }}
                                  placeholder="+/-"
                                  className="w-14 px-2 py-1 text-center font-mono text-xs font-bold border border-matcha-border rounded-lg bg-white text-matcha-text outline-none focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRestockSubmit(item.id)}
                                  disabled={saving || isDemo || !Number.isFinite(parseInt(restockAmounts[item.id], 10)) || parseInt(restockAmounts[item.id], 10) === 0 || (item.needsSizeChoice && !restockSizes?.[item.id])}
                                  className="px-3 py-1 rounded-lg border border-matcha-primary bg-white hover:bg-matcha-primary hover:text-white text-matcha-primary font-mono text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-40 disabled:border-matcha-border disabled:text-[#888888] disabled:cursor-not-allowed"
                                >
                                  {t('admin.common.add')}
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(item.id)}
                              disabled={saving || isDemo}
                                className="p-2 rounded-xl text-matcha-accent hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                                title={t('admin.inventory.deleteProduct')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredInventory.length === 0 && (
                  <div className="p-8 text-center font-mono text-xs text-matcha-muted">
                    {t('admin.inventory.noGarments')}
                  </div>
                )}

                <AdminPagination
                  page={pagination?.page}
                  totalPages={pagination?.totalPages}
                  total={pagination?.total}
                  onPageChange={onPageChange}
                  loading={status?.inventory === 'loading'}
                />
              </div>

            </div>
            </AdminDataState>);
}
