import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles } from 'lucide-react';

export default function StreetFavorites({ onAddToCart, onQuickView }) {
  const scrollRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('ALL');

  // 8 High-Fashion Products sourced directly from frontend/public/images/products
  const products = [
    {
      id: 'SF-01',
      name: 'MatchA Heavyweight Sweatshirt',
      price: '$49.99',
      priceNum: 49.99,
      tag: 'Best Seller',
      image: '/images/products/standalone/mustard_sweater.jpg',
      category: 'Tops',
      color: 'Emerald & Sage',
    },
    {
      id: 'SF-02',
      name: 'Artisan Silk Scarf & Bandana',
      price: '$29.99',
      priceNum: 29.99,
      tag: 'Best Seller',
      image: '/images/products/standalone/silk_scarf.jpg',
      category: 'Accessories',
      color: 'Olive Camo',
    },
    {
      id: 'SF-03',
      name: 'Wide Leg Balloon Jeans',
      price: '$69.99',
      priceNum: 69.99,
      tag: 'Best Seller',
      image: '/images/products/winter/bottoms/jeans/color_2_cobalt.jpeg',
      category: 'Bottoms',
      color: 'Washed Cobalt',
    },
    {
      id: 'SF-04',
      name: 'Oversized Street Hoodie Tee',
      price: '$39.99',
      priceNum: 39.99,
      tag: 'Best Seller',
      image: '/images/products/winter/tops/hoodies/color_1_charcoal.jpeg',
      category: 'Tops',
      color: 'Midnight Charcoal',
    },
    {
      id: 'SF-05',
      name: 'Forest Relaxed Bermuda Shorts',
      price: '$45.99',
      priceNum: 45.99,
      tag: 'Best Seller',
      image: '/images/products/summer/bottoms/shorts/color_4_teal.jpeg',
      category: 'Bottoms',
      color: 'Matcha Forest',
    },
    {
      id: 'SF-06',
      name: 'Tiered Asymmetrical Skirt',
      price: '$59.99',
      priceNum: 59.99,
      tag: 'Best Seller',
      image: '/images/products/standalone/peach_skirt.jpg',
      category: 'Bottoms',
      color: 'Pure White & Peach',
    },
    {
      id: 'SF-07',
      name: 'Vintage Mockneck Knit Sweater',
      price: '$79.99',
      priceNum: 79.99,
      tag: 'Best Seller',
      image: '/images/products/spring/tops/polo-shirts/color_1_coral.jpeg',
      category: 'Tops',
      color: 'Coral Gold',
    },
    {
      id: 'SF-08',
      name: 'Ceremonial Wool Overcoat',
      price: '$129.99',
      priceNum: 129.99,
      tag: 'Best Seller',
      image: '/images/products/standalone/cobalt_coat.jpg',
      category: 'Outerwear',
      color: 'Deep Cobalt',
    },
  ];

  const categories = [
    { key: 'ALL', label: 'ALL DROPS' },
    { key: 'Tops', label: 'TOPS & KNIT' },
    { key: 'Bottoms', label: 'BOTTOMS & DENIM' },
    { key: 'Outerwear', label: 'OUTERWEAR' },
    { key: 'Accessories', label: 'ACCESSORIES' },
  ];

  const filteredProducts = activeCategory === 'ALL' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section id="street-favorites" className="w-full bg-[#FAF8F5] text-[#2D231E] py-16 sm:py-24 px-4 sm:px-8 lg:px-12 border-b border-[#D9D3C7] overflow-hidden select-none">
      <div className="max-w-7xl mx-auto">
        
        {/* 1. Header Title & Navigation Controls */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black text-[#BC5A36] tracking-tight font-sans">
              Street Favorites
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={scrollLeft}
              aria-label="Previous Products"
              className="w-10 h-10 border-2 border-[#BC5A36] text-[#BC5A36] hover:bg-[#BC5A36] hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={scrollRight}
              aria-label="Next Products"
              className="w-10 h-10 border-2 border-[#BC5A36] text-[#BC5A36] hover:bg-[#BC5A36] hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* 2. Interactive Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.key
                  ? 'bg-[#BC5A36] text-white shadow-md'
                  : 'bg-white text-[#2D231E] border border-[#D9D3C7] hover:border-[#BC5A36]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 3. Main Framed Carousel Container (Continuous Orange Border + Internal Divider Lines) */}
        <div className="relative border-2 border-[#BC5A36] bg-white shadow-xl overflow-hidden">
          
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-none divide-x-2 divide-[#BC5A36] scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => onQuickView && onQuickView(item)}
                className="w-60 sm:w-72 lg:w-80 shrink-0 p-5 sm:p-6 flex flex-col justify-between hover:bg-[#FAF8F5]/60 transition-colors duration-200 cursor-pointer group relative"
              >
                {/* Top Tag */}
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[11px] font-sans font-medium text-[#BC5A36]">
                    {item.tag}
                  </span>
                  <span className="text-[10px] font-mono text-[#6B5E55] uppercase">
                    {item.category}
                  </span>
                </div>

                {/* Product Image Container with Holographic Glare */}
                <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden mb-4 p-3 bg-[#FAF8F5]/50 holographic-sheen rounded-xs group-hover:bg-[#FAF8F5] transition-colors">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain object-center group-hover:scale-108 transition-transform duration-500 ease-out"
                  />
                </div>

                {/* Solid Orange ADD TO CART Button (Centered under image) */}
                <div className="mb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart && onAddToCart(item);
                    }}
                    className="w-full py-2.5 bg-[#BC5A36] hover:bg-[#9E4423] text-white font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>ADD TO CART</span>
                  </button>
                </div>

                {/* Product Title and Price */}
                <div className="text-center">
                  <h3 className="text-xs sm:text-sm font-medium text-[#BC5A36] line-clamp-2 leading-tight group-hover:text-[#2D231E] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs font-mono font-bold text-[#BC5A36] mt-1.5">
                    {item.price}
                  </p>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
