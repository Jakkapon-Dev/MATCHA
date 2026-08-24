import React, { useState } from 'react';

export default function ProductModal({ product, onClose, onAddToCart }) {
  const [selectedColor, setSelectedColor] = useState('Matcha Green');
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const colors = [
    { name: 'Matcha Green', hex: '#2D5A27' },
    { name: 'Warm Terracotta', hex: '#BC5A36' },
    { name: 'Soft Sage', hex: '#D0DEC6' },
    { name: 'Espresso Roast', hex: '#2D231E' },
  ];

  const sizes = ['S', 'M', 'L', 'XL', 'Oversized'];

  const handleAdd = () => {
    onAddToCart({
      ...product,
      color: selectedColor,
      size: selectedSize,
      quantity
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-[#FAF8F5] text-[#2D231E] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#D9D3C7] relative animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#D0DEC6] hover:bg-[#BC5A36] hover:text-white flex items-center justify-center text-xs font-bold text-[#2D231E] transition-all cursor-pointer"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-12">
          
          {/* Image & Swatch Preview Left */}
          <div className="sm:col-span-5 bg-[#2D231E] p-8 flex flex-col justify-between text-white relative min-h-[300px]">
            <div className="z-10">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D0DEC6] font-mono">
                {product.tag || 'LIMITED RELEASE'}
              </span>
              <h3 className="text-2xl font-bold mt-1 leading-tight text-[#FAF8F5]">{product.name}</h3>
              <p className="text-sm font-mono text-[#BC5A36] font-bold mt-1">{product.price || '$69.00'}</p>
            </div>

            {/* Visual Color Preview Box */}
            <div className="my-6 flex flex-col items-center justify-center py-8 rounded-2xl bg-[#1A1512] border border-[#3D312A] relative group">
              <div 
                className="w-24 h-24 rounded-2xl shadow-xl transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center text-3xl"
                style={{ backgroundColor: colors.find(c => c.name === selectedColor)?.hex || '#2D5A27' }}
              >
                👕
              </div>
              <span className="text-xs font-mono text-[#D0DEC6] mt-3">Tone: {selectedColor}</span>
            </div>

            <div className="text-[10px] text-[#D0DEC6]/70 font-mono">
              <span>MATCHA ARCHIVE • 2026</span>
            </div>
          </div>

          {/* Configuration Right */}
          <div className="sm:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#2D5A27] uppercase tracking-widest">Personalize Fit & Tone</span>
              <h4 className="text-xl font-extrabold text-[#2D231E] mt-1">Select Custom Options</h4>
              
              {/* Color Swatch Picker */}
              <div className="mt-5">
                <label className="text-xs font-bold text-[#2D231E] uppercase tracking-wider block mb-2">
                  MatchA Undertone Palette:
                </label>
                <div className="flex items-center gap-3">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      title={c.name}
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                        selectedColor === c.name ? 'border-[#2D5A27] scale-110 shadow-md ring-2 ring-[#2D5A27]/30' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div className="mt-5">
                <label className="text-xs font-bold text-[#2D231E] uppercase tracking-wider block mb-2">
                  Choose Fit Size:
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                        selectedSize === s 
                          ? 'bg-[#2D5A27] text-white border-[#2D5A27] shadow-md' 
                          : 'bg-white text-[#2D231E] border-[#D9D3C7] hover:border-[#2D5A27]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="mt-5">
                <label className="text-xs font-bold text-[#2D231E] uppercase tracking-wider block mb-2">
                  Quantity:
                </label>
                <div className="inline-flex items-center border border-[#D9D3C7] rounded-xl bg-white p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-[#D0DEC6] rounded-lg cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-mono font-bold text-[#2D231E]">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-[#D0DEC6] rounded-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons (Accent Color CTA) */}
            <div className="mt-8 pt-4 border-t border-[#D9D3C7] flex items-center gap-3">
              <button
                onClick={handleAdd}
                className="flex-1 py-3.5 bg-[#BC5A36] hover:bg-[#A64C2B] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#BC5A36]/30 active:scale-95 cursor-pointer"
              >
                Add To Cart • {selectedSize} / {selectedColor} →
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
