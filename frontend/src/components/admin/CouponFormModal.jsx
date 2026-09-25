import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Search } from 'lucide-react';
import { api } from '../../services/api';

const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];
const TYPES = [
  { id: 'percentage', label: 'Percentage off' },
  { id: 'fixed_amount', label: 'Fixed amount off' },
  { id: 'free_shipping', label: 'Free shipping' }
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

export function validateCouponForm(form) {
  const errors = {};
  const code = form.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) errors.code = 'Use 3–30 letters, numbers, - or _';
  const value = Number(form.value);
  if (form.type === 'percentage' && (!(value > 0) || value > 100)) errors.value = 'Enter a percentage from 1 to 100';
  if (form.type === 'fixed_amount' && !(value > 0)) errors.value = 'Enter an amount greater than 0';
  if (form.minOrderAmount !== '' && !(Number(form.minOrderAmount) >= 0)) errors.minOrderAmount = 'Must be 0 or more';
  if (form.maxDiscountAmount !== '' && !(Number(form.maxDiscountAmount) > 0)) errors.maxDiscountAmount = 'Must be greater than 0';
  for (const key of ['usageLimit', 'perUserLimit']) {
    if (form[key] !== '' && !(Number.isInteger(Number(form[key])) && Number(form[key]) >= 1)) errors[key] = 'Whole number, 1 or more';
  }
  if (form.startsAt && form.expiresAt && new Date(form.expiresAt) <= new Date(form.startsAt)) errors.expiresAt = 'Must be after the start date';
  return errors;
}

const inputClass = (error) => `w-full h-10 px-3 bg-white border ${error ? 'border-matcha-accent' : 'border-matcha-border'} rounded-xl text-sm text-matcha-text outline-none focus:ring-2 focus:ring-matcha-primary/30 disabled:bg-matcha-bg disabled:text-matcha-muted`;

function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={`block space-y-1.5 min-w-0 ${className}`}>
      <span className="flex items-baseline justify-between gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.1em] text-matcha-text">
        <span>{label}</span>
        {hint && <span className="normal-case tracking-normal font-normal text-matcha-muted">{hint}</span>}
      </span>
      {children}
      {error && <span role="alert" className="flex items-center gap-1 text-[11px] font-mono text-matcha-accent"><AlertCircle size={12} />{error}</span>}
    </label>
  );
}

