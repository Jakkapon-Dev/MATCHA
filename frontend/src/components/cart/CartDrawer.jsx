import React from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer({ isOpen, onClose }) {
  // CartContext owns item persistence, quantity rules, backend synchronization, and
  // all monetary calculations; this drawer only presents and triggers those actions.
  const { cartItems, updateQty, removeItem, subtotal, shipping, total, getCartKey } = useCart();
  const navigate = useNavigate();

  // A closed drawer is removed from the DOM so its overlay cannot block the page.
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F1F1F1] border-l border-[#DCDCDC] flex flex-col shadow-2xl animate-slide-left">
          
          {/* Header */}
          <div className="p-6 bg-white border-b border-[#DCDCDC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#000000]" />
              <h2 className="font-serif text-lg font-bold text-[#000000]">Your Artisan Bag</h2>
              <span className="text-xs font-mono bg-[#F1F1F1] text-[#000000] px-2 py-0.5 rounded-full font-bold border border-[#DCDCDC]">
                {/* Counts distinct product variants, not the sum of their quantities. */}
                {cartItems.length}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F1F1F1] border border-[#DCDCDC] flex items-center justify-center text-[#666666] hover:text-[#000000] transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Empty-cart navigation closes the overlay before changing routes. */}
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <ShoppingBag size={48} className="mx-auto text-[#DCDCDC]" />
                <p className="font-serif text-base text-[#666666]">Your cart is empty.</p>
                <button
                  onClick={() => { onClose(); navigate('/catalog'); }}
                  className="px-5 py-2 rounded-full bg-[#000000] text-white text-xs font-mono font-bold uppercase transition-all hover:bg-black/80 cursor-pointer"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cartItems.map((item) => {
                // The composite key includes product, size, and color so variants of
                // the same product remain separate cart rows and update independently.
                const key = getCartKey(item);
                return (
                  <div key={key} className="p-3.5 bg-white rounded-2xl border border-[#DCDCDC] flex gap-3.5 items-center">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-20 object-contain bg-[#F1F1F1] rounded-xl border border-[#DCDCDC]" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-sm font-bold text-[#000000] truncate">{item.name}</h4>
                      <p className="text-xs font-mono text-[#666666] mt-0.5">
                        {item.size || 'M'} · {item.color || 'Signature'}
                      </p>
                      <p className="text-xs font-mono font-bold text-[#000000] mt-1">
                        ${Number(item.price).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-[#DCDCDC] rounded-full bg-[#F1F1F1] px-1.5 py-0.5">
                        {/* CartContext clamps decrements at one; deletion is explicit. */}
                        <button 
                          onClick={() => updateQty(key, -1)}
                          className="w-5 h-5 flex items-center justify-center text-[#666666] hover:text-[#000000] cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-mono text-xs font-bold px-2 text-[#000000]">{item.quantity}</span>
                        <button 
                          onClick={() => updateQty(key, 1)}
                          className="w-5 h-5 flex items-center justify-center text-[#666666] hover:text-[#000000] cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(key)}
                        className="w-7 h-7 flex items-center justify-center text-[#666666] hover:text-[#C91D1D] transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {/* Totals are precomputed by CartContext and hidden for an empty cart. */}
          {cartItems.length > 0 && (
            <div className="p-6 bg-white border-t border-[#DCDCDC] space-y-4">
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[#666666]">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#666666]">
                  <span>Estimated Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#000000] pt-2 border-t border-[#DCDCDC]">
                  <span>Total</span>
                  <span className="text-[#000000]">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Close first so the drawer does not remain open on the destination. */}
                <button
                  onClick={() => { onClose(); navigate('/cart'); }}
                  className="py-3 rounded-xl border border-[#DCDCDC] bg-white text-[#000000] font-mono text-xs font-bold uppercase transition-all hover:bg-[#F1F1F1] cursor-pointer text-center"
                >
                  View Bag
                </button>
                <button
                  onClick={() => { onClose(); navigate('/payment'); }}
                  className="py-3 rounded-xl bg-[#000000] hover:bg-black/80 text-white font-mono text-xs font-bold uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Checkout</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
