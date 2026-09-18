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
          <div className="relative mx-auto w-24 h-24 rounded-3xl bg-[#E8EFE9] border border-[#518F5C]/30 flex items-center justify-center text-[#042509] shadow-inner">
            <ShoppingBag size={42} strokeWidth={1.4} className="text-[#042509]" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#042509] text-white flex items-center justify-center text-[10px] font-mono font-bold">
              0
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#518F5C] font-semibold">
              ATELIER ARCHIVE • 空のカート
            </span>
            <h1 className="mt-2 text-3xl sm:text-4xl font-black text-[#111111] tracking-tight font-serif">
              Your Atelier Bag is Empty
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-[#555555] font-light leading-relaxed">
              No garments have been selected yet. Explore our botanical tea-dyed drops and seasonal tailoring to begin your curation.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToStore}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#042509] hover:bg-[#1A381F] text-white text-xs font-mono uppercase tracking-[0.18em] rounded-full shadow-lg shadow-[#042509]/20 transition-all hover:gap-3 active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Explore Collection</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F7F6F2] text-[#111111] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        {/* Editorial Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 mb-8 border-b border-[#E5E2D9]">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.2em] uppercase text-[#518F5C] font-semibold">
              <span>MatchA Atelier</span>
              <span>/</span>
              <span>Shopping Bag</span>
              <span>/</span>
              <span className="text-[#111111]">買い物かご</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-[#111111] tracking-tight mt-1 font-serif">
              Curated Garments
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[#E8EFE9] text-[#042509] text-xs font-mono font-bold tracking-wider border border-[#518F5C]/20">
              {cartItems.length} {cartItems.length === 1 ? 'PIECE' : 'PIECES'} IN BAG
            </span>
          </div>
        </div>

        {/* Free Express Shipping Rail */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E2D9] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono mb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#518F5C]" />
              <span className="font-bold uppercase tracking-wider text-[#042509]">
                {awayFromFreeShipping <= 0 ? (
                  <span className="text-[#256029] font-black">✦ Complimentary Express Delivery Unlocked!</span>
                ) : (
                  <span>
                    Add <strong className="text-[#042509]">${awayFromFreeShipping.toFixed(2)}</strong> more for Free Priority Express
                  </span>
                )}
              </span>
            </div>
            <span className="text-[11px] text-[#666666] font-semibold">{freeShippingProgress}% Reached</span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-2 rounded-full bg-[#EAE7DC] overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-[#042509] via-[#2F5834] to-[#518F5C]"
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
                  className="group relative flex flex-col sm:flex-row gap-5 p-5 sm:p-6 bg-white rounded-3xl border border-[#E5E2D9] shadow-xs hover:border-[#042509]/30 hover:shadow-md transition-all"
                >
                  {/* Thumbnail Image Container */}
                  <div className="w-full sm:w-28 h-40 sm:h-32 rounded-2xl bg-[#F4F3EE] border border-[#E5E2D9] overflow-hidden shrink-0 relative flex items-center justify-center">
                    {item.image ? (
                      <img 
                        src={webpSrc(item.image)} 
                        data-original-src={item.image} 
                        loading="lazy"
                        decoding="async"
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full bg-[#042509] flex flex-col items-center justify-center text-white p-3 text-center">
                        <span className="text-xl mb-1">🍵</span>
                        <span className="text-[8px] font-mono tracking-widest text-[#518F5C] uppercase">{item.id}</span>
                      </div>
                    )}

                    {item.isBundleItem && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-[#042509]/90 text-white backdrop-blur-xs uppercase tracking-wider">
                        −12% Set
                      </span>
                    )}
                  </div>

                  {/* Garment Details & Controls */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#518F5C] font-bold">
                            Natural Dye Edition
                          </span>
                          <h3 className="font-serif font-bold text-base sm:text-lg text-[#111111] leading-tight mt-0.5">
                            {item.name}
                          </h3>
                        </div>

                        {/* Remove Item Button */}
                        <button
                          onClick={() => onRemove(key)}
                          aria-label={`Remove ${item.name}`}
                          title="Remove garment"
                          className="p-2 rounded-full text-[#888888] hover:text-[#C91D1D] hover:bg-[#FBEAEA] transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Swatch & Specifications */}
                      <div className="mt-2.5 flex items-center gap-3 flex-wrap text-xs font-mono text-[#555555]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F4F3EE] border border-[#E5E2D9]">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#042509] inline-block border border-white" />
                          <span>{item.color || 'Artisan Green'}</span>
                        </span>

                        <span className="px-2.5 py-1 rounded-md bg-[#F4F3EE] border border-[#E5E2D9] font-bold text-[#111111]">
                          SIZE: {item.size || 'M'}
                        </span>

                        <span className="text-[#888888]">
                          ${unitPrice.toFixed(2)} / unit
                        </span>
                      </div>
                    </div>

                    {/* Stepper & Line Price */}
                    <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#F4F3EE]">
                      <div className="inline-flex items-center border border-[#D5D2C9] rounded-xl bg-[#F7F6F2] p-1">
                        <button
                          onClick={() => onUpdateQty(key, -1)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center text-sm font-bold text-[#333333] hover:bg-white hover:text-[#042509] rounded-lg cursor-pointer transition-colors shadow-2xs"
                        >
                          −
                        </button>
                        <span className="px-4 text-xs font-mono font-bold text-[#111111]">{qty}</span>
                        <button
                          onClick={() => onUpdateQty(key, 1)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center text-sm font-bold text-[#333333] hover:bg-white hover:text-[#042509] rounded-lg cursor-pointer transition-colors shadow-2xs"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-[#888888] uppercase block">Subtotal</span>
                        <span className="font-mono font-black text-base sm:text-lg text-[#042509]">${lineTotal}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Back to Catalog Navigation */}
            <div className="pt-2">
              <button
                onClick={onBackToStore}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-[0.15em] text-[#042509] hover:text-[#1A381F] bg-white border border-[#E5E2D9] hover:border-[#042509] rounded-xl transition-all active:scale-98 cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Keep Exploring Catalog</span>
              </button>
            </div>
          </div>

          {/* Sticky Atelier Order Summary */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 p-6 sm:p-8 bg-white rounded-3xl border border-[#E5E2D9] shadow-sm space-y-6">
              <div className="border-b border-[#E5E2D9] pb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#518F5C] font-bold">
                    Order Receipt Summary
                  </span>
                  <h3 className="text-xl font-black font-serif text-[#111111] tracking-tight">
                    Estimated Total
                  </h3>
                </div>
                <span className="text-xl">🍵</span>
              </div>

              {/* Price Breakdown */}
              <div className="flex flex-col gap-3.5 text-xs font-mono">
                <div className="flex justify-between text-[#666666]">
                  <span>BAG SUBTOTAL</span>
                  <span className="font-bold text-[#111111]">${subtotal.toFixed(2)}</span>
                </div>

                {bundleSavings > 0 && (
                  <div className="flex justify-between text-[#042509] font-bold p-2.5 rounded-xl bg-[#E8EFE9] border border-[#518F5C]/30">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[#518F5C]" />
                      <span>OUTFIT BUNDLE SAVINGS (−12%)</span>
                    </span>
                    <span>−${bundleSavings.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#666666]">
                  <span>STANDARD ATELIER SHIPPING</span>
                  <span className="font-bold text-[#518F5C] uppercase">COMPLIMENTARY</span>
                </div>

                <div className="flex justify-between text-[#666666]">
                  <span>PRIORITY EXPRESS COURIER</span>
                  <span className="font-bold text-[#111111]">
                    {netSubtotal >= FREE_SHIPPING_THRESHOLD ? (
                      <span className="text-[#518F5C] font-bold">FREE (QUALIFIED)</span>
                    ) : (
                      '$12.00'
                    )}
                  </span>
                </div>
              </div>

              {/* Total Line */}
              <div className="pt-4 border-t border-dashed border-[#D5D2C9] flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#666666] block">Final Total</span>
                  <span className="text-[10px] font-mono text-[#888888]">Taxes & Duties Included</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#042509]">${total.toFixed(2)}</span>
              </div>

              {/* Checkout Action Button */}
              <button
                onClick={onCheckout}
                className="w-full py-4 px-6 bg-[#042509] hover:bg-[#1A381F] text-white font-mono font-bold text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#042509]/25 transition-all flex items-center justify-center gap-3 active:scale-98 cursor-pointer group"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Security & Guarantee Badges */}
              <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-[#666666]">
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#F7F6F2]">
                  <Lock size={12} className="text-[#042509] shrink-0" />
                  <span>256-Bit SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#F7F6F2]">
                  <RefreshCw size={12} className="text-[#042509] shrink-0" />
                  <span>30-Day Free Returns</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
