import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Search } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { categoryText } from './adminI18n';

// Stored values stay English; only the labels shown are translated.
const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];
const TYPES = [
  { id: 'percentage', labelKey: 'admin.couponForm.typePercentage' },
  { id: 'fixed_amount', labelKey: 'admin.couponForm.typeFixed' },
  { id: 'free_shipping', labelKey: 'admin.couponForm.typeFreeShipping' }
];

// <input type="datetime-local"> speaks local wall-clock time without a zone.
const toLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);
const numOrNull = (value) => (value === '' || value == null ? null : Number(value));

export const emptyCoupon = {
  code: '', description: '', type: 'percentage', value: '', minOrderAmount: '', maxDiscountAmount: '',
  startsAt: '', expiresAt: '', usageLimit: '', perUserLimit: '', active: true,
  applicableProducts: [], applicableCategories: []
};

export function couponToForm(coupon) {
  if (!coupon) return { ...emptyCoupon };
  const text = (v) => (v == null ? '' : String(v));
  return {
    code: coupon.code || '', description: coupon.description || '', type: coupon.type || 'percentage',
    value: coupon.type === 'free_shipping' ? '' : text(coupon.value), minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : '',
    maxDiscountAmount: text(coupon.maxDiscountAmount), startsAt: toLocalInput(coupon.startsAt), expiresAt: toLocalInput(coupon.expiresAt),
    usageLimit: text(coupon.usageLimit), perUserLimit: text(coupon.perUserLimit), active: coupon.active !== false,
    applicableProducts: [...(coupon.applicableProducts || [])], applicableCategories: [...(coupon.applicableCategories || [])]
  };
}

/* What the API receives. Amounts are the admin's to set; nothing here is a
   discount the checkout will trust — the server re-validates every field. */
export function formToPayload(form) {
  return {
    code: form.code.trim().toUpperCase(),
    description: form.description.trim(),
    type: form.type,
    value: form.type === 'free_shipping' ? 0 : Number(form.value),
    minOrderAmount: form.minOrderAmount === '' ? 0 : Number(form.minOrderAmount),
    maxDiscountAmount: form.type === 'percentage' ? numOrNull(form.maxDiscountAmount) : null,
    startsAt: fromLocalInput(form.startsAt),
    expiresAt: fromLocalInput(form.expiresAt),
    usageLimit: numOrNull(form.usageLimit),
    perUserLimit: numOrNull(form.perUserLimit),
    active: Boolean(form.active),
    applicableProducts: form.applicableProducts,
    applicableCategories: form.applicableCategories
  };
}

/* Returns translation keys (admin.couponForm.err*), resolved with t() when
   shown, so a message follows the language if it changes while visible. */
export function validateCouponForm(form) {
  const errors = {};
  const code = form.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) errors.code = 'admin.couponForm.errCode';
  const value = Number(form.value);
  if (form.type === 'percentage' && (!(value > 0) || value > 100)) errors.value = 'admin.couponForm.errPercentage';
  if (form.type === 'fixed_amount' && !(value > 0)) errors.value = 'admin.couponForm.errAmount';
  if (form.minOrderAmount !== '' && !(Number(form.minOrderAmount) >= 0)) errors.minOrderAmount = 'admin.couponForm.errMinOrder';
  if (form.maxDiscountAmount !== '' && !(Number(form.maxDiscountAmount) > 0)) errors.maxDiscountAmount = 'admin.couponForm.errMaxDiscount';
  for (const key of ['usageLimit', 'perUserLimit']) {
    if (form[key] !== '' && !(Number.isInteger(Number(form[key])) && Number(form[key]) >= 1)) errors[key] = 'admin.couponForm.errWholeNumber';
  }
  if (form.startsAt && form.expiresAt && new Date(form.expiresAt) <= new Date(form.startsAt)) errors.expiresAt = 'admin.couponForm.errAfterStart';
  return errors;
}

const inputClass = (error) => `w-full h-10 px-3 bg-white border ${error ? 'border-matcha-accent' : 'border-matcha-border'} rounded-xl text-sm text-matcha-text outline-none focus:ring-2 focus:ring-matcha-primary/30 disabled:bg-matcha-bg disabled:text-matcha-muted`;

function Field({ label, hint, error, children, className = '' }) {
  const { t } = useLanguage();
  return (
    <label className={`block space-y-1.5 min-w-0 ${className}`}>
      <span className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[11px] font-mono font-bold uppercase tracking-[0.1em] text-matcha-text">
        <span>{label}</span>
        {hint && <span className="normal-case tracking-normal font-normal text-matcha-muted">{hint}</span>}
      </span>
      {children}
      {error && <span role="alert" className="flex items-center gap-1 text-[11px] font-mono text-matcha-accent"><AlertCircle size={12} className="shrink-0" />{t(error)}</span>}
    </label>
  );
}

