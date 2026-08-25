import React from 'react';
import { Trash2, ArrowLeft, Lock } from 'lucide-react';

const parsePrice = (price) => parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;

const getCartKey = (item) => `${item.id}-${item.size || 'default'}-${item.color || 'default'}`;

export default function CartPage({ cartItems = [], onUpdateQty, onRemove, onBackToStore, onCheckout }) {
  const subtotal = cartItems.reduce((sum, item) => sum + parsePrice(item.price) * (item.quantity || 1), 0);
  const shipping = cartItems.length === 0 || subtotal >= 100 ? 0 : 10;
  const total = subtotal + shipping;
  const awayFromFreeShipping = Math.max(0, 100 - subtotal);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-[#D0DEC6]/60 border border-[#B8CBAE] flex items-center justify-center text-5xl shadow-md">
          🛒
        </div>
        <h1 className="mt-8 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2D231E]">
          Your cart is empty
        </h1>
        <p className="mt-3 text-sm font-mono text-[#6B5E55]">
          Looks like you haven't dropped anything in yet.
        </p>
        <button
          onClick={onBackToStore}
          className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Continue Shopping</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF8F5]">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#2D5A27] font-bold font-mono">Your Selection</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#2D231E] tracking-tight mt-1">
              Shopping cart
            </h1>
          </div>
          <p className="text-xs text-[#6B5E55] font-mono">
            {cartItems.length} {cartItems.length === 1 ? 'style' : 'styles'} in your bag
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Cart Items List */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {cartItems.map((item) => {
              const key = getCartKey(item);
              const qty = item.quantity || 1;
              const lineTotal = (parsePrice(item.price) * qty).toFixed(2);
              return (
                <div
                  key={key}
                  className="flex gap-4 p-5 bg-white rounded-3xl border border-[#D9D3C7] shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#2D5A27] flex flex-col items-center justify-center text-white shrink-0 overflow-hidden relative">
                    <span className="text-3xl">🍵</span>
                    <span className="text-[9px] font-mono tracking-widest text-[#D0DEC6] mt-1">{item.id}</span>
                  </div>

                  {/* Info & Controls */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-[#2D231E] truncate">{item.name}</h3>
                        <p className="text-[11px] font-mono text-[#6B5E55] mt-0.5 uppercase tracking-wider">
                          {item.size || 'One Size'} / {item.color || 'Matcha Green'}
                        </p>
                        <p className="text-xs font-bold text-[#BC5A36] mt-1">{item.price}</p>
                      </div>
                      <button
                        onClick={() => onRemove(key)}
                        aria-label={`Remove ${item.name}`}
                        title="Remove item"
                        className="p-2 rounded-xl text-[#6B5E55] hover:text-white hover:bg-[#BC5A36] transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-end justify-between mt-4">
                      {/* Quantity Counter */}
                      <div className="inline-flex items-center border border-[#D9D3C7] rounded-xl bg-[#FAF8F5] p-1">
                        <button
                          onClick={() => onUpdateQty(key, -1)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center text-sm font-bold hover:bg-[#D0DEC6] rounded-lg cursor-pointer transition-colors"
                        >
                          −
                        </button>
                        <span className="px-4 text-xs font-mono font-bold text-[#2D231E]">{qty}</span>
                        <button
                          onClick={() => onUpdateQty(key, 1)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center text-sm font-bold hover:bg-[#D0DEC6] rounded-lg cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-mono font-extrabold text-sm text-[#2D231E]">${lineTotal}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Continue Shopping */}
            <button
              onClick={onBackToStore}
              className="self-start inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-transparent border border-[#D9D3C7] hover:border-[#2D5A27] text-[#2D231E] hover:text-[#2D5A27] text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Keep Browsing</span>
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32 p-6 sm:p-7 bg-white rounded-3xl border border-[#D9D3C7] shadow-md h-fit">
              <h3 className="text-lg font-extrabold text-[#2D231E] tracking-tight">Order Summary</h3>

              <div className="mt-5 flex flex-col gap-3 text-xs font-mono">
                <div className="flex justify-between text-[#6B5E55]">
                  <span>SUBTOTAL</span>
                  <span className="font-bold text-[#2D231E]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6B5E55]">
                  <span>SHIPPING</span>
                  {shipping === 0 ? (
                    <span className="font-bold text-[#2D5A27] uppercase">FREE</span>
                  ) : (
                    <span className="font-bold text-[#2D231E]">${shipping.toFixed(2)}</span>
                  )}
                </div>
              </div>

              {shipping > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-[#BC5A36]/10 border border-[#BC5A36]/30">
                  <p className="text-[11px] font-mono text-[#BC5A36] font-bold leading-relaxed">
                    ✦ Add ${awayFromFreeShipping.toFixed(2)} more to unlock FREE express shipping!
                  </p>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-dashed border-[#D9D3C7] flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-[#2D231E]">Total</span>
                <span className="text-xl font-extrabold text-[#2D5A27] font-mono">${total.toFixed(2)}</span>
              </div>

              <button
                onClick={onCheckout}
                className="mt-6 w-full py-4 bg-[#BC5A36] hover:bg-[#A64C2B] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#BC5A36]/30 active:scale-95 cursor-pointer"
              >
                Checkout → ${total.toFixed(2)}
              </button>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#6B5E55] uppercase tracking-wider">
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
