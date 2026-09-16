import { flyToCart } from '../../utils/flyToCart';
import React, { useRef, useState } from 'react';
import { Heart, ShoppingBag, Eye, Check } from 'lucide-react';
import { handleImageError, webpSrc } from '../../utils/imageFallback';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onQuickView, 
  onToggleWishlist,
  isWishlisted = false 
}) {
  // Use only sizes supplied by product data. Zero or multiple options require the
  // modal; exactly one option is safe for direct add-to-cart.
  const sizeList = Array.isArray(product?.sizes) ? product.sizes.filter(Boolean) : [];
  const needsSizeChoice = sizeList.length !== 1;

  // Normalize single-image products into the same variant list used by swatches,
  // quick view, and the cart payload.
  const variants = product?.variants && product.variants.length > 0
    ? product.variants
    : [
        { 
          color: product?.color || 'Matcha Sage', 
          colorHex: product?.colorHex || '#8F9779', 
          image: product?.image || '/images/products/standalone/mustard_sweater.jpg' 
        }
      ];

  const { addToCart: contextAddToCart } = useCart();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeVariant, setActiveVariant] = useState(variants[0]);
  const cardRef = useRef(null);
  const [wishlistActive, setWishlistActive] = useState(isWishlisted);
  const [justAdded, setJustAdded] = useState(false);
  const [imageFade, setImageFade] = useState(false);

  const handleColorSelect = (e, variant) => {
    // A swatch click changes the card only and must not bubble to quick view.
    e.stopPropagation();
    if (variant.image === activeVariant.image) return;

    // Swap the image midway through a short fade to avoid an abrupt visual jump.
    setImageFade(true);
    setTimeout(() => {
      setActiveVariant(variant);
      setImageFade(false);
    }, 150);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    // Sold-out products remain protected even if this handler is invoked directly.
    if (!product.inStock) return;

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 800);

    const itemToAdd = {
      ...product,
      image: activeVariant.image,
      color: activeVariant.color,
      colorHex: activeVariant.colorHex,
      size: sizeList[0],
      quantity: 1
    };

    // Start visual feedback from this card before delegating the actual cart write.
    flyToCart(cardRef.current);

    // A parent callback can override cart behavior; CartContext is the default path.
    if (onAddToCart) {
      onAddToCart(itemToAdd);
    } else if (contextAddToCart) {
      contextAddToCart(itemToAdd);
    }
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    // Guests cannot mutate wishlist state and receive an explanatory toast.
    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนเพื่อบันทึกรายการสินค้าที่ชอบ (Wishlist)', 'info');
      return;
    }
    // Update the heart immediately, then let the optional parent persist the change.
    setWishlistActive(!wishlistActive);
    if (onToggleWishlist) onToggleWishlist(product);
  };

  return (
    <div
      ref={cardRef}
      className="matcha-hover-card group relative bg-white border border-[#D9D3C7] hover:border-[#2D5A27] group-focus-within:border-[#2D5A27] rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col justify-between select-none"
    >
      {/* 1. PRODUCT PHOTO CONTAINER */}
      <div 
        onClick={() => onQuickView && onQuickView({ ...product, initialVariant: activeVariant, activeImage: activeVariant.image })}
        className="relative aspect-4/5 w-full bg-[#FAF8F5] overflow-hidden cursor-pointer flex items-center justify-center p-3.5"
      >
        <img
          src={webpSrc(activeVariant.image)} data-original-src={activeVariant.image}
          loading="lazy"
          decoding="async"
          alt={`${product.name} - ${activeVariant.color}`}
          onError={handleImageError}
          className={`w-full h-full object-contain object-center transition-all duration-300 group-hover:scale-102 ${
            imageFade ? 'opacity-40 scale-98' : 'opacity-100 scale-100'
          }`}
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

        {/* Live Active Tone Floating Pill at Bottom of Image */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2D231E]/85 backdrop-blur-xs text-white text-[10px] font-mono shadow-md">
            <span 
              className="w-2.5 h-2.5 rounded-full border border-white/50" 
              style={{ backgroundColor: activeVariant.colorHex }}
            />
            <span>{activeVariant.color}</span>
          </span>
        </div>

        {/* Centered Quick View Hover Overlay with Dimmed Backdrop */}
        <div className="absolute inset-0 z-20 bg-black/35 backdrop-blur-[1px] flex items-center justify-center transition-all duration-300 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView && onQuickView({ ...product, initialVariant: activeVariant, activeImage: activeVariant.image });
            }}
            className="px-5 py-2.5 bg-white/95 hover:bg-white text-[#2D231E] hover:text-[#2D5A27] text-xs font-mono font-bold uppercase rounded-full shadow-2xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer transform duration-200"
          >
            <Eye size={14} />
            <span>Quick View</span>
          </button>
        </div>

        {/* Sold Out Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-[#2D231E]/60 backdrop-blur-[1px] flex items-center justify-center z-25">
            <span className="px-3 py-1 bg-white text-[#2D231E] text-xs font-mono font-bold uppercase tracking-wider rounded-lg shadow-md">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* 2. CARD CONTENT & DETAILS */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Product Title */}
          <h3 
            onClick={() => onQuickView && onQuickView({ ...product, initialVariant: activeVariant, activeImage: activeVariant.image })}
            className="text-sm sm:text-base font-extrabold text-[#2D231E] uppercase tracking-tight line-clamp-1 group-hover:text-[#2D5A27] transition-colors cursor-pointer"
          >
            {product.name}
          </h3>

          {/* Compact Color Swatches Row */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {variants.slice(0, 4).map((v, i) => {
              const isSelected = activeVariant.image === v.image;
              return (
                <button
                  key={i}
                  onClick={(e) => handleColorSelect(e, v)}
                  aria-label={`สี ${v.color}`}
                  aria-pressed={isSelected}
                  title={v.color}
                  className={`w-6 h-6 rounded-full transition-all cursor-pointer flex items-center justify-center relative shadow-2xs ${
                    isSelected 
                      ? 'ring-2 ring-[#2D5A27] ring-offset-1' 
                      : 'border border-[#D9D3C7] opacity-80 hover:opacity-100 hover:scale-110'
                  }`}
                  style={{ backgroundColor: v.colorHex }}
                >
                  {isSelected && (
                    <Check size={10} className={['white', 'cream', 'Ecru', 'Sand'].some(c => v.color.toLowerCase().includes(c.toLowerCase())) ? 'text-black font-bold' : 'text-white font-bold'} />
                  )}
                </button>
              );
            })}
            {variants.length > 4 && (
              <span className="text-[10px] font-mono text-[#6B5E55]">
                +{variants.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* 5. BOTTOM BAR: Price & Quick Add Button */}
        <div className="mt-3.5 pt-3 border-t border-[#D9D3C7]/60 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-base sm:text-lg font-black text-[#2D231E]">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-xs line-through text-[#6B5E55]">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Ambiguous sizes open the modal; a sole known size can be added directly. */}
          {needsSizeChoice ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!product.inStock) return;
                onQuickView && onQuickView({ 
                  ...product, 
                  initialVariant: activeVariant, 
                  activeImage: activeVariant.image 
                });
              }}
              disabled={!product.inStock}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer ${
                product.inStock
                  ? 'bg-[#2D5A27] hover:bg-[#23471E] text-white shadow-xs'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Eye size={13} />
              <span>Select Size</span>
            </button>
          ) : (
            <button
              onClick={handleQuickAdd}
              disabled={!product.inStock}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer ${
                justAdded
                  ? 'bg-emerald-600 text-white shadow-md'
                  : product.inStock
                    ? 'bg-[#2D5A27] hover:bg-[#23471E] text-white shadow-xs'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {justAdded ? (
                <>
                  <Check size={13} />
                  <span>Added ✓</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={13} />
                  <span>Add Bag</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