/* Picks garments by searching the admin product list; stores their ids. */
function ProductPicker({ value, onChange, disabled }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [names, setNames] = useState({});
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) { setResults([]); return undefined; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api.getAdminProducts({ search: term, page: 1, limit: 8 }, { signal: controller.signal })
        .then(res => setResults(Array.isArray(res?.data) ? res.data : []))
        .catch(() => setResults([]));
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  const add = (product) => {
    const id = product.id || product.sku;
    if (!id || value.includes(id)) return;
    setNames(n => ({ ...n, [id]: product.name }));
    onChange([...value, id]);
    setQuery('');
    setResults([]);
  };
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 inset-y-0 my-auto text-matcha-muted" aria-hidden="true" />
        <input type="text" value={query} disabled={disabled} onChange={e => setQuery(e.target.value)} placeholder={t('admin.couponForm.productSearchPlaceholder')} aria-label={t('admin.couponForm.productSearchAria')} className={`${inputClass()} pl-9`} />
        {results.length > 0 && (
          <ul role="listbox" className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-matcha-border rounded-xl shadow-xl py-1">
            {results.map(p => (
              <li key={p._id || p.id}>
                <button type="button" onClick={() => add(p)} className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-matcha-bg flex justify-between gap-3">
                  <span className="truncate text-matcha-text">{p.name}</span><span className="shrink-0 text-matcha-muted">{p.id || p.sku}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(id => (
            <span key={id} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-matcha-bg border border-matcha-border text-[11px] font-mono">
              <span className="max-w-48 truncate">{names[id] ? `${names[id]} · ${id}` : id}</span>
              <button type="button" disabled={disabled} aria-label={t('admin.couponForm.removeProductAria', { id })} onClick={() => onChange(value.filter(v => v !== id))} className="p-0.5 rounded hover:bg-white cursor-pointer"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CouponFormModal({ isOpen, coupon, onClose, onSave, saving, saveError, readOnly = false }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => couponToForm(coupon));
  const [errors, setErrors] = useState({});
  const codeRef = useRef(null);
  const isEdit = Boolean(coupon?.id);
  const codeLocked = isEdit && (coupon.usedCount || 0) > 0;

  useEffect(() => {
    if (!isOpen) return;
    setForm(couponToForm(coupon));
    setErrors({});
    setTimeout(() => codeRef.current?.focus(), 0);
  }, [isOpen, coupon]);
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  const set = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };
  const submit = async (e) => {
    e.preventDefault();
    const found = validateCouponForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    await onSave(formToPayload(form), coupon);
  };
  const title = isEdit ? t('admin.couponForm.titleEdit', { code: coupon.code }) : coupon?.builtIn ? t('admin.couponForm.titleCustomise', { code: coupon.code }) : t('admin.couponForm.titleAdd');

  /* Portalled to <body>: the admin content area animates with a transform,
     which would otherwise become the containing block of this fixed overlay
     and leave it under the sticky header on small screens. */
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs">
      <div role="dialog" aria-modal="true" aria-labelledby="coupon-form-title" className="bg-matcha-bg w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-matcha-border shadow-2xl">
        <div className="sticky top-0 z-10 bg-matcha-bg/95 backdrop-blur-md px-5 sm:px-6 py-4 border-b border-matcha-border flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-mono text-matcha-muted">{t('admin.couponForm.eyebrow')}</p>
            <h2 id="coupon-form-title" className="text-lg font-semibold tracking-tight text-matcha-text truncate">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t('admin.common.close')} className="p-2 rounded-xl text-matcha-muted hover:text-matcha-text hover:bg-matcha-border/40 cursor-pointer"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 sm:p-6 space-y-6" noValidate>
          {coupon?.builtIn && !isEdit && (
            <p className="text-xs font-mono text-matcha-muted p-3 rounded-xl bg-white border border-matcha-border">
              {t('admin.couponForm.builtInNote', { code: coupon.code })}
            </p>
          )}
          <fieldset disabled={readOnly || saving} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('admin.couponForm.code')} hint={codeLocked ? t('admin.couponForm.codeLocked') : t('admin.couponForm.codeHint')} error={errors.code}>
                <input ref={codeRef} value={form.code} disabled={codeLocked || Boolean(coupon?.builtIn && !isEdit)} onChange={e => set('code', e.target.value.toUpperCase())} className={`${inputClass(errors.code)} font-mono uppercase`} placeholder="MATCHA10" />
              </Field>
              <Field label={t('admin.couponForm.description')} hint={t('admin.couponForm.descriptionHint')}>
                <input value={form.description} maxLength={200} onChange={e => set('description', e.target.value)} className={inputClass()} placeholder={t('admin.couponForm.descriptionPlaceholder')} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={t('admin.couponForm.discountType')}>
                <select value={form.type} onChange={e => set('type', e.target.value)} className={inputClass()}>
                  {TYPES.map(type => <option key={type.id} value={type.id}>{t(type.labelKey)}</option>)}
                </select>
              </Field>
              <Field label={t('admin.couponForm.discountValue')} hint={form.type === 'percentage' ? '%' : form.type === 'fixed_amount' ? 'USD' : '—'} error={errors.value}>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.type === 'free_shipping' ? '' : form.value} disabled={form.type === 'free_shipping'} onChange={e => set('value', e.target.value)} className={inputClass(errors.value)} placeholder={form.type === 'free_shipping' ? t('admin.couponForm.shippingWaived') : form.type === 'percentage' ? '10' : '20.00'} />
              </Field>
              <Field label={t('admin.couponForm.maxDiscount')} hint={t('admin.couponForm.maxDiscountHint')} error={errors.maxDiscountAmount}>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.type === 'percentage' ? form.maxDiscountAmount : ''} disabled={form.type !== 'percentage'} onChange={e => set('maxDiscountAmount', e.target.value)} className={inputClass(errors.maxDiscountAmount)} placeholder={form.type === 'percentage' ? t('admin.couponForm.noCap') : t('admin.couponForm.percentageOnly')} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={t('admin.couponForm.minOrder')} hint="USD" error={errors.minOrderAmount}>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.minOrderAmount} onChange={e => set('minOrderAmount', e.target.value)} className={inputClass(errors.minOrderAmount)} placeholder="0.00" />
              </Field>
              <Field label={t('admin.couponForm.usageLimit')} hint={t('admin.couponForm.usageLimitHint')} error={errors.usageLimit}>
                <input type="number" inputMode="numeric" min="1" step="1" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)} className={inputClass(errors.usageLimit)} placeholder={t('admin.couponForm.unlimited')} />
              </Field>
              <Field label={t('admin.couponForm.perUserLimit')} error={errors.perUserLimit}>
                <input type="number" inputMode="numeric" min="1" step="1" value={form.perUserLimit} onChange={e => set('perUserLimit', e.target.value)} className={inputClass(errors.perUserLimit)} placeholder={t('admin.couponForm.unlimited')} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('admin.couponForm.startDate')} hint={t('admin.common.optional')}>
                <input type="datetime-local" value={form.startsAt} onChange={e => set('startsAt', e.target.value)} className={inputClass()} />
              </Field>
              <Field label={t('admin.couponForm.expiryDate')} hint={t('admin.common.optional')} error={errors.expiresAt}>
                <input type="datetime-local" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} className={inputClass(errors.expiresAt)} />
              </Field>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.1em] text-matcha-text">{t('admin.couponForm.categories')} <span className="normal-case tracking-normal font-normal text-matcha-muted">{t('admin.couponForm.categoriesHint')}</span></p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => {
                  const on = form.applicableCategories.includes(cat);
                  return (
                    <label key={cat} className={`inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-xs font-mono cursor-pointer ${on ? 'bg-matcha-primary text-white border-matcha-primary' : 'bg-white border-matcha-border text-matcha-text'}`}>
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => set('applicableCategories', on ? form.applicableCategories.filter(c => c !== cat) : [...form.applicableCategories, cat])} />
                      {categoryText(t, cat)}
                    </label>
                  );
                })}
              </div>
            </div>

            <Field label={t('admin.couponForm.products')} hint={t('admin.common.optional')}>
              <ProductPicker value={form.applicableProducts} onChange={list => set('applicableProducts', list)} disabled={readOnly || saving} />
            </Field>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-matcha-border cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-matcha-primary" />
              <span className="text-sm text-matcha-text">{t('admin.common.active')} <span className="text-xs text-matcha-muted font-mono">{t('admin.couponForm.activeHint')}</span></span>
            </label>
          </fieldset>

          {saveError && <p role="alert" className="text-sm text-red-800">{saveError}</p>}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-matcha-border">
            <button type="button" onClick={onClose} className="h-10 px-5 rounded-xl border border-matcha-border text-xs font-mono font-bold text-matcha-muted hover:text-matcha-text hover:bg-white cursor-pointer whitespace-nowrap">{t('admin.common.cancel')}</button>
            <button type="submit" disabled={saving || readOnly} className="h-10 px-5 rounded-xl bg-matcha-primary hover:bg-matcha-primary-dark text-white text-xs font-mono font-bold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {saving ? t('admin.common.saving') : isEdit ? t('admin.couponForm.saveChanges') : t('admin.couponForm.create')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
