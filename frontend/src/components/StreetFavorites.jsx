import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles } from 'lucide-react';
import SpotlightCard from './SpotlightCard';

export default function StreetFavorites({ onAddToCart, onQuickView, onExploreCatalog }) {
  const scrollRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Complete, Rich High-Fashion Product Catalog across all categories
  const products = [
    // --- TOPS & KNIT (6 items) ---
    {
      id: 'SF-TOP-01',
      name: 'MatchA Heavyweight Sweatshirt',
      price: '$49.99',
      priceNum: 49.99,
      tag: 'Best Seller',
      image: '/images/products/standalone/mustard_sweater.jpg',
      category: 'Tops',
      color: 'Emerald & Sage',
    },
    {
      id: 'SF-TOP-02',
      name: 'Oversized Street Hoodie Tee',
      price: '$39.99',
      priceNum: 39.99,
      tag: 'New Drop',
      image: '/images/products/winter/tops/hoodies/color_1_charcoal.jpeg',
      category: 'Tops',
      color: 'Midnight Charcoal',
    },
    {
      id: 'SF-TOP-03',
      name: 'Vintage Mockneck Knit Sweater',
      price: '$79.99',
      priceNum: 79.99,
      tag: 'Best Seller',
      image: '/images/products/spring/tops/polo-shirts/color_1_coral.jpeg',
      category: 'Tops',
      color: 'Coral Gold',
    },
    {
      id: 'SF-TOP-04',
      name: 'Chunky Cable Knit Sweater',
      price: '$89.99',
      priceNum: 89.99,
      tag: 'Limited 2026',
      image: '/images/products/winter/tops/sweaters/color_2_cobalt.jpeg',
      category: 'Tops',
      color: 'Cobalt Blue',
    },
    {
      id: 'SF-TOP-05',
      name: 'Relaxed Oxford Street Shirt',
      price: '$45.99',
      priceNum: 45.99,
      tag: 'Essentials',
      image: '/images/products/summer/tops/shirts/color_1_blue.jpeg',
      category: 'Tops',
      color: 'Sky Blue',
    },
    {
      id: 'SF-TOP-06',
      name: 'MatchA Graphic Artisan Tee',
      price: '$34.99',
      priceNum: 34.99,
      tag: 'Popular',
      image: '/images/products/summer/tops/t-shirts/color_4_teal.jpeg',
      category: 'Tops',
      color: 'Teal Green',
    },

    // --- BOTTOMS & DENIM (6 items) ---
    {
      id: 'SF-BOT-01',
      name: 'Wide Leg Balloon Jeans',
      price: '$69.99',
      priceNum: 69.99,
      tag: 'Best Seller',
      image: '/images/products/winter/bottoms/jeans/color_2_cobalt.jpeg',
      category: 'Bottoms',
      color: 'Washed Cobalt',
    },
    {
      id: 'SF-BOT-02',
      name: 'Forest Relaxed Bermuda Shorts',
      price: '$45.99',
      priceNum: 45.99,
      tag: 'Summer Drop',
      image: '/images/products/summer/bottoms/shorts/color_4_teal.jpeg',
      category: 'Bottoms',
      color: 'Matcha Forest',
    },
    {
      id: 'SF-BOT-03',
      name: 'Tiered Asymmetrical Skirt',
      price: '$59.99',
      priceNum: 59.99,
      tag: 'Trending',
      image: '/images/products/standalone/peach_skirt.jpg',
      category: 'Bottoms',
      color: 'Pure White & Peach',
    },
    {
      id: 'SF-BOT-04',
      name: 'Pleated Tailored Trousers',
      price: '$74.99',
      priceNum: 74.99,
      tag: 'Signature',
      image: '/images/products/winter/bottoms/pants/color_1_charcoal.jpeg',
      category: 'Bottoms',
      color: 'Charcoal Wool',
    },
    {
      id: 'SF-BOT-05',
      name: 'Heavy Fleece Street Joggers',
      price: '$54.99',
      priceNum: 54.99,
      tag: 'Comfort Fit',
      image: '/images/products/winter/bottoms/joggers/color_2_cobalt.jpeg',
      category: 'Bottoms',
      color: 'Deep Cobalt',
    },
    {
      id: 'SF-BOT-06',
      name: 'Minimalist A-Line Pleat Skirt',
      price: '$49.99',
      priceNum: 49.99,
      tag: 'Archive',
      image: '/images/products/winter/bottoms/skirts/color_3_red.jpeg',
      category: 'Bottoms',
      color: 'Crimson Red',
    },

    // --- OUTERWEAR (6 items) ---
    {
      id: 'SF-OUT-01',
      name: 'Ceremonial Wool Overcoat',
      price: '$129.99',
      priceNum: 129.99,
      tag: 'Best Seller',
      image: '/images/products/standalone/cobalt_coat.jpg',
      category: 'Outerwear',
      color: 'Deep Cobalt',
    },
    {
      id: 'SF-OUT-02',
      name: 'Utility Bomber Flight Jacket',
      price: '$109.99',
      priceNum: 109.99,
      tag: 'New Drop',
      image: '/images/products/winter/tops/jackets/color_1_charcoal.jpeg',
      category: 'Outerwear',
      color: 'Midnight Charcoal',
    },
    {
      id: 'SF-OUT-03',
      name: 'Double-Breasted City Trench',
      price: '$139.99',
      priceNum: 139.99,
      tag: 'Limited Run',
      image: '/images/products/winter/tops/coats/color_3_red.jpeg',
      category: 'Outerwear',
      color: 'Crimson Burgundy',
    },
    {
      id: 'SF-OUT-04',
      name: 'Corduroy Street Trucker Jacket',
      price: '$94.99',
      priceNum: 94.99,
      tag: 'Vintage Drop',
      image: '/images/products/winter/tops/jackets/color_2_cobalt.jpeg',
      category: 'Outerwear',
      color: 'Cobalt Navy',
    },
    {
      id: 'SF-OUT-05',
      name: 'Heavy Thermal Zip Parka',
      price: '$89.99',
      priceNum: 89.99,
      tag: 'Winter Warmth',
      image: '/images/products/winter/tops/hoodies/color_3_cobalt.jpeg',
      category: 'Outerwear',
      color: 'Matcha Navy',
    },
    {
      id: 'SF-OUT-06',
      name: 'Minimalist Clean Wool Peacoat',
      price: '$119.99',
      priceNum: 119.99,
      tag: 'Exclusive',
      image: '/images/products/winter/tops/coats/color_1_charcoal.jpeg',
      category: 'Outerwear',
      color: 'Charcoal Black',
    },

    // --- ACCESSORIES (6 items) ---
    {
      id: 'SF-ACC-01',
      name: 'Artisan Silk Scarf & Bandana',
      price: '$29.99',
      priceNum: 29.99,
      tag: 'Best Seller',
      image: '/images/products/standalone/silk_scarf.jpg',
      category: 'Accessories',
      color: 'Terracotta Orange',
    },
    {
      id: 'SF-ACC-02',
      name: 'Ribbed Cashmere Beanie',
      price: '$24.99',
      priceNum: 24.99,
      tag: 'Essentials',
      image: '/images/products/winter/accessories/beanies/color_1_charcoal.jpeg',
      category: 'Accessories',
      color: 'Charcoal Heather',
    },
    {
      id: 'SF-ACC-03',
      name: 'Crimson Waffle Knit Beanie',
      price: '$24.99',
      priceNum: 24.99,
      tag: 'New Color',
      image: '/images/products/winter/accessories/beanies/color_3_crimson.jpeg',
      category: 'Accessories',
      color: 'Crimson Red',
    },
    {
      id: 'SF-ACC-04',
      name: 'Touchscreen Thermal Leather Gloves',
      price: '$39.99',
      priceNum: 39.99,
      tag: 'Winter Tech',
      image: '/images/products/winter/accessories/gloves/color_2_charcoal.jpeg',
      category: 'Accessories',
      color: 'Matte Charcoal',
    },
    {
      id: 'SF-ACC-05',
      name: 'MatchA Low-Top Street Sneakers',
      price: '$99.99',
      priceNum: 99.99,
      tag: 'Footwear',
      image: '/images/products/summer/shoes/sneakers/color_4_teal.jpeg',
      category: 'Accessories',
      color: 'Teal & Gum Sole',
    },
    {
      id: 'SF-ACC-06',
      name: 'Platform Leather Street Boots',
      price: '$119.99',
      priceNum: 119.99,
      tag: 'Footwear',
      image: '/images/products/winter/shoes/boots/color_1_cobalt.jpeg',
      category: 'Accessories',
      color: 'Cobalt Navy',
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
            {onExploreCatalog && (
              <button
                onClick={onExploreCatalog}
                className="px-4 py-2 bg-[#2D5A27] hover:bg-[#23471E] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer mr-2"
              >
                <Sparkles size={13} className="text-[#D0DEC6]" />
                <span>VIEW FULL CATALOG (24)</span>
              </button>
            )}
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

        {/* 3. Main Framed Carousel Container with Spotlight Tracking */}
        <div className="relative border-2 border-[#BC5A36] bg-white shadow-xl overflow-hidden">
          
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-none divide-x-2 divide-[#BC5A36] scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredProducts.map((item) => (
              <SpotlightCard
                key={item.id}
                onClick={() => onQuickView && onQuickView(item)}
                spotlightColor="rgba(188, 90, 54, 0.15)"
                className="w-60 sm:w-72 lg:w-80 shrink-0 p-5 sm:p-6 flex flex-col justify-between hover:bg-[#FAF8F5]/60 transition-colors duration-200 cursor-pointer group relative rounded-none border-0"
              >
                {/* Top Tag */}
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <span className="text-[11px] font-sans font-medium text-[#BC5A36]">
                    {item.tag}
                  </span>
                  <span className="text-[10px] font-mono text-[#6B5E55] uppercase">
                    {item.category}
                  </span>
                </div>

                {/* Product Image Container with Holographic Glare */}
                <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden mb-4 p-3 bg-[#FAF8F5]/50 holographic-sheen rounded-xs group-hover:bg-[#FAF8F5] transition-colors z-10">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain object-center group-hover:scale-108 transition-transform duration-500 ease-out"
                  />
                </div>

                {/* Solid Orange ADD TO CART Button (Centered under image) */}
                <div className="mb-4 relative z-10">
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
                <div className="text-center relative z-10">
                  <h3 className="text-xs sm:text-sm font-medium text-[#BC5A36] line-clamp-2 leading-tight group-hover:text-[#2D231E] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs font-mono font-bold text-[#BC5A36] mt-1.5">
                    {item.price}
                  </p>
                </div>

              </SpotlightCard>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
