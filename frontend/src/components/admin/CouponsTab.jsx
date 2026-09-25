import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Power, TicketPercent } from 'lucide-react';
import { api, apiErrorText } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext.jsx';
import CouponFormModal from './CouponFormModal';
import { categoryText } from './adminI18n';

// Status ids are what the API filters on; only the labels are translated.
const STATUSES = [
  { id: 'all', labelKey: 'admin.common.all' },
  { id: 'active', labelKey: 'admin.coupons.statusActive' },
  { id: 'scheduled', labelKey: 'admin.coupons.statusScheduled' },
  { id: 'expired', labelKey: 'admin.coupons.statusExpired' },
  { id: 'exhausted', labelKey: 'admin.coupons.statusExhausted' },
  { id: 'disabled', labelKey: 'admin.coupons.statusDisabled' }
];
const STATUS_TONE = {
  active: 'bg-green-50 text-green-800 border-green-200',
  scheduled: 'bg-blue-50 text-blue-800 border-blue-200',
  expired: 'bg-matcha-bg text-matcha-muted border-matcha-border',
  exhausted: 'bg-amber-50 text-amber-800 border-amber-200',
  disabled: 'bg-red-50 text-red-800 border-red-200'
};
const STATUS_LABEL_KEY = Object.fromEntries(STATUSES.map(s => [s.id, s.labelKey]));

