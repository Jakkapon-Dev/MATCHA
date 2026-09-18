import React from 'react';
import { Lock, Tag, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { handleImageError, webpSrc } from '../../utils/imageFallback';

export default function OrderSummarySidebar({
  cartItems = [],
  subtotal = 0,
  shippingCost = 0,
  discount = 0,
  total = 0,
  couponCode = '',
  onCouponCodeChange,
  onApplyCoupon,
  appliedCoupon = null,
  couponError = '',
  onRemoveCoupon
}) {
  return (
    <div className="bg-white border border-[#E5E2D9] rounded-3xl p-6 sm:p-7 shadow-xs sticky top-28 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E2D9]">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#518F5C] font-bold">
            Atelier Manifest
          </span>
          <h3 className="text-base font-black uppercase text-[#111111] font-serif tracking-tight">
            Order Summary ({cartItems.length})
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#E8EFE9] text-[#042509] text-[10px] font-mono font-bold">
          MatchA Direct
        </span>
      </div>

      {/* Cart Items Miniature List */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {cartItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs font-mono p-2 rounded-xl hover:bg-[#FAF9F6] transition-colors">
            <div className="w-12 h-14 rounded-xl bg-[#F4F3EE] border border-[#E5E2D9] overflow-hidden shrink-0 flex items-center justify-center">
              {item.image ? (
                <img
                  src={webpSrc(item.image)} 
                  data-original-src={item.image}
                  alt={item.name}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm">🍵</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[#111111] truncate">{item.name}</div>
              <div className="text-[10px] text-[#777777] flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#042509] inline-block" />
                <span>{item.color || 'Artisan'}</span>
                <span>•</span>
                <span>{item.size || 'M'}</span>
                <span>•</span>
                <span>Qty: {item.quantity || 1}</span>
              </div>
            </div>
            <div className="font-bold text-[#042509]">
              ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Promotional Code Form */}
      <form onSubmit={onApplyCoupon} className="space-y-2 pt-4 border-t border-[#E5E2D9]">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1.5">
          <Tag size={12} className="text-[#518F5C]" />
          <span>Atelier Privilege Code</span>
        </label>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => onCouponCodeChange(e.target.value)}
            placeholder="Try MATCHA15 or VIPDROP"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#D5D2C9] focus:border-[#042509] focus:ring-1 focus:ring-[#042509] outline-none text-xs font-mono uppercase bg-[#FAF9F6] transition-all"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#042509] hover:bg-[#1A381F] text-white text-xs font-bold font-mono rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            Apply
          </button>
        </div>

        {couponError && (
          <p className="text-[11px] text-[#C91D1D] font-mono mt-1">{couponError}</p>
        )}

        {appliedCoupon && (
          <div className="p-3 rounded-xl bg-[#E8EFE9] border border-[#518F5C]/40 flex items-center justify-between text-xs font-mono text-[#042509] mt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#518F5C]" />
              <div>
                <span className="font-bold block">{appliedCoupon.code}</span>
                <span className="text-[10px] text-[#256029]">{appliedCoupon.label}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="text-[#C91D1D] font-bold hover:underline cursor-pointer text-[10px] uppercase tracking-wider"
            >
              Remove
            </button>
          </div>
        )}
      </form>

      {/* Calculations Breakdown */}
      <div className="space-y-3 pt-4 border-t border-[#E5E2D9] text-xs font-mono">
        <div className="flex justify-between text-[#666666]">
          <span>Garments Subtotal</span>
          <span className="font-bold text-[#111111]">${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-[#666666]">
          <span>Delivery Handling</span>
          <span className="font-bold text-[#111111]">
            {shippingCost === 0 ? (
              <span className="text-[#518F5C] font-bold">COMPLIMENTARY</span>
            ) : (
              `$${shippingCost.toFixed(2)}`
            )}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-[#042509] font-bold">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-[#518F5C]" />
              <span>Privilege Discount</span>
            </span>
            <span>−${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline pt-4 border-t border-dashed border-[#D5D2C9]">
          <div>
            <span className="text-xs uppercase tracking-widest font-mono font-bold text-[#111111] block">Total Due</span>
            <span className="text-[10px] font-mono text-[#888888]">Taxes & Duties Included</span>
          </div>
          <span className="text-2xl font-black font-mono text-[#042509]">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-[10px] font-mono text-[#666666] text-center flex items-center justify-center gap-1.5 pt-2 border-t border-[#F2F0EA]">
        <ShieldCheck size={14} className="text-[#518F5C]" />
        <span>Authentic Craftsmanship • Global Express Delivery</span>
      </div>
    </div>
  );
}
