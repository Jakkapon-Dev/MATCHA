import React from 'react';
import { Truck, Shield, MapPin, User, Mail, Phone } from 'lucide-react';

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
    onFormChange({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.phone && formData.address && formData.city && formData.zipCode;

  return (
    <div className="space-y-8">
      {/* 1. Address Form */}
      <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#D9D3C7]">
          <MapPin size={18} className="text-[#2D5A27]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#2D231E]">
            1. Shipping & Contact Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#6B5E55] mb-1">
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
            <label className="block text-[11px] font-mono font-bold uppercase text-[#6B5E55] mb-1">
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
            <label className="block text-[11px] font-mono font-bold uppercase text-[#6B5E55] mb-1">
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
            <label className="block text-[11px] font-mono font-bold uppercase text-[#6B5E55] mb-1">
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
            <label className="block text-[11px] font-mono font-bold uppercase text-[#6B5E55] mb-1">
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
            <label className="block text-[11px] font-mono font-bold uppercase text-[#6B5E55] mb-1">
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
            <label className="block text-[11px] font-mono font-bold uppercase text-[#6B5E55] mb-1">
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
      <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#D9D3C7]">
          <Truck size={18} className="text-[#2D5A27]" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#2D231E]">
            2. Delivery Method
          </h2>
        </div>

        <div className="space-y-3">
          {shippingOptions.map((option) => (
            <label
              key={option.id}
              onClick={() => onSelectShipping(option.id)}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                selectedShipping === option.id
                  ? 'border-[#2D5A27] bg-[#D0DEC6]/30 shadow-xs ring-1 ring-[#2D5A27]'
                  : 'border-[#D9D3C7] hover:border-[#2D5A27]'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping"
                  checked={selectedShipping === option.id}
                  onChange={() => onSelectShipping(option.id)}
                  className="accent-[#2D5A27] cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold font-mono text-[#2D231E]">{option.name}</div>
                  <div className="text-[11px] font-mono text-[#6B5E55]">{option.days}</div>
                </div>
              </div>
              <div className="text-xs font-bold font-mono text-[#2D5A27]">
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
          className="text-xs font-mono font-bold text-[#6B5E55] hover:text-[#2D231E] transition-colors cursor-pointer"
        >
          ← Return to Cart
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isFormValid}
          className="px-8 py-3.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          Proceed to Payment →
        </button>
      </div>
    </div>
  );
}