const formatDate = (value, lang) => (value ? new Date(value).toLocaleString(lang === 'th' ? 'th-TH' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const money = (n) => `$${Number(n).toFixed(2)}`;

/* Built from type/value on the client (same wording as the server's English
   `label`) so the discount reads in the admin's language. */
function discountLabel(c, t) {
  if (c.type === 'percentage') return t('admin.coupons.labelPercentage', { value: c.value });
  if (c.type === 'fixed_amount') return t('admin.coupons.labelFixed', { value: Number(c.value).toFixed(2) });
  if (c.type === 'free_shipping') return t('admin.coupons.labelFreeShipping');
  return c.label;
}

function discountDetail(c, t) {
  const parts = [];
  if (c.type === 'percentage' && c.maxDiscountAmount != null) parts.push(t('admin.coupons.detailMax', { amount: money(c.maxDiscountAmount) }));
  if (c.minOrderAmount > 0) parts.push(t('admin.coupons.detailMin', { amount: money(c.minOrderAmount) }));
  const count = c.applicableProducts?.length || 0;
  const scope = [...(c.applicableCategories || []).map(cat => categoryText(t, cat)), ...(count ? [t(count > 1 ? 'admin.coupons.productMany' : 'admin.coupons.productOne', { count })] : [])];
  if (scope.length) parts.push(scope.join(', '));
  return parts.join(' · ');
}

/* Coupons are managed here and priced only by the server. A coupon is never
   deleted from this screen: orders keep a snapshot of the coupon they used,
   and disabling keeps that history readable while stopping new use. */
export default function CouponsTab({ search = '', isDemo = false }) {
  const { t, lang } = useLanguage();
  const [status, setStatus] = useState('all');
  const [coupons, setCoupons] = useState([]);
  const [state, setState] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    setLoadError('');
    api.getAdminCoupons({ search, status, signal: controller.signal })
      .then(res => { setCoupons(Array.isArray(res?.data) ? res.data : []); setState('ready'); })
      .catch(err => { if (!controller.signal.aborted) { setLoadError(apiErrorText(err, t)); setState('error'); } });
    return () => controller.abort();
  }, [search, status, reloadKey, t]);

  const reload = useCallback(() => setReloadKey(k => k + 1), []);
  const openForm = (coupon) => { setSaveError(''); setNotice(null); setEditing(coupon || {}); };
  const closeForm = useCallback(() => setEditing(null), []);

  const save = async (payload, original) => {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = original?.id ? await api.updateCoupon(original.id, payload) : await api.createCoupon(payload);
      if (!res?.success) throw new Error(res?.message || t('errors.saveFailed'));
      setEditing(null);
      setNotice({ error: false, text: t('admin.coupons.noticeSaved', { code: res.data.code }) });
      reload();
    } catch (err) {
      setSaveError(apiErrorText(err, t));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (coupon) => {
    if (saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await api.setCouponActive(coupon.id, !coupon.active);
      if (!res?.success) throw new Error(res?.message || t('errors.saveFailed'));
      setNotice({ error: false, text: t(res.data.active ? 'admin.coupons.noticeEnabled' : 'admin.coupons.noticeDisabled', { code: coupon.code }) });
      reload();
    } catch (err) {
      setNotice({ error: true, text: apiErrorText(err, t) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div role="group" aria-label={t('admin.coupons.filterByStatus')} className="flex gap-1.5 overflow-x-auto [scrollbar-width:thin] -mx-1 px-1 pb-1">
          {STATUSES.map(s => (
            <button
              key={s.id}
              type="button"
              aria-pressed={status === s.id}
              onClick={() => setStatus(s.id)}
              className={`shrink-0 whitespace-nowrap h-9 px-3.5 rounded-xl font-mono text-xs font-bold border transition-colors cursor-pointer ${status === s.id ? 'bg-matcha-primary text-white border-matcha-primary' : 'bg-white text-matcha-muted border-matcha-border hover:border-matcha-primary'}`}
            >
              {t(s.labelKey)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => openForm(null)}
          disabled={isDemo}
          className="shrink-0 whitespace-nowrap h-9 px-4 rounded-xl bg-matcha-primary hover:bg-matcha-primary-dark text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus size={14} /> {t('admin.coupons.addCoupon')}
        </button>
      </div>

      {notice && <p role={notice.error ? 'alert' : 'status'} className={`text-xs font-mono ${notice.error ? 'text-red-800' : 'text-green-900'}`}>{notice.text}</p>}

      {state === 'error' ? (
        <div role="alert" className="p-6 bg-white rounded-2xl border border-red-300 text-red-900 text-sm">
          <p className="font-bold">{t('errors.loadFailed')}</p>
          <p>{loadError}</p>
          <button type="button" onClick={reload} className="mt-3 underline font-bold cursor-pointer">{t('common.retry')}</button>
        </div>
      ) : (
        <section aria-busy={state === 'loading'} className="rounded-2xl bg-white border border-matcha-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left font-mono text-xs">
              <thead className="bg-matcha-bg/60 border-b border-matcha-border text-[10px] uppercase tracking-[0.12em] text-matcha-muted">
                <tr>
                  <th className="p-4 font-bold whitespace-nowrap">{t('admin.coupons.colCode')}</th>
                  <th className="p-4 font-bold whitespace-nowrap">{t('admin.coupons.colStatus')}</th>
                  <th className="p-4 font-bold whitespace-nowrap">{t('admin.coupons.colDiscount')}</th>
                  <th className="p-4 font-bold whitespace-nowrap">{t('admin.coupons.colUsage')}</th>
                  <th className="p-4 font-bold whitespace-nowrap">{t('admin.coupons.colStarts')}</th>
                  <th className="p-4 font-bold whitespace-nowrap">{t('admin.coupons.colExpires')}</th>
                  <th className="p-4 font-bold whitespace-nowrap text-right">{t('admin.coupons.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-matcha-border/60">
                {state === 'loading' && coupons.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-matcha-muted" role="status">{t('admin.loadingData')}</td></tr>}
                {state === 'ready' && coupons.length === 0 && (
                  <tr><td colSpan={7} className="p-10 text-center text-matcha-muted">
                    <TicketPercent size={22} className="mx-auto mb-2 text-matcha-border" aria-hidden="true" />
                    {search || status !== 'all' ? t('admin.coupons.emptyFiltered') : t('admin.coupons.empty')}
                  </td></tr>
                )}
                {coupons.map(c => (
                  <tr key={c.id || `builtin-${c.code}`} className="hover:bg-matcha-bg/50 align-top">
                    <td className="p-4">
                      <div className="font-bold text-matcha-primary text-sm">{c.code}</div>
                      <div className="text-[11px] text-matcha-muted mt-0.5 max-w-56 truncate">{c.builtIn ? t('admin.coupons.builtInCode') : c.description || '—'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-md border text-[10px] font-bold ${STATUS_TONE[c.status] || STATUS_TONE.expired}`}>{STATUS_LABEL_KEY[c.status] ? t(STATUS_LABEL_KEY[c.status]) : c.status}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-matcha-text">{discountLabel(c, t)}</div>
                      {discountDetail(c, t) && <div className="text-[11px] text-matcha-muted mt-0.5 max-w-60">{discountDetail(c, t)}</div>}
                    </td>
                    <td className="p-4 tabular-nums">
                      <div className="text-matcha-text">{c.builtIn ? '—' : `${c.usedCount || 0} / ${c.usageLimit ?? '∞'}`}</div>
                      {c.perUserLimit != null && <div className="text-[11px] text-matcha-muted mt-0.5">{t('admin.coupons.perShopper', { count: c.perUserLimit })}</div>}
                    </td>
                    <td className="p-4 text-matcha-muted whitespace-nowrap">{formatDate(c.startsAt, lang)}</td>
                    <td className="p-4 text-matcha-muted whitespace-nowrap">{formatDate(c.expiresAt, lang)}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => openForm(c)} disabled={isDemo} aria-label={t(c.builtIn ? 'admin.coupons.customiseAria' : 'admin.coupons.editAria', { code: c.code })} className="h-8 px-2.5 whitespace-nowrap rounded-lg border border-matcha-border hover:border-matcha-primary text-matcha-text flex items-center gap-1 disabled:opacity-50 cursor-pointer">
                          <Pencil size={12} /> {c.builtIn ? t('admin.coupons.customise') : t('admin.common.edit')}
                        </button>
                        {!c.builtIn && (
                          <button type="button" onClick={() => toggle(c)} disabled={isDemo || saving} aria-label={t(c.active ? 'admin.coupons.disableAria' : 'admin.coupons.enableAria', { code: c.code })} className={`h-8 px-2.5 whitespace-nowrap rounded-lg border flex items-center gap-1 disabled:opacity-50 cursor-pointer ${c.active ? 'border-red-200 text-red-800 hover:bg-red-50' : 'border-green-200 text-green-800 hover:bg-green-50'}`}>
                            <Power size={12} /> {c.active ? t('admin.common.disable') : t('admin.common.enable')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <CouponFormModal
        isOpen={Boolean(editing)}
        coupon={editing?.code ? editing : null}
        onClose={closeForm}
        onSave={save}
        saving={saving}
        saveError={saveError}
        readOnly={isDemo}
      />
    </div>
  );
}
