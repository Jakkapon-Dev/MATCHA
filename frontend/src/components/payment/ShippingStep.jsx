import React, { useState } from 'react';
import { Truck, MapPin, CheckCircle2, PlusCircle, ArrowLeft, ArrowRight, ShieldCheck, Sparkles, Building2, Home } from 'lucide-react';

const SAVED_ADDRESS_PRESETS = [
  {
    id: 'addr-primary',
    type: 'home',
    title: 'Primary Residence',
    firstName: 'Alex',
    lastName: 'Collector',
    email: 'alex@matcha.vip',
    phone: '081-999-8888',
    address: '123 Sukhumvit 55, Thong Lo, Apt 4B',
    city: 'Wattana, Bangkok',
    state: 'Bangkok',
    zipCode: '10110',
    country: 'Thailand'
  },
  {
    id: 'addr-studio',
    type: 'studio',
    title: 'Design Studio & Atelier',
    firstName: 'Alex',
    lastName: 'Studio',
    email: 'studio@matcha.vip',
    phone: '082-111-2222',
    address: '88 Charoenkrung Road, Creative District, Fl 2',
    city: 'Bang Rak, Bangkok',
    state: 'Bangkok',
    zipCode: '10500',
    country: 'Thailand'
  }
];

export default function ShippingStep({
  formData,
  onFormChange,
  shippingOptions = [],
  selectedShipping,
  onSelectShipping,
  onNext,
  onBackToCart
}) {
  const [selectedPreset, setSelectedPreset] = useState('addr-primary');
  const [isCustomAddress, setIsCustomAddress] = useState(false);

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
      {/* 1. Quick-Select Saved Addresses */}
      <div className="bg-white border border-[#E5E2D9] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E2D9] gap-2 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8EFE9] text-[#042509] flex items-center justify-center font-mono font-bold text-xs">
              01
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-[#111111] font-serif">
                Shipping Destination & Contact
              </h2>
              <span className="text-[10px] font-mono text-[#666666] tracking-wider uppercase">
                Step 1 of 2 • お届け先情報
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-[#518F5C] flex items-center gap-1.5 self-start sm:self-auto">
            <ShieldCheck size={14} />
            <span>Verified Vault Address</span>
          </span>
        </div>

        {/* Preset Address Cards Grid */}
        <div className="mb-6">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#666666] mb-3">
            Select Delivery Address
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {SAVED_ADDRESS_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id && !isCustomAddress;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                    isSelected
                      ? 'border-[#042509] bg-[#F7F9F7] shadow-xs ring-1 ring-[#042509]'
                      : 'border-[#E5E2D9] bg-white hover:border-[#518F5C]/60 hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {preset.type === 'home' ? (
                        <Home size={14} className="text-[#042509]" />
                      ) : (
                        <Building2 size={14} className="text-[#042509]" />
                      )}
                      <span className="font-serif font-bold text-xs text-[#111111]">{preset.title}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={15} className="text-[#042509] shrink-0 fill-[#042509]/10" />
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-[#555555] line-clamp-2 leading-relaxed">
                    {preset.address}, {preset.city} {preset.zipCode}
                  </p>
                  <span className="mt-3 text-[10px] font-mono font-bold text-[#888888]">
                    Tel: {preset.phone}
                  </span>
                </div>
              );
            })}

            {/* Custom Address Toggle Button */}
            <div
              onClick={handleCustomToggle}
              className={`p-4 rounded-2xl border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 min-h-[110px] ${
                isCustomAddress
                  ? 'border-[#042509] bg-[#F7F9F7] text-[#042509] ring-1 ring-[#042509]'
                  : 'border-[#D5D2C9] hover:border-[#042509] text-[#666666] hover:text-[#111111]'
              }`}
            >
              <PlusCircle size={20} className={isCustomAddress ? 'text-[#042509]' : 'text-[#888888]'} />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                {isCustomAddress ? 'Customizing Address' : '+ New Address'}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Address Input Fields */}
        <div className="pt-5 border-t border-[#F2F0EA] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                First Name <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleChange}
                placeholder="Alex"
                className="w-full px-4 py-3 rounded-xl border border-[#D5D2C9] focus:border-[#042509] focus:ring-1 focus:ring-[#042509] outline-none text-xs font-mono text-[#111111] bg-[#FAF9F6] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                Last Name <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleChange}
                placeholder="Collector"
                className="w-full px-4 py-3 rounded-xl border border-[#D5D2C9] focus:border-[#042509] focus:ring-1 focus:ring-[#042509] outline-none text-xs font-mono text-[#111111] bg-[#FAF9F6] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                Email Address <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="alex@matcha.vip"
                className="w-full px-4 py-3 rounded-xl border border-[#D5D2C9] focus:border-[#042509] focus:ring-1 focus:ring-[#042509] outline-none text-xs font-mono text-[#111111] bg-[#FAF9F6] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                Phone Number <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="081-234-5678"
                className="w-full px-4 py-3 rounded-xl border border-[#D5D2C9] focus:border-[#042509] focus:ring-1 focus:ring-[#042509] outline-none text-xs font-mono text-[#111111] bg-[#FAF9F6] transition-all"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                Street Address & Suite/Room <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                placeholder="123 Sukhumvit Road, Apt 4B"
                className="w-full px-4 py-3 rounded-xl border border-[#D5D2C9] focus:border-[#042509] focus:ring-1 focus:ring-[#042509] outline-none text-xs font-mono text-[#111111] bg-[#FAF9F6] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                District & City <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                placeholder="Wattana, Bangkok"
                className="w-full px-4 py-3 rounded-xl border border-[#D5D2C9] focus:border-[#042509] focus:ring-1 focus:ring-[#042509] outline-none text-xs font-mono text-[#111111] bg-[#FAF9F6] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                Postal Code <span className="text-[#C91D1D]">*</span>
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode || ''}
                onChange={handleChange}
                placeholder="10110"
                className="w-full px-4 py-3 rounded-xl border border-[#D5D2C9] focus:border-[#042509] focus:ring-1 focus:ring-[#042509] outline-none text-xs font-mono text-[#111111] bg-[#FAF9F6] transition-all"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tiered Shipping Method Selection */}
      <div className="bg-white border border-[#E5E2D9] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#E5E2D9]">
          <div className="w-8 h-8 rounded-xl bg-[#E8EFE9] text-[#042509] flex items-center justify-center font-mono font-bold text-xs">
            02
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-tight text-[#111111] font-serif">
              Select Delivery Speed & Handling
            </h2>
            <span className="text-[10px] font-mono text-[#666666] tracking-wider uppercase">
              Carbon-Neutral Artisan Logistics
            </span>
          </div>
        </div>

        <div className="space-y-3.5">
          {shippingOptions.map((option) => {
            const isSelected = selectedShipping === option.id;
            return (
              <div
                key={option.id}
                onClick={() => onSelectShipping(option.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-[#042509] bg-[#F7F9F7] shadow-xs ring-1 ring-[#042509]'
                    : 'border-[#E5E2D9] bg-white hover:border-[#518F5C]/60 hover:bg-[#FAF9F5]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected ? 'border-[#042509] bg-[#042509]' : 'border-[#D5D2C9] bg-white'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-[#111111]">{option.name}</span>
                      {option.id === 'express' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#042509] text-white">
                          RECOMMENDED
                        </span>
                      )}
                      {option.id === 'premium' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#E8EFE9] text-[#042509] border border-[#518F5C]/30">
                          WHITE GLOVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-[#666666] mt-0.5 flex items-center gap-1.5">
                      <Truck size={12} className="text-[#518F5C]" />
                      <span>{option.days} • Eco-protective packaging</span>
                    </p>
                  </div>
                </div>

                <div className="text-right pl-8 sm:pl-0">
                  <span className="font-mono font-black text-sm text-[#042509]">
                    {option.price === 0 ? (
                      <span className="text-[#518F5C] font-bold">COMPLIMENTARY</span>
                    ) : (
                      `$${option.price.toFixed(2)}`
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation and Next Step Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBackToCart}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.15em] text-[#666666] hover:text-[#042509] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Return to Atelier Bag</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!isFormValid}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#042509] hover:bg-[#1A381F] text-white text-xs font-mono font-bold uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#042509]/20 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer group"
        >
          <span>Continue to Payment</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
