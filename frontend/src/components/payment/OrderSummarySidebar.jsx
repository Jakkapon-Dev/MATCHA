import React from 'react';
import { Gift, Lock, ShoppingBag } from 'lucide-react';
import { handleImageError, webpSrc } from '../../utils/imageFallback';

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
  // Prices, discounts, shipping, and coupon validation are calculated by the parent;
  // this sidebar is a controlled summary and never mutates checkout state directly.
  return (
    <div className="bg-white border border-[#DCDCDC] rounded-3xl p-6 sm:p-7 shadow-sm sticky top-28 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#DCDCDC]">
        <h3 className="text-sm font-extrabold uppercase text-[#000000] font-mono">
          Order Summary ({cartItems.length})
        </h3>
        <span className="text-[11px] font-mono text-[#042509] font-bold">
          MatchA Direct
        </span>
      </div>

      {/* Cart Items Miniature List */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {cartItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs font-mono">
            <div className="w-12 h-14 rounded-lg bg-[#F1F1F1] border border-[#DCDCDC] overflow-hidden shrink-0">
              <img
                src={webpSrc(item.image)} data-original-src={item.image}
                alt={item.name}
                onError={handleImageError}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[#000000] truncate">{item.name}</div>
              <div className="text-[10px] text-[#666666]">
                {item.color} • {item.size || 'M'} • Qty: {item.quantity || 1}
              </div>
            </div>
            <div className="font-bold text-[#000000]">
              ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code Form */}
      {/* Submitting delegates validation; applied and error states come back as props. */}
      <form onSubmit={onApplyCoupon} className="space-y-2 pt-4 border-t border-[#DCDCDC]">
        <label className="block text-[10px] font-mono font-bold uppercase text-[#666666]">
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
            className="px-4 py-2 bg-[#000000] hover:bg-[#042509] text-white text-xs font-bold font-mono rounded-xl transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>

        {couponError && (
          <p className="text-[11px] text-[#C91D1D] font-mono">{couponError}</p>
        )}

        {appliedCoupon && (
          <div className="p-2.5 rounded-xl bg-[#518F5C]/50 border border-[#3E7047] flex items-center justify-between text-xs font-mono text-[#042509]">
            <span>Code <strong>{appliedCoupon.code}</strong> Applied ({appliedCoupon.label})</span>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="text-[#C91D1D] font-bold hover:underline cursor-pointer text-[10px]"
            >
              Remove
            </button>
          </div>
        )}
      </form>

      {/* Render the parent's calculation order: subtotal + shipping - discount = total. */}
      <div className="space-y-2 pt-4 border-t border-[#DCDCDC] text-xs font-mono">
        <div className="flex justify-between text-[#666666]">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[#666666]">
          <span>Shipping</span>
          <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-[#C91D1D] font-bold">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-extrabold text-[#000000] pt-3 border-t border-[#DCDCDC]">
          <span>Total</span>
          <span className="text-[#042509]">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-[10px] font-mono text-[#666666] text-center flex items-center justify-center gap-1.5 pt-1">
        <Lock size={12} className="text-[#042509]" />
        <span>Guaranteed Safe & Secure Checkout</span>
      </div>

    </div>
  );
}