/* Picks garments by searching the admin product list; stores their ids. */
function ProductPicker({ value, onChange, disabled }) {
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
        <input type="text" value={query} disabled={disabled} onChange={e => setQuery(e.target.value)} placeholder="Search garments by name or SKU" aria-label="Search garments to restrict this coupon" className={`${inputClass()} pl-9`} />
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
              <button type="button" disabled={disabled} aria-label={`Remove ${id}`} onClick={() => onChange(value.filter(v => v !== id))} className="p-0.5 rounded hover:bg-white cursor-pointer"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CouponFormModal({ isOpen, coupon, onClose, onSave, saving, saveError, readOnly = false }) {
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
  const title = isEdit ? `Edit ${coupon.code}` : coupon?.builtIn ? `Customise ${coupon.code}` : 'Add Coupon';

  /* Portalled to <body>: the admin content area animates with a transform,
     which would otherwise become the containing block of this fixed overlay
     and leave it under the sticky header on small screens. */
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs">
      <div role="dialog" aria-modal="true" aria-labelledby="coupon-form-title" className="bg-matcha-bg w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-matcha-border shadow-2xl">
        <div className="sticky top-0 z-10 bg-matcha-bg/95 backdrop-blur-md px-5 sm:px-6 py-4 border-b border-matcha-border flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-mono text-matcha-muted">Coupons</p>
            <h2 id="coupon-form-title" className="text-lg font-semibold tracking-tight text-matcha-text truncate">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-xl text-matcha-muted hover:text-matcha-text hover:bg-matcha-border/40 cursor-pointer"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 sm:p-6 space-y-6" noValidate>
          {coupon?.builtIn && !isEdit && (
            <p className="text-xs font-mono text-matcha-muted p-3 rounded-xl bg-white border border-matcha-border">
              {coupon.code} is a built-in code. Saving creates a managed copy that replaces it, so it can be edited or disabled from here.
            </p>
          )}
          <fieldset disabled={readOnly || saving} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Coupon Code" hint={codeLocked ? 'Locked — already used' : '3–30 chars'} error={errors.code}>
                <input ref={codeRef} value={form.code} disabled={codeLocked || Boolean(coupon?.builtIn && !isEdit)} onChange={e => set('code', e.target.value.toUpperCase())} className={`${inputClass(errors.code)} font-mono uppercase`} placeholder="MATCHA10" />
              </Field>
              <Field label="Description" hint="Internal note">
                <input value={form.description} maxLength={200} onChange={e => set('description', e.target.value)} className={inputClass()} placeholder="Autumn launch" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Discount Type">
                <select value={form.type} onChange={e => set('type', e.target.value)} className={inputClass()}>
                  {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Discount Value" hint={form.type === 'percentage' ? '%' : form.type === 'fixed_amount' ? 'USD' : '—'} error={errors.value}>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.type === 'free_shipping' ? '' : form.value} disabled={form.type === 'free_shipping'} onChange={e => set('value', e.target.value)} className={inputClass(errors.value)} placeholder={form.type === 'free_shipping' ? 'Shipping waived' : form.type === 'percentage' ? '10' : '20.00'} />
              </Field>
              <Field label="Maximum Discount" hint="USD, optional" error={errors.maxDiscountAmount}>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.type === 'percentage' ? form.maxDiscountAmount : ''} disabled={form.type !== 'percentage'} onChange={e => set('maxDiscountAmount', e.target.value)} className={inputClass(errors.maxDiscountAmount)} placeholder={form.type === 'percentage' ? 'No cap' : 'Percentage only'} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Minimum Order" hint="USD" error={errors.minOrderAmount}>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.minOrderAmount} onChange={e => set('minOrderAmount', e.target.value)} className={inputClass(errors.minOrderAmount)} placeholder="0.00" />
              </Field>
              <Field label="Usage Limit" hint="All shoppers" error={errors.usageLimit}>
                <input type="number" inputMode="numeric" min="1" step="1" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)} className={inputClass(errors.usageLimit)} placeholder="Unlimited" />
              </Field>
              <Field label="Per User Limit" error={errors.perUserLimit}>
                <input type="number" inputMode="numeric" min="1" step="1" value={form.perUserLimit} onChange={e => set('perUserLimit', e.target.value)} className={inputClass(errors.perUserLimit)} placeholder="Unlimited" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Start Date" hint="Optional">
                <input type="datetime-local" value={form.startsAt} onChange={e => set('startsAt', e.target.value)} className={inputClass()} />
              </Field>
              <Field label="Expiry Date" hint="Optional" error={errors.expiresAt}>
                <input type="datetime-local" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} className={inputClass(errors.expiresAt)} />
              </Field>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.1em] text-matcha-text">Applicable Categories <span className="normal-case tracking-normal font-normal text-matcha-muted">— none selected means every category</span></p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => {
                  const on = form.applicableCategories.includes(cat);
                  return (
                    <label key={cat} className={`inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-xs font-mono cursor-pointer ${on ? 'bg-matcha-primary text-white border-matcha-primary' : 'bg-white border-matcha-border text-matcha-text'}`}>
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => set('applicableCategories', on ? form.applicableCategories.filter(c => c !== cat) : [...form.applicableCategories, cat])} />
                      {cat}
                    </label>
                  );
                })}
              </div>
            </div>

            <Field label="Applicable Products" hint="Optional">
              <ProductPicker value={form.applicableProducts} onChange={list => set('applicableProducts', list)} disabled={readOnly || saving} />
            </Field>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-matcha-border cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-matcha-primary" />
              <span className="text-sm text-matcha-text">Active <span className="text-xs text-matcha-muted font-mono">— shoppers can use it within its dates and limits</span></span>
            </label>
          </fieldset>

          {saveError && <p role="alert" className="text-sm text-red-800">{saveError}</p>}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-matcha-border">
            <button type="button" onClick={onClose} className="h-10 px-5 rounded-xl border border-matcha-border text-xs font-mono font-bold text-matcha-muted hover:text-matcha-text hover:bg-white cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving || readOnly} className="h-10 px-5 rounded-xl bg-matcha-primary hover:bg-matcha-primary-dark text-white text-xs font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
