import React from 'react';
import useChangeMotion from '../hooks/useChangeMotion';
import { Trash2, ArrowLeft, ArrowRight, Lock, Sparkles, RefreshCw, ShoppingBag } from 'lucide-react';
import { webpSrc } from '../utils/imageFallback';
import { shippingCostFor, FREE_SHIPPING_THRESHOLD } from '../config/shipping';

const parsePrice = (price) => parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
const getCartKey = (item) => `${item.id}-${item.size || 'default'}-${item.color || 'default'}`;

export default function CartPage({ cartItems = [], onUpdateQty, onRemove, onBackToStore, onCheckout }) {
  const cartMotionRef = useChangeMotion(cartItems.map(item => `${getCartKey(item)}:${item.quantity}`).join('|'), 'outfit');
  const subtotal = cartItems.reduce((sum, item) => sum + parsePrice(item.price) * (item.quantity || 1), 0);
  
  // Calculate bundle savings if bundle pieces are in the cart
  const bundleItems = cartItems.filter(item => item.isBundleItem);
  const bundleSavings = bundleItems.length >= 2 
    ? bundleItems.reduce((sum, item) => sum + parsePrice(item.price) * (item.quantity || 1) * (item.bundleDiscountRate || 0.12), 0)
    : 0;
  const netSubtotal = Math.max(0, subtotal - bundleSavings);
  const shipping = cartItems.length === 0 ? 0 : shippingCostFor(netSubtotal);
  const total = netSubtotal + shipping;
  const awayFromFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - netSubtotal);
  const freeShippingProgress = Math.min(100, Math.round((netSubtotal / FREE_SHIPPING_THRESHOLD) * 100));

  if (cartItems.length === 0) {
    return (
      <div className="w-full min-h-[75vh] bg-[#F7F6F2] flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-[#E8EFE9] border border-[#518F5C]/25 flex items-center justify-center text-[#042509]">
            <ShoppingBag size={34} strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-bold text-[#111111] tracking-tight">
              Your bag is empty
            </h1>
            <p className="text-sm text-[#555555] font-light leading-relaxed max-w-xs mx-auto">
              Explore our botanical tea-dyed drops and seasonal tailoring to begin your collection.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToStore}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#042509] hover:bg-[#1A381F] text-white text-xs font-mono uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Explore collection</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F7F6F2] text-[#111111] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        {/* Quiet, intentional header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-6 mb-8 border-b border-[#E5E2D9]">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#111111] tracking-tight">
              Shopping Bag
            </h1>
            <span className="text-sm font-mono text-[#666666]">
              ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </span>
          </div>
          <button
            onClick={onBackToStore}
            className="text-xs font-mono text-[#042509] hover:underline self-start sm:self-auto cursor-pointer"
          >
            ← Continue shopping
          </button>
        </div>

        {/* Free Express Shipping Rail — purposeful single visual meter */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E2D9] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono mb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#518F5C]" />
              <span className="text-[#111111]">
                {awayFromFreeShipping <= 0 ? (
                  <strong className="text-[#042509]">You have unlocked free express delivery</strong>
                ) : (
                  <span>
                    Add <strong className="text-[#042509]">${awayFromFreeShipping.toFixed(2)}</strong> more for free express delivery
                  </span>
                )}
              </span>
            </div>
            <span className="text-[11px] text-[#777777]">{freeShippingProgress}% reached</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#EAE7DC] overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out bg-[#042509]"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* Cart Items List */}
          <div ref={cartMotionRef} className="lg:col-span-7 flex flex-col gap-4">
            {cartItems.map((item) => {
              const key = getCartKey(item);
              const qty = item.quantity || 1;
              const unitPrice = parsePrice(item.price);
              const lineTotal = (unitPrice * qty).toFixed(2);
              
              return (
                <div
                  key={key}
                  data-motion-slot={key}
                  data-motion-item={`${key}:${item.quantity}`}
                  className="flex flex-col sm:flex-row gap-5 p-5 bg-white rounded-2xl border border-[#E5E2D9] shadow-xs transition-shadow hover:shadow-sm"
                >
                  {/* Thumbnail Image */}
                  <div className="w-full sm:w-28 h-36 sm:h-32 rounded-xl bg-[#F4F3EE] border border-[#E5E2D9] overflow-hidden shrink-0 relative flex items-center justify-center">
                    {item.image ? (
                      <img 
                        src={webpSrc(item.image)} 
                        data-original-src={item.image} 
                        loading="lazy"
                        decoding="async"
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-[#042509] flex flex-col items-center justify-center text-white p-3 text-center">
                        <span className="text-xl mb-1">🍵</span>
                        <span className="text-[8px] font-mono tracking-widest text-[#518F5C] uppercase">{item.id}</span>
                      </div>
                    )}

                    {item.isBundleItem && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-[#042509] text-white">
                        −12% Set
                      </span>
                    )}
                  </div>

                  {/* Garment Details & Controls */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-serif font-bold text-base sm:text-lg text-[#111111] leading-snug">
                          {item.name}
                        </h2>

                        <button
                          onClick={() => onRemove(key)}
                          aria-label={`Remove ${item.name}`}
                          title="Remove item"
                          className="p-1.5 rounded-lg text-[#888888] hover:text-[#C91D1D] hover:bg-[#FBEAEA] transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Swatch & Specifications */}
                      <div className="mt-2 flex items-center gap-3 text-xs font-mono text-[#666666]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#042509] inline-block border border-white" />
                          <span>{item.color || 'Natural'}</span>
                        </span>
                        <span>•</span>
                        <span>Size {item.size || 'M'}</span>
                        <span>•</span>
                        <span>${unitPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Stepper & Line Price */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F4F3EE]">
                      <div className="inline-flex items-center border border-[#D5D2C9] rounded-lg bg-[#F7F6F2] p-0.5">
                        <button
                          onClick={() => onUpdateQty(key, -1)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center text-sm font-bold text-[#444444] hover:bg-white rounded cursor-pointer transition-colors"
                        >
                          −
                        </button>
                        <span className="px-3 text-xs font-mono font-bold text-[#111111]">{qty}</span>
                        <button
                          onClick={() => onUpdateQty(key, 1)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center text-sm font-bold text-[#444444] hover:bg-white rounded cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right font-mono font-bold text-base text-[#042509]">
                        ${lineTotal}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 p-6 bg-white rounded-2xl border border-[#E5E2D9] shadow-xs space-y-6">
              <h2 className="text-lg font-serif font-bold text-[#111111] tracking-tight pb-3 border-b border-[#E5E2D9]">
                Order Summary
              </h2>

              <div className="flex flex-col gap-3 text-xs font-mono">
                <div className="flex justify-between text-[#666666]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#111111]">${subtotal.toFixed(2)}</span>
                </div>

                {bundleSavings > 0 && (
                  <div className="flex justify-between text-[#042509] font-bold p-2.5 rounded-lg bg-[#E8EFE9]">
                    <span>Outfit bundle savings (−12%)</span>
                    <span>−${bundleSavings.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#666666]">
                  <span>Standard delivery</span>
                  <span className="font-bold text-[#518F5C]">Free</span>
                </div>

                <div className="flex justify-between text-[#666666]">
                  <span>Priority express delivery</span>
                  <span className="font-bold text-[#111111]">
                    {netSubtotal >= FREE_SHIPPING_THRESHOLD ? (
                      <span className="text-[#518F5C]">Free (Qualified)</span>
                    ) : (
                      '$12.00'
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-[#D5D2C9] flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-mono text-[#666666] block">Total</span>
                  <span className="text-[10px] font-mono text-[#888888]">Taxes included</span>
                </div>
                <span className="text-2xl font-bold font-mono text-[#042509]">${total.toFixed(2)}</span>
              </div>

              <button
                onClick={onCheckout}
                className="w-full py-3.5 px-6 bg-[#042509] hover:bg-[#1A381F] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <span>Proceed to checkout</span>
                <ArrowRight size={14} />
              </button>

              <div className="pt-1 flex items-center justify-center gap-4 text-[11px] font-mono text-[#777777]">
                <span className="inline-flex items-center gap-1">
                  <Lock size={12} className="text-[#042509]" />
                  <span>Encrypted checkout</span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <RefreshCw size={12} className="text-[#042509]" />
                  <span>30-day returns</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
