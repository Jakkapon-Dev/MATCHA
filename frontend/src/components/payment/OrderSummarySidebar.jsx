import React from 'react';
import { Tag, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
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
    <div className="bg-white border border-[#E5E2D9] rounded-2xl p-6 shadow-xs sticky top-28 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D9]">
        <h2 className="text-base font-serif font-bold text-[#111111] tracking-tight">
          Order Summary ({cartItems.length})
        </h2>
        <span className="text-xs font-mono text-[#518F5C]">
          Direct from atelier
        </span>
      </div>

      {/* Cart Items Miniature List */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {cartItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs font-mono p-1.5 rounded-lg hover:bg-[#FAF9F6] transition-colors">
            <div className="w-12 h-14 rounded-lg bg-[#F4F3EE] border border-[#E5E2D9] overflow-hidden shrink-0 flex items-center justify-center">
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
              <div className="font-medium text-[#111111] truncate">{item.name}</div>
              <div className="text-[11px] text-[#777777] flex items-center gap-1.5 mt-0.5">
                <span>{item.color || 'Natural'}</span>
                <span>•</span>
                <span>Size {item.size || 'M'}</span>
                <span>•</span>
                <span>Qty {item.quantity || 1}</span>
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
        <label className="block text-xs font-mono text-[#555555] flex items-center gap-1.5">
          <Tag size={12} className="text-[#518F5C]" />
          <span>Promo code</span>
        </label>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => onCouponCodeChange(e.target.value)}
            placeholder="e.g. MATCHA15"
            className="flex-1 px-3 py-2 rounded-lg border border-[#D5D2C9] focus:border-[#042509] outline-none text-xs font-mono uppercase bg-[#FAF9F6] transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#042509] hover:bg-[#1A381F] text-white text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>

        {couponError && (
          <p className="text-[11px] text-[#C91D1D] font-mono mt-1">{couponError}</p>
        )}

        {appliedCoupon && (
          <div className="p-2.5 rounded-lg bg-[#E8EFE9] border border-[#518F5C]/30 flex items-center justify-between text-xs font-mono text-[#042509] mt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#518F5C]" />
              <div>
                <span className="font-bold">{appliedCoupon.code}</span>
                <span className="text-[11px] text-[#256029] ml-1.5">({appliedCoupon.label})</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="text-[#C91D1D] font-medium hover:underline cursor-pointer text-[10px]"
            >
              Remove
            </button>
          </div>
        )}
      </form>

      {/* Price Calculations */}
      <div className="space-y-2.5 pt-4 border-t border-[#E5E2D9] text-xs font-mono">
        <div className="flex justify-between text-[#666666]">
          <span>Subtotal</span>
          <span className="font-bold text-[#111111]">${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-[#666666]">
          <span>Delivery</span>
          <span className="font-bold text-[#111111]">
            {shippingCost === 0 ? (
              <span className="text-[#518F5C]">Free</span>
            ) : (
              `$${shippingCost.toFixed(2)}`
            )}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-[#042509] font-bold">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-[#518F5C]" />
              <span>Discount</span>
            </span>
            <span>−${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-[#D5D2C9]">
          <div>
            <span className="text-xs font-mono font-bold text-[#111111] block">Total</span>
            <span className="text-[10px] font-mono text-[#888888]">Taxes included</span>
          </div>
          <span className="text-2xl font-bold font-mono text-[#042509]">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-[11px] font-mono text-[#777777] text-center flex items-center justify-center gap-1.5 pt-1 border-t border-[#F2F0EA]">
        <ShieldCheck size={13} className="text-[#518F5C]" />
        <span>Authentic craftsmanship & safe delivery</span>
      </div>
    </div>
  );
}
