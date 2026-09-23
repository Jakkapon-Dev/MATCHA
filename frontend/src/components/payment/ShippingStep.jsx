import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { fetchAddressBook, readAddressBook, rememberAddress, formatAddressArea } from '../../features/account/addressBook';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Truck, CheckCircle2, PlusCircle, ArrowLeft, ArrowRight, ShieldCheck, Building2, Home } from 'lucide-react';


export default function ShippingStep({
  formData,
  onFormChange,
  shippingOptions = [],
  selectedShipping,
  onSelectShipping,
  onNext,
  onBackToCart
}) {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  /* Saved addresses belong to an account. Loaded from the API via fetchAddressBook,
     falling back to synchronous readAddressBook for initial frame. */
  const [savedAddresses, setSavedAddresses] = useState(() => readAddressBook(currentUser));
  const hasSaved = savedAddresses.length > 0;

  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (currentUser) {
      fetchAddressBook(currentUser).then((list) => {
        if (!cancelled && Array.isArray(list)) {
          setSavedAddresses(list);
        }
      }).catch((err) => {
        console.warn('Could not load shipping addresses:', err);
      });
    } else {
      setSavedAddresses([]);
    }
    return () => { cancelled = true; };
  }, [currentUser]);

  /* The first address arrives already marked as chosen, but nothing had ever
     copied it into the form, so the page opened claiming a selection while
     every field below sat empty. The seed runs once, and only into blank
     fields, so it can never overwrite something the visitor typed. */
  useEffect(() => {
    if (seeded.current) return;

    /* Signed in with nothing saved: the account still knows who they are, so
       the name and email come across and only the address is left to type. */
    if (!hasSaved) {
      if (currentUser && !formData?.firstName && !formData?.email) {
        seeded.current = true;
        const [first, ...rest] = String(currentUser.name || '').trim().split(/\s+/);
        onFormChange({
          ...formData,
          firstName: first || '',
          lastName: rest.join(' '),
          email: currentUser.email || '',
        });
      }
      return;
    }

    seeded.current = true;
    const preset = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
    if (!preset) return;
    if (formData?.firstName || formData?.address) return;
    setSelectedPreset(preset.id);
    onFormChange({
      ...formData,
      firstName: preset.firstName,
      lastName: preset.lastName,
      email: currentUser?.email || preset.email || formData?.email || '',
      phone: preset.phone,
      address: preset.addressLine1 || preset.address,
      addressLine2: preset.addressLine2 || '',
      subdistrict: preset.subdistrict || '',
      district: preset.district || '',
      city: formatAddressArea([preset.subdistrict, preset.district, preset.province]) || preset.city || '',
      state: preset.province || preset.state || '',
      province: preset.province || '',
      zipCode: preset.postalCode || preset.zipCode,
      country: preset.country || 'Thailand',
    });
  }, [hasSaved, savedAddresses, currentUser, formData, onFormChange]);

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    setIsCustomAddress(false);
    onFormChange({
      ...formData,
      firstName: preset.firstName,
      lastName: preset.lastName,
      email: currentUser?.email || preset.email || formData?.email || '',
      phone: preset.phone,
      address: preset.addressLine1 || preset.address,
      addressLine2: preset.addressLine2 || '',
      subdistrict: preset.subdistrict || '',
      district: preset.district || '',
      city: formatAddressArea([preset.subdistrict, preset.district, preset.province]) || preset.city || '',
      state: preset.province || preset.state || '',
      province: preset.province || '',
      zipCode: preset.postalCode || preset.zipCode,
      country: preset.country || 'Thailand'
    });
  };

  const handleCustomToggle = () => {
    setIsCustomAddress(true);
    setSelectedPreset(null);
  };

  const handleChange = (e) => {
    onFormChange({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /* Moving on keeps the address for next time, but only for someone signed in
     — there is no account to keep it against otherwise, and the book must not
     become a store of strangers' addresses on a shared machine. */
  const handleNext = () => {
    if (currentUser) rememberAddress(currentUser, formData);
    if (onNext) onNext();
  };

  /* The same rules the address book has always enforced. Checkout only asked
     that these two boxes were not empty, so "abcdefg" and "!!!" reached the
     order API and were stored as the details the courier would have used. The
     phone is judged on its digits, because 081-000-0000 and 0810000000 are the
     same number and both are worth accepting. */
  const phoneDigits = String(formData.phone ?? '').replace(/[\s()-]/g, '').trim();
  const phoneMalformed = Boolean(phoneDigits) && !/^0[0-9]{8,9}$/.test(phoneDigits);
  const postalMalformed = Boolean(formData.zipCode?.trim()) && !/^[0-9]{5}$/.test(formData.zipCode.trim());

  const isFormValid = Boolean(
    formData.firstName?.trim() &&
    formData.lastName?.trim() &&
    formData.email?.trim() &&
    formData.phone?.trim() &&
    formData.address?.trim() &&
    formData.city?.trim() &&
    formData.zipCode?.trim()
  ) && !phoneMalformed && !postalMalformed;

  return (
    <div className="space-y-8">
      {/* Address Card */}
      <div className="bg-white border border-matcha-border p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-matcha-border gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-[#0A0A0A]">
              {t('checkout.addressTitle')}
            </h2>
            <p className="text-xs text-matcha-muted font-mono mt-0.5">
              {t('checkout.addressNote')}
            </p>
          </div>
          {hasSaved && (
            <span className="text-xs font-mono text-matcha-muted flex items-center gap-1.5 self-start sm:self-auto">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>{t('checkout.savedAddresses')}</span>
            </span>
          )}
        </div>

        {/* Preset Address Selection */}
        {hasSaved && (
        <div className="mb-6">
          <div role="radiogroup" aria-label={t('checkout.savedAddresses')} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {savedAddresses.map((preset) => {
              const isSelected = selectedPreset === preset.id && !isCustomAddress;
              return (
                <div
                  key={preset.id}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => handleSelectPreset(preset)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectPreset(preset);
                    }
                  }}
                  className={`p-4 border transition-all cursor-pointer flex flex-col justify-between text-left outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary ${
                    isSelected
                      ? 'border-matcha-primary bg-matcha-bg'
                      : 'border-matcha-border bg-white hover:border-matcha-secondary/60 hover:bg-matcha-bg'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {((preset.label || '').toLowerCase().includes('home') || preset.type === 'home' || preset.label === 'บ้าน') ? (
                        <Home size={13} className="text-matcha-primary" />
                      ) : (
                        <Building2 size={13} className="text-matcha-primary" />
                      )}
                      <span className="font-bold text-xs text-[#0A0A0A]">{preset.label || preset.title}</span>
                      {preset.isDefault && (
                        <span className="px-1.5 py-0.2 bg-matcha-primary text-white text-[9px] font-mono font-bold uppercase shrink-0">
                          {t('account.defaultAddress')}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={14} className="text-matcha-primary shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-[#0A0A0A] font-semibold truncate">
                    {preset.recipientName}
                  </div>
                  <p className="text-[11px] font-mono text-matcha-muted line-clamp-2 leading-relaxed">
                    {formatAddressArea([preset.addressLine1 || preset.address, preset.subdistrict, preset.district, preset.province, preset.postalCode || preset.zipCode])}
                  </p>
                  <span className="mt-2 text-[10px] font-mono text-matcha-muted">
                    {t('checkout.tel')}: {preset.phone}
                  </span>
                </div>
              );
            })}

            {/* Custom Address Option */}
            <div
              role="radio"
              aria-checked={isCustomAddress}
              tabIndex={0}
              onClick={handleCustomToggle}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCustomToggle();
                }
              }}
              className={`p-4 border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 min-h-[100px] outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary ${
                isCustomAddress
                  ? 'border-matcha-primary bg-matcha-bg text-matcha-primary'
                  : 'border-matcha-border hover:border-matcha-primary text-matcha-muted'
              }`}
            >
              <PlusCircle size={18} className={isCustomAddress ? 'text-matcha-primary' : 'text-matcha-muted'} />
              <span className="text-xs font-mono font-medium">
                {isCustomAddress ? t('checkout.usingCustom') : t('checkout.addAddress')}
              </span>
            </div>
          </div>
        </div>
        )}

        {/* Address Input Form */}
        <div className={hasSaved ? 'pt-4 border-t border-matcha-border space-y-4' : 'space-y-4'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="shipping-firstName" className="block text-xs font-mono text-matcha-muted mb-1">
                {t('checkout.firstName')} <span className="text-matcha-accent">*</span>
              </label>
              <input
                id="shipping-firstName"
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleChange}
                placeholder={t('checkout.phFirst')}
                className="w-full px-3.5 py-2.5 border border-matcha-border focus:border-matcha-primary outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] text-xs font-mono text-[#0A0A0A] bg-matcha-bg transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="shipping-lastName" className="block text-xs font-mono text-matcha-muted mb-1">
                {t('checkout.lastName')} <span className="text-matcha-accent">*</span>
              </label>
              <input
                id="shipping-lastName"
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleChange}
                placeholder={t('checkout.phLast')}
                className="w-full px-3.5 py-2.5 border border-matcha-border focus:border-matcha-primary outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] text-xs font-mono text-[#0A0A0A] bg-matcha-bg transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="shipping-email" className="block text-xs font-mono text-matcha-muted mb-1">
                {t('checkout.email')} <span className="text-matcha-accent">*</span>
              </label>
              <input
                id="shipping-email"
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder={t('checkout.phEmail')}
                className="w-full px-3.5 py-2.5 border border-matcha-border focus:border-matcha-primary outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] text-xs font-mono text-[#0A0A0A] bg-matcha-bg transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="shipping-phone" className="block text-xs font-mono text-matcha-muted mb-1">
                {t('checkout.phone')} <span className="text-matcha-accent">*</span>
              </label>
              <input
                id="shipping-phone"
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder={t('checkout.phPhone')}
                aria-invalid={phoneMalformed || undefined}
                aria-describedby={phoneMalformed ? 'shipping-phone-error' : undefined}
                className={`w-full px-3.5 py-2.5 border focus:border-matcha-primary outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] text-xs font-mono text-[#0A0A0A] bg-matcha-bg transition-colors ${phoneMalformed ? 'border-matcha-accent' : 'border-matcha-border'}`}
                required
              />
              {phoneMalformed && (
                <p id="shipping-phone-error" role="alert" className="mt-1 text-[11px] font-mono text-matcha-accent">
                  {t('checkout.phoneInvalid')}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="shipping-address" className="block text-xs font-mono text-matcha-muted mb-1">
                {t('checkout.street')} <span className="text-matcha-accent">*</span>
              </label>
              <input
                id="shipping-address"
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                placeholder={t('checkout.phStreet')}
                className="w-full px-3.5 py-2.5 border border-matcha-border focus:border-matcha-primary outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] text-xs font-mono text-[#0A0A0A] bg-matcha-bg transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="shipping-city" className="block text-xs font-mono text-matcha-muted mb-1">
                {t('checkout.city')} <span className="text-matcha-accent">*</span>
              </label>
              <input
                id="shipping-city"
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                placeholder={t('checkout.phCity')}
                className="w-full px-3.5 py-2.5 border border-matcha-border focus:border-matcha-primary outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] text-xs font-mono text-[#0A0A0A] bg-matcha-bg transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="shipping-zipCode" className="block text-xs font-mono text-matcha-muted mb-1">
                {t('checkout.postal')} <span className="text-matcha-accent">*</span>
              </label>
              <input
                id="shipping-zipCode"
                type="text"
                name="zipCode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                value={formData.zipCode || ''}
                onChange={handleChange}
                placeholder={t('checkout.phPostal')}
                aria-invalid={postalMalformed || undefined}
                aria-describedby={postalMalformed ? 'shipping-zipCode-error' : undefined}
                className={`w-full px-3.5 py-2.5 border focus:border-matcha-primary outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] text-xs font-mono text-[#0A0A0A] bg-matcha-bg transition-colors ${postalMalformed ? 'border-matcha-accent' : 'border-matcha-border'}`}
                required
              />
              {postalMalformed && (
                <p id="shipping-zipCode-error" role="alert" className="mt-1 text-[11px] font-mono text-matcha-accent">
                  {t('checkout.postalInvalid')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Speed Selection */}
      <div className="bg-white border border-matcha-border p-6 sm:p-7">
        <div className="pb-4 border-b border-matcha-border mb-5">
          <h2 className="text-base font-bold text-[#0A0A0A]">
            Delivery Method
          </h2>
          <p className="text-xs text-matcha-muted font-mono mt-0.5">
            Select preferred delivery timeframe
          </p>
        </div>

        <div role="radiogroup" aria-label="Delivery Method" className="space-y-3">
          {shippingOptions.map((option) => {
            const isSelected = selectedShipping === option.id;
            return (
              <div
                key={option.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => onSelectShipping(option.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectShipping(option.id);
                  }
                }}
                className={`p-4 border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary ${
                  isSelected
                    ? 'border-matcha-primary bg-matcha-bg'
                    : 'border-matcha-border bg-white hover:border-matcha-secondary/60 hover:bg-matcha-bg'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected ? 'border-matcha-primary bg-matcha-primary' : 'border-matcha-border bg-white'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0A0A0A]">{option.name}</span>
                      {option.id === 'express' && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-matcha-primary text-white">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-matcha-muted mt-0.5 flex items-center gap-1.5">
                      <Truck size={12} className="text-matcha-secondary" />
                      <span>{option.days}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right pl-7 sm:pl-0 font-mono font-bold text-sm text-matcha-primary">
                  {option.price === 0 ? 'Free' : `$${option.price.toFixed(2)}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <button
          type="button"
          onClick={onBackToCart}
          className="inline-flex items-center gap-2 text-xs font-mono text-matcha-muted hover:text-matcha-primary transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{t('checkout.backToBag')}</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!isFormValid}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-matcha-primary hover:bg-[#1A381F] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span>{t('checkout.continueToPayment')}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
