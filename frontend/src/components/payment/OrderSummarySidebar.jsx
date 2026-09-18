import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
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
  const { t } = useLanguage();
  return (
    <div className="bg-white border border-[#DCDCDC] p-6 sticky top-28 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DCDCDC]">
        <h2 className="text-base font-bold text-[#0A0A0A] tracking-tight">
          Order Summary ({cartItems.length})
        </h2>
        <span className="text-xs font-mono text-[#518F5C]">
          Direct from atelier
        </span>
      </div>

      {/* Cart Items Miniature List */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {cartItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs font-mono p-1.5 hover:bg-[#F1F1F1] transition-colors">
            <div className="w-12 h-14 bg-[#F1F1F1] border border-[#DCDCDC] overflow-hidden shrink-0 flex items-center justify-center">
              {item.image ? (
                <img
                  src={webpSrc(item.image)} 
                  data-original-src={item.image}
                  alt={item.name}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[9px] font-mono text-[#666666] uppercase">{item.id}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[#0A0A0A] truncate">{item.name}</div>
              <div className="text-[11px] text-[#666666] flex items-center gap-1.5 mt-0.5">
                <span>{item.color || 'Natural'}</span>
                <span>Size {item.size || 'M'}</span>
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
      <form onSubmit={onApplyCoupon} className="space-y-2 pt-4 border-t border-[#DCDCDC]">
        <label className="block text-xs font-mono text-[#666666] flex items-center gap-1.5">
          <Tag size={12} className="text-[#518F5C]" />
          <span>{t('checkout.promo')}</span>
        </label>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => onCouponCodeChange(e.target.value)}
            placeholder={t('checkout.promoPlaceholder')}
            className="flex-1 px-3 py-2 border border-[#DCDCDC] focus:border-[#042509] outline-none text-xs font-mono uppercase bg-[#F1F1F1] transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#042509] hover:bg-[#1A381F] text-white text-xs font-bold font-mono transition-colors cursor-pointer"
          >
            {t('checkout.apply')}
          </button>
        </div>

        {couponError && (
          <p className="text-[11px] text-[#C91D1D] font-mono mt-1">{couponError}</p>
        )}

        {appliedCoupon && (
          <div className="p-2.5 bg-[#F1F1F1] border border-[#518F5C]/30 flex items-center justify-between text-xs font-mono text-[#042509] mt-2">
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
      <div className="space-y-2.5 pt-4 border-t border-[#DCDCDC] text-xs font-mono">
        <div className="flex justify-between text-[#666666]">
          <span>{t('checkout.subtotal')}</span>
          <span className="font-bold text-[#0A0A0A]">${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-[#666666]">
          <span>{t('checkout.delivery')}</span>
          <span className="font-bold text-[#0A0A0A]">
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
              <span>{t('checkout.discount')}</span>
            </span>
            <span>−${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-[#DCDCDC]">
          <div>
            <span className="text-xs font-mono font-bold text-[#0A0A0A] block">{t('checkout.total')}</span>
            <span className="text-[10px] font-mono text-[#666666]">{t('checkout.taxes')}</span>
          </div>
          <span className="text-2xl font-bold font-mono text-[#042509]">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-[11px] font-mono text-[#666666] text-center flex items-center justify-center gap-1.5 pt-1 border-t border-[#F1F1F1]">
        <ShieldCheck size={13} className="text-[#518F5C]" />
        <span>{t('checkout.assurance')}</span>
      </div>
    </div>
  );
}
