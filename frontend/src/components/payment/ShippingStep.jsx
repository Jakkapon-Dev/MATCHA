import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { readAddressBook, rememberAddress } from '../../features/account/addressBook';
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

  /* Saved addresses belong to an account. A visitor who has not signed in has
     none, so they are shown no picker at all and simply fill the form —
     which is what the old preset cards were pretending to skip, using
     somebody else's name and street. */
  const savedAddresses = useMemo(() => readAddressBook(currentUser), [currentUser]);
  const hasSaved = savedAddresses.length > 0;

  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  const seeded = useRef(false);

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
      email: preset.email,
      phone: preset.phone,
      address: preset.address,
      city: preset.city,
      state: preset.state,
      zipCode: preset.zipCode,
      country: preset.country,
    });
  }, [hasSaved, savedAddresses, currentUser, formData, onFormChange]);

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    setIsCustomAddress(false);
    onFormChange({
      ...formData,
      firstName: preset.firstName,
      lastName: preset.lastName,
      email: preset.email,
      phone: preset.phone,
      address: preset.address,
      city: preset.city,
      state: preset.state,
      zipCode: preset.zipCode,
      country: preset.country
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

  const isFormValid = Boolean(
    formData.firstName?.trim() &&
    formData.lastName?.trim() &&
    formData.email?.trim() &&
    formData.phone?.trim() &&
    formData.address?.trim() &&
    formData.city?.trim() &&
    formData.zipCode?.trim()
  );

  return (
    <div className="space-y-8">
      {/* Address Card */}
      <div className="bg-white border border-[#DCDCDC] p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DCDCDC] gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-[#0A0A0A]">
              {t('checkout.addressTitle')}
            </h2>
            <p className="text-xs text-[#666666] font-mono mt-0.5">
              {t('checkout.addressNote')}
            </p>
          </div>
          {hasSaved && (
            <span className="text-xs font-mono text-[#666666] flex items-center gap-1.5 self-start sm:self-auto">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>{t('checkout.savedAddresses')}</span>
            </span>
          )}
        </div>

        {/* Preset Address Selection */}
        {hasSaved && (
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {savedAddresses.map((preset) => {
              const isSelected = selectedPreset === preset.id && !isCustomAddress;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-4 border transition-all cursor-pointer flex flex-col justify-between text-left ${
                    isSelected
                      ? 'border-[#042509] bg-[#F1F1F1]'
                      : 'border-[#DCDCDC] bg-white hover:border-[#518F5C]/60 hover:bg-[#F1F1F1]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {preset.type === 'home' ? (
                        <Home size={13} className="text-[#042509]" />
                      ) : (
                        <Building2 size={13} className="text-[#042509]" />
                      )}
                      <span className="font-bold text-xs text-[#0A0A0A]">{preset.title}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={14} className="text-[#042509] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-[#666666] line-clamp-2 leading-relaxed">
                    {preset.address}, {preset.city} {preset.zipCode}
                  </p>
                  <span className="mt-2 text-[10px] font-mono text-[#666666]">
                    {t('checkout.tel')}: {preset.phone}
                  </span>
                </div>
              );
            })}

            {/* Custom Address Option */}
            <div
              onClick={handleCustomToggle}
              className={`p-4 border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 min-h-[100px] ${
                isCustomAddress
                  ? 'border-[#042509] bg-[#F1F1F1] text-[#042509]'
                  : 'border-[#DCDCDC] hover:border-[#042509] text-[#666666]'
              }`}
            >
              <PlusCircle size={18} className={isCustomAddress ? 'text-[#042509]' : 'text-[#666666]'} />
              <span className="text-xs font-mono font-medium">
                {isCustomAddress ? t('checkout.usingCustom') : t('checkout.addAddress')}
              </span>
            </div>
          </div>
        </div>
        )}

        {/* Address Input Form */}
        <div className={hasSaved ? 'pt-4 border-t border-[#DCDCDC] space-y-4' : 'space-y-4'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#666666] mb-1">
                {t('checkout.firstName')} <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleChange}
                placeholder={t('checkout.phFirst')}
                className="w-full px-3.5 py-2.5 border border-[#DCDCDC] focus:border-[#042509] outline-none text-xs font-mono text-[#0A0A0A] bg-[#F1F1F1] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#666666] mb-1">
                {t('checkout.lastName')} <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleChange}
                placeholder={t('checkout.phLast')}
                className="w-full px-3.5 py-2.5 border border-[#DCDCDC] focus:border-[#042509] outline-none text-xs font-mono text-[#0A0A0A] bg-[#F1F1F1] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#666666] mb-1">
                {t('checkout.email')} <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder={t('checkout.phEmail')}
                className="w-full px-3.5 py-2.5 border border-[#DCDCDC] focus:border-[#042509] outline-none text-xs font-mono text-[#0A0A0A] bg-[#F1F1F1] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#666666] mb-1">
                {t('checkout.phone')} <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder={t('checkout.phPhone')}
                className="w-full px-3.5 py-2.5 border border-[#DCDCDC] focus:border-[#042509] outline-none text-xs font-mono text-[#0A0A0A] bg-[#F1F1F1] transition-colors"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-[#666666] mb-1">
                {t('checkout.street')} <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                placeholder={t('checkout.phStreet')}
                className="w-full px-3.5 py-2.5 border border-[#DCDCDC] focus:border-[#042509] outline-none text-xs font-mono text-[#0A0A0A] bg-[#F1F1F1] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#666666] mb-1">
                {t('checkout.city')} <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                placeholder={t('checkout.phCity')}
                className="w-full px-3.5 py-2.5 border border-[#DCDCDC] focus:border-[#042509] outline-none text-xs font-mono text-[#0A0A0A] bg-[#F1F1F1] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#666666] mb-1">
                {t('checkout.postal')} <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode || ''}
                onChange={handleChange}
                placeholder={t('checkout.phPostal')}
                className="w-full px-3.5 py-2.5 border border-[#DCDCDC] focus:border-[#042509] outline-none text-xs font-mono text-[#0A0A0A] bg-[#F1F1F1] transition-colors"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Speed Selection */}
      <div className="bg-white border border-[#DCDCDC] p-6 sm:p-7">
        <div className="pb-4 border-b border-[#DCDCDC] mb-5">
          <h2 className="text-base font-bold text-[#0A0A0A]">
            Delivery Method
          </h2>
          <p className="text-xs text-[#666666] font-mono mt-0.5">
            Select preferred delivery timeframe
          </p>
        </div>

        <div className="space-y-3">
          {shippingOptions.map((option) => {
            const isSelected = selectedShipping === option.id;
            return (
              <div
                key={option.id}
                onClick={() => onSelectShipping(option.id)}
                className={`p-4 border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-[#042509] bg-[#F1F1F1]'
                    : 'border-[#DCDCDC] bg-white hover:border-[#518F5C]/60 hover:bg-[#F1F1F1]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected ? 'border-[#042509] bg-[#042509]' : 'border-[#DCDCDC] bg-white'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0A0A0A]">{option.name}</span>
                      {option.id === 'express' && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#042509] text-white">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-[#666666] mt-0.5 flex items-center gap-1.5">
                      <Truck size={12} className="text-[#518F5C]" />
                      <span>{option.days}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right pl-7 sm:pl-0 font-mono font-bold text-sm text-[#042509]">
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
          className="inline-flex items-center gap-2 text-xs font-mono text-[#666666] hover:text-[#042509] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{t('checkout.backToBag')}</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!isFormValid}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#042509] hover:bg-[#1A381F] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span>{t('checkout.continueToPayment')}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
