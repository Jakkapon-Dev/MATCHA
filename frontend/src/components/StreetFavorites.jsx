import React from 'react';

export default function StreetFavorites({ onAddToCart, onQuickView }) {

  const products = [
    { id: 'SF-01', name: 'Ceremonial Oversized Tee', price: '$49.00', tag: 'Best Seller', color: 'bg-[#2D5A27]' },
    { id: 'SF-02', name: 'Urban MatchA Hoodie', price: '$89.00', tag: 'New Drop', color: 'bg-[#2D5A27]' },
    { id: 'SF-03', name: 'Artisan Relaxed Trousers', price: '$79.00', tag: 'Popular', color: 'bg-[#2D5A27]' }
  ];

  const marqueeText = [
    'NEW ARRIVALS ✦ FREE EXPRESS SHIPPING ON ORDERS OVER $100 ✦ MATCHA STREETWEAR ✦ LIMITED QUANTITY DROP ✦ ',
    'BUY 2 GET 15% OFF TOTAL ✦ EXPRESS YOUR AUTHENTIC STYLE ✦ 2026 EDITION ✦ '
  ].join('');

  return (
    <section className="w-full bg-[#D0DEC6]/40 text-[#2D231E] py-20 border-b border-[#D9D3C7] overflow-hidden">
      
      {/* Frame 7 Header */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 mb-12 flex flex-col sm:flex-row items-start sm:items-end justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#2D5A27] font-bold">Trending Collection</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#2D231E] tracking-tight mt-1">
            Street favorites
          </h2>
        </div>
        <p className="text-xs text-[#6B5E55] font-mono mt-2 sm:mt-0">
          Handpicked top performers loved by our community.
        </p>
      </div>

      {/* Product Cards Grid matching Frame 7 Wireframe */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {products.map((item) => (
          <div 
            key={item.id}
            onClick={() => onQuickView(item)}
            className="p-6 bg-[#FAF8F5] rounded-3xl border border-[#D9D3C7] shadow-md flex flex-col justify-between hover:border-[#2D5A27] transition-all hover:shadow-xl group cursor-pointer"
          >
            <div>
              {/* Product Image Box */}
              <div className={`w-full aspect-square ${item.color} rounded-2xl shadow-lg flex flex-col items-center justify-center text-white relative overflow-hidden group-hover:bg-[#23471E] transition-colors`}>
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/40 backdrop-blur-md text-white text-[10px] font-mono font-bold rounded-full">
                  {item.tag}
                </span>
                <span className="text-5xl mb-2 group-hover:scale-125 transition-transform duration-300">🍵</span>
                <span className="text-xs font-mono font-bold tracking-widest text-[#D0DEC6]">{item.id}</span>
                <span className="absolute bottom-3 text-[10px] font-mono font-semibold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to Customize →
                </span>
              </div>

              <div className="mt-5">
                <h3 className="text-lg font-bold text-[#2D231E] group-hover:text-[#2D5A27] transition-colors">
                  {item.name}
                </h3>
                <p className="text-sm font-bold text-[#BC5A36] mt-1">{item.price}</p>
              </div>
            </div>

            {/* Add to Cart Button (Accent Color CTA) */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(item);
                }}
                className="flex-1 py-3 bg-[#BC5A36] hover:bg-[#A64C2B] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Add to cart 🛍️
              </button>
            </div>
          </div>
        ))}
      </div>


      {/* Marquee Ticker Bar */}
      <div className="w-full bg-[#2D231E] text-white py-3.5 border-y border-[#3D312A] relative flex overflow-hidden">
        <div className="animate-marquee text-xs font-bold font-mono tracking-widest uppercase text-[#D0DEC6]">
          <span className="mr-8 text-[#BC5A36]">{marqueeText}</span>
          <span className="mr-8 text-[#BC5A36]">{marqueeText}</span>
        </div>
      </div>

    </section>
  );
}
