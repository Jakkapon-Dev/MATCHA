import React from 'react';
import { Gift, Lock, ShoppingBag } from 'lucide-react';
import { handleImageError } from '../../utils/imageFallback';

export default function OrderSummarySidebar({
  cartItems,
  subtotal,
  shippingCost,
  discount,
  total,
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  appliedCoupon,
  couponError,
  onRemoveCoupon
}) {
  return (
    <div className="bg-white border border-[#D9D3C7] rounded-3xl p-6 sm:p-7 shadow-sm sticky top-28 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D9D3C7]">
        <h3 className="text-sm font-extrabold uppercase text-[#2D231E] font-mono">
          Order Summary ({cartItems.length})
        </h3>
        <span className="text-[11px] font-mono text-[#2D5A27] font-bold">
          MatchA Direct
        </span>
      </div>

      {/* Cart Items Miniature List */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {cartItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs font-mono">
            <div className="w-12 h-14 rounded-lg bg-[#FAF8F5] border border-[#D9D3C7] overflow-hidden shrink-0">
              <img
                src={item.image}
                alt={item.name}
                onError={handleImageError}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[#2D231E] truncate">{item.name}</div>
              <div className="text-[10px] text-[#6B5E55]">
                {item.color} • {item.size || 'M'} • Qty: {item.quantity || 1}
              </div>
            </div>
            <div className="font-bold text-[#2D231E]">
              ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code Form */}
      <form onSubmit={onApplyCoupon} className="space-y-2 pt-4 border-t border-[#D9D3C7]">
        <label className="block text-[10px] font-mono font-bold uppercase text-[#6B5E55]">
          Promotional Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => onCouponCodeChange(e.target.value)}
            placeholder="e.g. MATCHA15"
            className="flex-1 px-3 py-2 rounded-xl border border-matcha-border focus:border-matcha-primary focus:ring-1 focus:ring-matcha-primary outline-none text-xs font-mono uppercase bg-matcha-bg/40 transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#2D231E] hover:bg-[#2D5A27] text-white text-xs font-bold font-mono rounded-xl transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>

        {couponError && (
          <p className="text-[11px] text-[#BC5A36] font-mono">{couponError}</p>
        )}

        {appliedCoupon && (
          <div className="p-2.5 rounded-xl bg-[#D0DEC6]/50 border border-[#B8CBAE] flex items-center justify-between text-xs font-mono text-[#2D5A27]">
            <span>Code <strong>{appliedCoupon.code}</strong> Applied ({appliedCoupon.label})</span>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="text-[#BC5A36] font-bold hover:underline cursor-pointer text-[10px]"
            >
              Remove
            </button>
          </div>
        )}
      </form>

      {/* Calculations Breakdown */}
      <div className="space-y-2 pt-4 border-t border-[#D9D3C7] text-xs font-mono">
        <div className="flex justify-between text-[#6B5E55]">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[#6B5E55]">
          <span>Shipping</span>
          <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-[#BC5A36] font-bold">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-extrabold text-[#2D231E] pt-3 border-t border-[#D9D3C7]">
          <span>Total</span>
          <span className="text-[#2D5A27]">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-[10px] font-mono text-[#6B5E55] text-center flex items-center justify-center gap-1.5 pt-1">
        <Lock size={12} className="text-[#2D5A27]" />
        <span>Guaranteed Safe & Secure Checkout</span>
      </div>

    </div>
  );
}
