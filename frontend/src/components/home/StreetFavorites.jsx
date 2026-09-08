import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Star, Check } from 'lucide-react';
import SpotlightCard from '../ui/SpotlightCard';
import { productsData } from '../../data/productsData';

function StreetFavoriteCard({ item, onAddToCart, onQuickView }) {
  const variants = item?.variants && item.variants.length > 0
    ? item.variants
    : [
        { 
          color: item?.color || 'Signature Tone', 
          colorHex: item?.colorHex || '#BC5A36', 
          image: item?.image 
        }
      ];

  const [activeVariant, setActiveVariant] = useState(variants[0]);
  const [imageFade, setImageFade] = useState(false);

  const handleColorClick = (e, v) => {
    e.stopPropagation();
    if (v.image === activeVariant.image) return;
    setImageFade(true);
    setTimeout(() => {
      setActiveVariant(v);
      setImageFade(false);
    }, 150);
  };

  return (
    <SpotlightCard
      onClick={() => onQuickView && onQuickView({ ...item, initialVariant: activeVariant, activeImage: activeVariant.image })}
      spotlightColor="rgba(188, 90, 54, 0.15)"
      className="w-64 sm:w-72 lg:w-80 shrink-0 p-5 sm:p-6 flex flex-col justify-between hover:bg-[#FAF8F5]/60 transition-colors duration-200 cursor-pointer group relative rounded-none border-0"
    >
      {/* Top Tag & Category */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <span className="text-[11px] font-mono font-bold text-[#BC5A36] uppercase bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
          {item.tag || item.season}
        </span>
        <span className="text-[10px] font-mono text-[#6B5E55] uppercase">
          {item.category}
        </span>
      </div>

      {/* Product Image Container */}
      <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden mb-3 p-2 bg-[#FAF8F5]/60 rounded-xl group-hover:bg-[#FAF8F5] transition-colors z-10">
        <img
          src={activeVariant.image}
          alt={`${item.name} - ${activeVariant.color}`}
          className={`w-full h-full object-contain object-center transition-all duration-300 group-hover:scale-105 ${
            imageFade ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
          }`}
        />
        
        {/* Active Color Name Pill */}
        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/75 text-white text-[9px] font-mono rounded flex items-center gap-1 shadow-sm">
          <span 
            className="w-2 h-2 rounded-full border border-white/50" 
            style={{ backgroundColor: activeVariant.colorHex }}
          />
          <span>{activeVariant.color}</span>
        </span>
      </div>

      {/* Interactive Color Selection Buttons */}
      {variants.length > 1 && (
        <div className="mb-3 flex items-center justify-center gap-1.5 z-10 flex-wrap">
          {variants.map((v, i) => {
            const isSelected = activeVariant.image === v.image;
            return (
              <button
                key={i}
                onClick={(e) => handleColorClick(e, v)}
                title={v.color}
                className={`w-5.5 h-5.5 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                  isSelected 
                    ? 'border-[#2D231E] scale-120 ring-2 ring-[#BC5A36]/40 shadow-xs' 
                    : 'border-transparent opacity-75 hover:opacity-100 hover:scale-110'
                }`}
                style={{ backgroundColor: v.colorHex }}
              >
                {isSelected && (
                  <Check size={9} className={['white', 'cream', 'Ecru'].some(c => v.color.includes(c)) ? 'text-black font-bold' : 'text-white font-bold'} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Solid Terracotta ADD TO CART Button */}
      <div className="mb-3 relative z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart && onAddToCart({
              ...item,
              image: activeVariant.image,
              color: activeVariant.color,
              colorHex: activeVariant.colorHex
            });
          }}
          className="w-full py-2.5 bg-[#BC5A36] hover:bg-[#9E4423] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 rounded-lg"
        >
          <ShoppingBag size={13} />
          <span>ADD TO CART</span>
        </button>
      </div>

      {/* Product Title and Price */}
      <div className="text-center relative z-10">
        <h3 className="text-xs sm:text-sm font-bold text-[#2D231E] line-clamp-1 leading-tight group-hover:text-[#BC5A36] transition-colors">
          {item.name}
        </h3>
        <p className="text-xs font-mono font-black text-[#BC5A36] mt-1">
          ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
        </p>
      </div>

    </SpotlightCard>
  );
}

export default function StreetFavorites({ onAddToCart, onQuickView, onExploreCatalog }) {
  const scrollRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Use clean master products data (featuring only authentic models with color variants)
  const products = productsData.slice(0, 24);

  const categories = [
    { key: 'ALL', label: 'ALL DROPS' },
    { key: 'Tops', label: 'TOPS & KNIT' },
    { key: 'Bottoms', label: 'BOTTOMS & DENIM' },
    { key: 'Outerwear', label: 'OUTERWEAR' },
    { key: 'Accessories', label: 'ACCESSORIES' },
  ];

  const filteredProducts = activeCategory === 'ALL' 
    ? productsData.slice(0, 24) 
    : productsData.filter(p => p.category === activeCategory);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
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
                <span>VIEW FULL CATALOG ({productsData.length})</span>
              </button>
            )}
            <button
              onClick={scrollLeft}
              aria-label="Previous Products"
              className="w-10 h-10 border-2 border-[#BC5A36] text-[#BC5A36] hover:bg-[#BC5A36] hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer active:scale-95 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={scrollRight}
              aria-label="Next Products"
              className="w-10 h-10 border-2 border-[#BC5A36] text-[#BC5A36] hover:bg-[#BC5A36] hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer active:scale-95 rounded-lg"
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
              className={`px-4 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer rounded-lg ${
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
        <div className="relative border-2 border-[#BC5A36] bg-white shadow-xl overflow-hidden rounded-2xl">
          
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-none divide-x-2 divide-[#BC5A36] scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredProducts.map((item) => (
              <StreetFavoriteCard
                key={item.id}
                item={item}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
              />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
