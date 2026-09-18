import React from 'react';
import { Truck, MapPin, Phone } from 'lucide-react';

export default function ShippingStep({
  formData,
  onFormChange,
  shippingOptions,
  selectedShipping,
  onSelectShipping,
  onNext,
  onBackToCart
}) {
  const handleChange = (e) => {
    // All shipping inputs are controlled by the parent checkout page. The input name
    // selects the field to replace while preserving the rest of the address.
    onFormChange({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // This step currently checks presence only; native input types handle basic browser
  // validation. The Next button stays disabled until every required value is truthy.
  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.phone && formData.address && formData.city && formData.zipCode;

  return (
    <div className="space-y-8">
      {/* 1. Address Form */}
      <div className="bg-white border border-[#DCDCDC] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#DCDCDC]">
          <MapPin size={18} className="text-[#042509]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#000000]">
            1. Shipping & Contact Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Alex"
              className="w-full px-3.5 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Collector"
              className="w-full px-3.5 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@matcha.vip"
              className="w-full px-3.5 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="081-234-5678"
              className="w-full px-3.5 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 transition-colors"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
              Street Address *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Sukhumvit Road, Apt 4B"
              className="w-full px-3.5 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Bangkok"
              className="w-full px-3.5 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#666666] mb-1">
              Postal Code *
            </label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="10110"
              className="w-full px-3.5 py-2.5 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono text-matcha-text bg-matcha-bg/40 transition-colors"
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Shipping Method Selection */}
      <div className="bg-white border border-[#DCDCDC] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#DCDCDC]">
          <Truck size={18} className="text-[#042509]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#000000]">
            2. Delivery Method
          </h2>
        </div>

        <div className="space-y-3">
          {/* The complete label is clickable; the radio mirrors parent-owned selection. */}
          {shippingOptions.map((option) => (
            <label
              key={option.id}
              onClick={() => onSelectShipping(option.id)}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                selectedShipping === option.id
                  ? 'border-[#042509] bg-[#518F5C]/30 shadow-xs ring-1 ring-[#042509]'
                  : 'border-[#DCDCDC] hover:border-[#042509]'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping"
                  checked={selectedShipping === option.id}
                  onChange={() => onSelectShipping(option.id)}
                  className="accent-[#042509] cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold font-mono text-[#000000]">{option.name}</div>
                  <div className="text-[11px] font-mono text-[#666666]">{option.days}</div>
                </div>
              </div>
              <div className="text-xs font-bold font-mono text-[#042509]">
                {option.price === 0 ? 'FREE' : `$${option.price.toFixed(2)}`}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBackToCart}
          className="text-xs font-mono font-bold text-[#666666] hover:text-[#000000] transition-colors cursor-pointer"
        >
          ← Return to Cart
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isFormValid}
          className="px-8 py-3.5 bg-[#042509] hover:bg-[#021505] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          Proceed to Payment →
        </button>
      </div>
    </div>
  );
}
