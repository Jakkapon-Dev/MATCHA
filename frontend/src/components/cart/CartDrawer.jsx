import React from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer({ isOpen, onClose }) {
  const { cartItems, updateQty, removeItem, subtotal, shipping, total, getCartKey } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] border-l border-[#D9D3C7] flex flex-col shadow-2xl animate-slide-left">
          
          {/* Header */}
          <div className="p-6 bg-white border-b border-[#D9D3C7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#2D5A27]" />
              <h2 className="font-serif text-lg font-bold text-[#2D231E]">Your Artisan Bag</h2>
              <span className="text-xs font-mono bg-[#E2ECE9] text-[#2D5A27] px-2 py-0.5 rounded-full font-bold">
                {cartItems.length}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#D9D3C7] flex items-center justify-center text-[#6B5E55] hover:text-[#2D231E] transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <ShoppingBag size={48} className="mx-auto text-[#D9D3C7]" />
                <p className="font-serif text-base text-[#6B5E55]">Your cart is empty.</p>
                <button
                  onClick={() => { onClose(); navigate('/catalog'); }}
                  className="px-5 py-2 rounded-full bg-[#2D5A27] text-white text-xs font-mono font-bold uppercase transition-all hover:bg-[#1E3D1A] cursor-pointer"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cartItems.map((item) => {
                const key = getCartKey(item);
                return (
                  <div key={key} className="p-3.5 bg-white rounded-2xl border border-[#D9D3C7] flex gap-3.5 items-center">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-20 object-contain bg-[#FAF8F5] rounded-xl border border-[#D9D3C7]/60" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-sm font-bold text-[#2D231E] truncate">{item.name}</h4>
                      <p className="text-xs font-mono text-[#6B5E55] mt-0.5">
                        {item.size || 'M'} · {item.color || 'Signature'}
                      </p>
                      <p className="text-xs font-mono font-bold text-[#2D5A27] mt-1">
                        ${Number(item.price).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-[#D9D3C7] rounded-full bg-[#FAF8F5] px-1.5 py-0.5">
                        <button 
                          onClick={() => updateQty(key, -1)}
                          className="w-5 h-5 flex items-center justify-center text-[#6B5E55] hover:text-[#2D231E] cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-mono text-xs font-bold px-2">{item.quantity}</span>
                        <button 
                          onClick={() => updateQty(key, 1)}
                          className="w-5 h-5 flex items-center justify-center text-[#6B5E55] hover:text-[#2D231E] cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(key)}
                        className="w-7 h-7 flex items-center justify-center text-[#6B5E55] hover:text-rose-600 transition-colors cursor-pointer"
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
          {cartItems.length > 0 && (
            <div className="p-6 bg-white border-t border-[#D9D3C7] space-y-4">
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[#6B5E55]">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6B5E55]">
                  <span>Estimated Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#2D231E] pt-2 border-t border-[#D9D3C7]">
                  <span>Total</span>
                  <span className="text-[#2D5A27]">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { onClose(); navigate('/cart'); }}
                  className="py-3 rounded-xl border border-[#D9D3C7] bg-[#FAF8F5] text-[#2D231E] font-mono text-xs font-bold uppercase transition-all hover:bg-[#EAE6DF] cursor-pointer text-center"
                >
                  View Bag
                </button>
                <button
                  onClick={() => { onClose(); navigate('/payment'); }}
                  className="py-3 rounded-xl bg-[#2D5A27] hover:bg-[#1E3D1A] text-white font-mono text-xs font-bold uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
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
