import React from 'react';
import useChangeMotion from '../hooks/useChangeMotion';
import { Trash2, ArrowLeft, Lock } from 'lucide-react';
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

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div data-enter className="w-24 h-24 mx-auto rounded-3xl bg-[#518F5C]/60 border border-[#3E7047] flex items-center justify-center text-5xl shadow-md">
          🛒
        </div>
        <h1 data-enter="wipe" style={{ '--enter-delay': '90ms' }} className="mt-8 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#000000]">
          Your cart is empty
        </h1>
        <p data-enter style={{ '--enter-delay': '190ms' }} className="mt-3 text-sm font-mono text-[#666666]">
          Looks like you haven't dropped anything in yet.
        </p>
        <button
          onClick={onBackToStore}
          data-enter style={{ '--enter-delay': '290ms' }}
          className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 bg-[#042509] hover:bg-[#021505] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Continue Shopping</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F1F1F1]">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-10">
          <div>
            <span data-enter className="text-xs uppercase tracking-widest text-[#042509] font-bold font-mono">Your Selection</span>
            <h1 data-enter="wipe" style={{ '--enter-delay': '90ms' }} className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight mt-1">
              Shopping cart
            </h1>
          </div>
          <p data-enter style={{ '--enter-delay': '190ms' }} className="text-xs text-[#666666] font-mono">
            {cartItems.length} {cartItems.length === 1 ? 'style' : 'styles'} in your bag
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Cart Items List */}
          <div ref={cartMotionRef} className="lg:col-span-7 flex flex-col gap-4">
            {cartItems.map((item, index) => {
              const key = getCartKey(item);
              const qty = item.quantity || 1;
              const lineTotal = (parsePrice(item.price) * qty).toFixed(2);
              return (
                <div
                  key={key}
                  data-motion-slot={key} data-motion-item={`${key}:${item.quantity}`}
                  data-enter style={{ '--enter-delay': `${Math.min(index * 60, 300)}ms` }}
                  className="flex gap-4 p-5 bg-white rounded-3xl border border-[#DCDCDC] shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#F1F1F1] border border-[#DCDCDC] flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
                    {item.image ? (
                      <img 
                        src={webpSrc(item.image)} data-original-src={item.image} 
                        loading="lazy"
                        decoding="async"
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-[#042509] flex flex-col items-center justify-center text-white">
                        <span className="text-2xl">🍵</span>
                        <span className="text-[9px] font-mono tracking-widest text-[#518F5C] mt-0.5">{item.id}</span>
                      </div>
                    )}
                  </div>

                  {/* Info & Controls */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-[#000000] truncate">{item.name}</h3>
                          {item.isBundleItem && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#042509] text-white uppercase">
                              Bundle Item (−12%)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-[#666666] mt-0.5 uppercase tracking-wider">
                          {item.size || 'One Size'} / {item.color || 'Matcha Green'}
                        </p>
                        <p className="text-xs font-bold text-[#C91D1D] mt-1">${parsePrice(item.price).toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => onRemove(key)}
                        aria-label={`Remove ${item.name}`}
                        title="Remove item"
                        className="p-2 rounded-xl text-[#666666] hover:text-white hover:bg-[#C91D1D] transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-end justify-between mt-4">
                      {/* Quantity Counter */}
                      <div className="inline-flex items-center border border-[#DCDCDC] rounded-xl bg-[#F1F1F1] p-1">
                        <button
                          onClick={() => onUpdateQty(key, -1)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center text-sm font-bold hover:bg-[#518F5C] rounded-lg cursor-pointer transition-colors"
                        >
                          −
                        </button>
                        <span className="px-4 text-xs font-mono font-bold text-[#000000]">{qty}</span>
                        <button
                          onClick={() => onUpdateQty(key, 1)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center text-sm font-bold hover:bg-[#518F5C] rounded-lg cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-mono font-extrabold text-sm text-[#000000]">${lineTotal}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Continue Shopping */}
            <button
              onClick={onBackToStore}
              className="self-start inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-transparent border border-[#DCDCDC] hover:border-[#042509] text-[#000000] hover:text-[#042509] text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Keep Browsing</span>
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32 p-6 sm:p-7 bg-white rounded-3xl border border-[#DCDCDC] shadow-md h-fit">
              <h3 className="text-lg font-extrabold text-[#000000] tracking-tight">Order Summary</h3>

              <div className="mt-5 flex flex-col gap-3 text-xs font-mono">
                <div className="flex justify-between text-[#666666]">
                  <span>SUBTOTAL</span>
                  <span className="font-bold text-[#000000]">${subtotal.toFixed(2)}</span>
                </div>

                {bundleSavings > 0 && (
                  <div className="flex justify-between text-[#042509] font-bold">
                    <span>OUTFIT BUNDLE SAVINGS (−12%)</span>
                    <span>−${bundleSavings.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#666666]">
                  <span>STANDARD SHIPPING (3-5 DAYS)</span>
                  <span className="font-bold text-[#042509] uppercase">FREE</span>
                </div>

                <div className="flex justify-between text-[#666666]">
                  <span>EXPRESS SHIPPING (1-2 DAYS)</span>
                  <span className="font-bold text-[#000000]">
                    {netSubtotal >= FREE_SHIPPING_THRESHOLD ? 'FREE (QUALIFIED)' : '$12.00'}
                  </span>
                </div>
              </div>

              {awayFromFreeShipping > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-[#518F5C]/15 border border-[#518F5C]/40 text-[#042509]">
                  <p className="text-[11px] font-mono font-bold leading-relaxed flex items-center gap-1.5">
                    <span className="text-sm">✦</span>
                    <span>ซื้อเพิ่มอีก ${awayFromFreeShipping.toFixed(2)} เพื่อรับสิทธิ์ส่งด่วนฟรี (FREE Express Delivery)!</span>
                  </p>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-dashed border-[#DCDCDC] flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-[#000000]">Total</span>
                <span className="text-xl font-extrabold text-[#042509] font-mono">${total.toFixed(2)}</span>
              </div>

              <button
                onClick={onCheckout}
                className="mt-6 w-full py-4 bg-[#C91D1D] hover:bg-[#A81515] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#C91D1D]/30 active:scale-95 cursor-pointer"
              >
                Checkout → ${total.toFixed(2)}
              </button>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#666666] uppercase tracking-wider">
                <Lock size={11} />
                Secure checkout • Free returns within 30 days
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
