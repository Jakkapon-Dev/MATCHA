import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag, Sparkles } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) {
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  if (!isOpen) return null;

  // Calculate Subtotal
  const subtotal = items.reduce((sum, item) => {
    const priceNum = item.priceNum || parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
    const qty = item.quantity || 1;
    return sum + priceNum * qty;
  }, 0);

  const discount = promoApplied ? subtotal * 0.15 : 0;
  const shippingThreshold = 100;
  const shipping = subtotal >= shippingThreshold || subtotal === 0 ? 0 : 9.99;
  const total = Math.max(0, subtotal - discount + shipping);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'MATCHA15') {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try: MATCHA15');
    }
  };

  const handleProceedCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setCheckoutSuccess(true);
      if (onCheckout) onCheckout();
      setTimeout(() => {
        setCheckoutSuccess(false);
        onClose();
      }, 2500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fade-in">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] border-l border-[#D9D3C7] shadow-2xl flex flex-col justify-between animate-scale-up">
          
          {/* 1. Header */}
          <div className="p-6 bg-[#2D231E] text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={20} className="text-[#BC5A36]" />
              <h3 className="text-lg font-black uppercase tracking-tight font-sans">
                Your Bag ({items.length})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* 2. Free Shipping Meter */}
          <div className="bg-[#D0DEC6]/50 px-6 py-2.5 border-b border-[#D9D3C7] text-xs font-mono">
            {subtotal >= shippingThreshold ? (
              <div className="text-[#2D5A27] font-bold flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>🎉 YOU UNLOCKED FREE EXPRESS SHIPPING!</span>
              </div>
            ) : (
              <div className="text-[#2D231E]">
                Add <span className="font-bold text-[#BC5A36]">${(shippingThreshold - subtotal).toFixed(2)}</span> more for <strong className="text-[#2D5A27]">FREE SHIPPING</strong>
              </div>
            )}
            <div className="w-full bg-[#D9D3C7] h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-[#2D5A27] h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (subtotal / shippingThreshold) * 100)}%` }}
              />
            </div>
          </div>

          {/* 3. Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {checkoutSuccess ? (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-3 animate-scale-up">
                <div className="w-16 h-16 rounded-full bg-[#2D5A27] text-white flex items-center justify-center text-2xl shadow-xl animate-bounce">
                  ✓
                </div>
                <h4 className="text-xl font-extrabold text-[#2D231E]">Order Confirmed!</h4>
                <p className="text-xs text-[#6B5E55] font-mono max-w-xs">
                  Your MatchA drop is being prepared. Tracking details sent to your email.
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center text-[#6B5E55] gap-3">
                <div className="w-16 h-16 rounded-full bg-[#D0DEC6]/50 flex items-center justify-center text-2xl text-[#2D5A27]">
                  🛍️
                </div>
                <h4 className="font-bold text-[#2D231E] text-base">Your bag is empty</h4>
                <p className="text-xs font-mono max-w-xs">Explore our latest street favorites & archive drops to add pieces to your bag.</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Explore Lookbook →
                </button>
              </div>
            ) : (
              items.map((item, idx) => {
                const priceNum = item.priceNum || parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
                const qty = item.quantity || 1;

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-3.5 bg-white border border-[#D9D3C7] rounded-xl flex gap-3.5 items-center shadow-xs hover:border-[#BC5A36] transition-colors"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-18 h-20 bg-[#FAF8F5] shrink-0 border border-[#D9D3C7] p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={item.image || '/images/products/standalone/mustard_sweater.jpg'}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#2D231E] truncate uppercase font-sans">
                        {item.name}
                      </h4>
                      <p className="text-[11px] font-mono text-[#BC5A36] font-bold mt-0.5">
                        ${priceNum.toFixed(2)}
                      </p>
                      {item.size && (
                        <span className="text-[10px] font-mono text-[#6B5E55]">
                          Size: {item.size} {item.color ? `• ${item.color}` : ''}
                        </span>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => onUpdateQuantity && onUpdateQuantity(idx, Math.max(1, qty - 1))}
                          className="w-5 h-5 rounded-xs bg-[#FAF8F5] border border-[#D9D3C7] hover:bg-neutral-200 flex items-center justify-center text-xs cursor-pointer"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-mono font-bold w-4 text-center">{qty}</span>
                        <button
                          onClick={() => onUpdateQuantity && onUpdateQuantity(idx, qty + 1)}
                          className="w-5 h-5 rounded-xs bg-[#FAF8F5] border border-[#D9D3C7] hover:bg-neutral-200 flex items-center justify-center text-xs cursor-pointer"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>

                    {/* Remove Item */}
                    <button
                      onClick={() => onRemoveItem && onRemoveItem(idx)}
                      aria-label="Remove item"
                      className="p-2 text-[#6B5E55] hover:text-[#BC5A36] transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* 4. Footer Summary & Checkout */}
          {items.length > 0 && !checkoutSuccess && (
            <div className="p-6 bg-white border-t border-[#D9D3C7] space-y-4">
              
              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo code (e.g. MATCHA15)"
                    className="w-full pl-8 pr-3 py-2 bg-[#FAF8F5] border border-[#D9D3C7] text-xs font-mono uppercase focus:outline-none focus:border-[#BC5A36]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2D231E] hover:bg-black text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>
              {promoApplied && (
                <p className="text-[10px] font-mono text-[#2D5A27] font-bold">
                  ✓ Code MATCHA15 applied (-15% off)
                </p>
              )}
              {promoError && (
                <p className="text-[10px] font-mono text-[#BC5A36]">{promoError}</p>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-[#D9D3C7]/60">
                <div className="flex justify-between text-[#6B5E55]">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-[#2D5A27] font-bold">
                    <span>Discount (15%)</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B5E55]">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#2D231E] pt-2 border-t border-[#D9D3C7]">
                  <span>Estimated Total</span>
                  <span className="text-[#BC5A36] text-base">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedCheckout}
                disabled={isCheckingOut}
                className="w-full py-3.5 bg-[#BC5A36] hover:bg-[#9E4423] disabled:opacity-50 text-white font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isCheckingOut ? 'PROCESSING ORDER...' : 'PROCEED TO CHECKOUT'}</span>
                {!isCheckingOut && <ArrowRight size={15} />}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono text-[#6B5E55]">
                <ShieldCheck size={12} className="text-[#2D5A27]" />
                <span>256-BIT ENCRYPTED SECURE CHECKOUT</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
