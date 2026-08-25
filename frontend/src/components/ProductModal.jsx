import React, { useState, useEffect } from 'react';
import { X, Heart, Star, ShoppingBag, Check, Sparkles, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function ProductModal({ product, onClose, onAddToCart, onToggleWishlist, isWishlisted = false }) {
  // Extract variants from product
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
  const [quantity, setQuantity] = useState(1);
  const [wishlistActive, setWishlistActive] = useState(isWishlisted);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Sync when product changes
  useEffect(() => {
    if (product) {
      const initialVariant = (product.variants && product.variants.length > 0)
        ? product.variants[0]
        : { color: product.color || 'Signature', colorHex: product.colorHex || '#2D5A27', image: product.image };
      setActiveVariant(initialVariant);
      setSelectedSize(product.sizes?.[0] || (product.category === 'Accessories' ? 'OS' : 'M'));
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const handleAdd = () => {
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 600);

    onAddToCart({
      ...product,
      image: activeVariant.image,
      color: activeVariant.color,
      colorHex: activeVariant.colorHex,
      size: selectedSize,
      quantity: Number(quantity)
    });
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    setWishlistActive(!wishlistActive);
    if (onToggleWishlist) onToggleWishlist(product);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF8F5] text-[#2D231E] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#D9D3C7] relative animate-modal-pop flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-[#2D231E] hover:text-white border border-[#D9D3C7] flex items-center justify-center text-sm font-bold text-[#2D231E] transition-all cursor-pointer shadow-sm"
        >
          <X size={18} />
        </button>

        {/* LEFT COLUMN: Real High-Res Product Image with Variant Switcher */}
        <div className="md:w-1/2 bg-[#F2EDE4] p-6 sm:p-8 flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-[#D9D3C7]">
          
          {/* Top Tag & Wishlist */}
          <div className="w-full flex items-center justify-between z-10">
            <span className="px-3 py-1 bg-[#2D231E] text-[#D0DEC6] text-[10px] font-mono font-bold tracking-widest uppercase rounded-lg shadow-2xs">
              {product.tag || `${product.season} COLLECTION`}
            </span>
            <button
              onClick={handleWishlist}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                wishlistActive 
                  ? 'bg-rose-50 border-rose-300 text-rose-600' 
                  : 'bg-white/80 border-[#D9D3C7] text-[#6B5E55] hover:text-rose-500 hover:border-rose-300'
              }`}
            >
              <Heart size={16} className={wishlistActive ? 'fill-rose-500 text-rose-500' : ''} />
            </button>
          </div>

          {/* MAIN PRODUCT PHOTO */}
          <div className="w-full aspect-3/4 max-h-[380px] my-4 rounded-2xl overflow-hidden bg-white border border-[#D9D3C7] shadow-sm flex items-center justify-center relative group">
            <img 
              src={activeVariant.image} 
              alt={`${product.name} - ${activeVariant.color}`}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Color Overlay Badge on Image */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono rounded-md flex items-center gap-1.5 shadow-sm">
              <span 
                className="w-2.5 h-2.5 rounded-full border border-white/40"
                style={{ backgroundColor: activeVariant.colorHex }}
              />
              <span>{activeVariant.color}</span>
            </div>
          </div>

          {/* COLOR VARIANT THUMBNAILS (Click to switch image in modal) */}
          {variants.length > 1 && (
            <div className="w-full flex items-center justify-center gap-2 pt-2 overflow-x-auto pb-1">
              {variants.map((v, i) => {
                const isActive = activeVariant.image === v.image;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveVariant(v)}
                    className={`w-12 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer relative shrink-0 ${
                      isActive ? 'border-[#2D5A27] scale-105 shadow-md ring-2 ring-[#2D5A27]/20' : 'border-[#D9D3C7] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={v.image} alt={v.color} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Product Specifications & Add to Cart Controls */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-5">
            
            {/* Header: Title, Category, Rating, Price */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#6B5E55] mb-1">
                <span className="text-[#2D5A27] font-bold uppercase">{product.season} Drop</span>
                <span>•</span>
                <span className="uppercase">{product.category}</span>
                <span>•</span>
                <span>{product.id}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D231E] uppercase tracking-tight leading-tight">
                {product.name}
              </h2>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-2xl font-black text-[#2D231E]">
                    ${product.price ? product.price.toFixed(2) : '59.99'}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm line-through text-[#6B5E55]">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs font-mono text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                  <Star size={12} className="fill-amber-500 text-amber-500" />
                  <span>{product.rating || '4.9'} ({product.reviewsCount || 88} reviews)</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#6B5E55] leading-relaxed">
              {product.description}
            </p>

            {/* 1. Interactive Color Swatches */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>Color: <strong className="text-[#2D5A27]">{activeVariant.color}</strong></span>
                <span className="text-[10px] font-mono text-[#6B5E55]">{variants.length} Tones Available</span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {variants.map((v, idx) => {
                  const isSelected = activeVariant.image === v.image;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveVariant(v)}
                      title={v.color}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#2D5A27] bg-[#2D5A27]/10 text-[#2D5A27] font-bold shadow-2xs'
                          : 'border-[#D9D3C7] bg-white text-[#2D231E] hover:border-[#6B5E55]'
                      }`}
                    >
                      <span 
                        className="w-3 h-3 rounded-full border border-black/10 shrink-0" 
                        style={{ backgroundColor: v.colorHex }}
                      />
                      <span>{v.color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Interactive Size Selector */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>Size: <strong className="text-[#2D5A27]">{selectedSize}</strong></span>
                <span className="text-[10px] font-mono text-[#BC5A36] cursor-pointer hover:underline">Fit Guide</span>
              </div>
              <div className="flex items-center gap-2">
                {(product.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`min-w-10 h-10 px-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                      selectedSize === sz
                        ? 'bg-[#2D231E] text-white shadow-sm scale-105'
                        : 'bg-white border border-[#D9D3C7] text-[#2D231E] hover:border-[#2D5A27]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Quantity Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider">Quantity:</span>
              <div className="flex items-center border border-[#D9D3C7] bg-white rounded-xl overflow-hidden font-mono text-xs">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-1.5 hover:bg-[#FAF8F5] text-[#2D231E] font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 py-1.5 font-bold min-w-8 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-3 py-1.5 hover:bg-[#FAF8F5] text-[#2D231E] font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Actions: Add to Bag Button & Trust Badges */}
          <div className="mt-6 pt-5 border-t border-[#D9D3C7] space-y-3">
            <button
              onClick={handleAdd}
              disabled={!product.inStock}
              className={`w-full py-4 rounded-2xl font-mono font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                product.inStock 
                  ? addedAnimation 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-[#2D5A27] hover:bg-[#23471E] text-white shadow-[#2D5A27]/25'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingBag size={16} />
              <span>
                {product.inStock 
                  ? addedAnimation 
                    ? 'Added to Bag! ✓' 
                    : `Add to Bag • $${((product.price || 59.99) * quantity).toFixed(2)}`
                  : 'Sold Out'}
              </span>
            </button>

            {/* Micro Trust Perks */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#6B5E55] pt-1">
              <div className="flex items-center gap-1.5">
                <Truck size={12} className="text-[#2D5A27]" />
                <span>Free Express Shipping</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#2D5A27]" />
                <span>Authentic MatchA Garment</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
