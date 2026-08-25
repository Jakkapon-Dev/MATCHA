import React, { useState } from 'react';
import { Heart, ShoppingBag, Eye, Star, Check } from 'lucide-react';

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onQuickView, 
  onToggleWishlist,
  isWishlisted = false 
}) {
  const variants = product?.variants && product.variants.length > 0
    ? product.variants
    : [
        { 
          color: product?.color || 'Matcha Sage', 
          colorHex: product?.colorHex || '#8F9779', 
          image: product?.image || '/images/products/standalone/mustard_sweater.jpg' 
        }
      ];

  const [activeVariant, setActiveVariant] = useState(variants[0]);
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || 'M');
  const [isHovered, setIsHovered] = useState(false);
  const [wishlistActive, setWishlistActive] = useState(isWishlisted);
  const [justAdded, setJustAdded] = useState(false);

  const handleColorSelect = (e, variant) => {
    e.stopPropagation();
    setActiveVariant(variant);
  };

  const handleSizeSelect = (e, size) => {
    e.stopPropagation();
    setSelectedSize(size);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (!product.inStock) return;

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 800);

    if (onAddToCart) {
      onAddToCart({
        ...product,
        image: activeVariant.image,
        color: activeVariant.color,
        colorHex: activeVariant.colorHex,
        size: selectedSize,
        quantity: 1
      });
    }
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    setWishlistActive(!wishlistActive);
    if (onToggleWishlist) onToggleWishlist(product);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white border border-[#D9D3C7] hover:border-[#2D5A27] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col justify-between select-none"
    >
      {/* 1. PRODUCT PHOTO CONTAINER */}
      <div 
        onClick={() => onQuickView && onQuickView({ ...product, initialVariant: activeVariant, activeImage: activeVariant.image })}
        className="relative aspect-3/4 w-full bg-[#FAF8F5] overflow-hidden cursor-pointer"
      >
        <img
          src={activeVariant.image}
          alt={`${product.name} - ${activeVariant.color}`}
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />

        {/* Top Badges (Left) & Wishlist Button (Right) */}
        <div className="absolute top-3 inset-x-3 flex items-start justify-between z-10 pointer-events-none">
          <div className="flex flex-col gap-1 items-start">
            {product.tag && (
              <span className={`px-2.5 py-0.5 text-[9px] font-mono font-bold rounded-md shadow-2xs uppercase ${
                product.tag.includes('Best') ? 'bg-[#BC5A36] text-white' :
                product.tag.includes('New') ? 'bg-[#2D5A27] text-white' :
                'bg-[#2D231E] text-[#D0DEC6]'
              }`}>
                {product.tag}
              </span>
            )}
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-white/90 text-[#6B5E55] rounded backdrop-blur-xs shadow-2xs">
              {product.season}
            </span>
          </div>

          {/* Wishlist Heart Button */}
          <button
            onClick={handleWishlistClick}
            aria-label="Add to wishlist"
            className={`pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              wishlistActive
                ? 'bg-white text-rose-600 ring-2 ring-rose-300'
                : 'bg-white/85 text-[#6B5E55] hover:text-rose-600 hover:scale-110'
            }`}
          >
            <Heart size={15} className={wishlistActive ? 'fill-rose-500 text-rose-500' : ''} />
          </button>
        </div>

        {/* Quick View Hover Floating Overlay */}
        <div className={`absolute inset-x-3 bottom-3 z-20 flex gap-2 transition-all duration-300 transform ${
          isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView && onQuickView({ ...product, initialVariant: activeVariant, activeImage: activeVariant.image });
            }}
            className="flex-1 py-2 bg-white/95 hover:bg-white text-[#2D231E] text-xs font-mono font-bold uppercase rounded-xl backdrop-blur-md shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye size={13} />
            <span>Quick View</span>
          </button>
        </div>

        {/* Sold Out Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-[#2D231E]/60 backdrop-blur-[1px] flex items-center justify-center z-15">
            <span className="px-3 py-1 bg-white text-[#2D231E] text-xs font-mono font-bold uppercase tracking-wider rounded-lg shadow-md">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* 2. CARD CONTENT & DETAILS */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          
          {/* Category & Star Rating */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#6B5E55] mb-1">
            <span className="text-[#2D5A27] font-bold uppercase tracking-wider">{product.category}</span>
            <span className="flex items-center gap-0.5 text-amber-600 font-bold">
              <Star size={10} className="fill-amber-500 text-amber-500" />
              {product.rating} ({product.reviewsCount})
            </span>
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => onQuickView && onQuickView({ ...product, initialVariant: activeVariant, activeImage: activeVariant.image })}
            className="text-sm font-extrabold text-[#2D231E] uppercase tracking-tight line-clamp-1 group-hover:text-[#2D5A27] transition-colors cursor-pointer"
          >
            {product.name}
          </h3>

          {/* Active Color Name & Fit */}
          <div className="flex items-center justify-between text-[11px] text-[#6B5E55] mt-1 mb-2.5">
            <span className="font-medium text-[#2D231E]">
              Tone: <strong>{activeVariant.color}</strong>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#D9D3C7]">
              {product.fit}
            </span>
          </div>

          {/* 3. INTERACTIVE COLOR SWATCHES (Click to change card photo) */}
          {variants.length > 1 && (
            <div className="flex items-center gap-1.5 my-2">
              {variants.map((v, i) => {
                const isSelected = activeVariant.image === v.image;
                return (
                  <button
                    key={i}
                    onClick={(e) => handleColorSelect(e, v)}
                    title={v.color}
                    className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer shrink-0 ${
                      isSelected 
                        ? 'border-[#2D5A27] scale-120 ring-2 ring-[#2D5A27]/30 shadow-xs' 
                        : 'border-transparent opacity-75 hover:opacity-100 hover:scale-110'
                    }`}
                    style={{ backgroundColor: v.colorHex }}
                  />
                );
              })}
              <span className="text-[10px] font-mono text-[#6B5E55] ml-1">
                ({variants.length})
              </span>
            </div>
          )}

          {/* 4. INTERACTIVE SIZE SELECTOR PILLS */}
          <div className="flex items-center gap-1 my-2 flex-wrap">
            {(product.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map((sz) => {
              const isSelected = selectedSize === sz;
              return (
                <button
                  key={sz}
                  onClick={(e) => handleSizeSelect(e, sz)}
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2D231E] text-white shadow-2xs'
                      : 'bg-[#FAF8F5] text-[#6B5E55] border border-[#D9D3C7]/80 hover:border-[#2D5A27] hover:text-[#2D231E]'
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>

        </div>

        {/* 5. BOTTOM BAR: Price & Quick Add Button */}
        <div className="mt-3 pt-3 border-t border-[#D9D3C7]/60 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-sm sm:text-base font-bold text-[#2D231E]">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-[11px] line-through text-[#6B5E55]">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={!product.inStock}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : product.inStock
                  ? 'bg-[#2D5A27] hover:bg-[#23471E] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {justAdded ? (
              <>
                <Check size={12} />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag size={12} />
                <span>+ Add</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
