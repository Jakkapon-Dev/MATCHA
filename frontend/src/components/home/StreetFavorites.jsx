import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Star, Check, Eye } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Reveal, EASE } from '../motion';
import SpotlightCard from '../ui/SpotlightCard';
import useStreetProducts from '../../hooks/useStreetProducts';
import ProductCardSkeleton from '../ui/ProductCardSkeleton';
import { webpSrc } from '../../utils/imageFallback';
import { useLanguage } from '../../context/LanguageContext.jsx';

function StreetFavoriteCard({ item, onAddToCart, onQuickView }) {
  const { t } = useLanguage();
  // Products with zero or multiple sizes must open quick view for an explicit choice;
  // exactly one size can be added directly from the carousel.
  const sizeList = Array.isArray(item?.sizes) ? item.sizes.filter(Boolean) : [];
  const needsSizeChoice = sizeList.length !== 1;

  // Normalize single-image products into the same variant shape used by swatches.
  const variants = item?.variants && item.variants.length > 0
    ? item.variants
    : [
        { 
          color: item?.color || t('favorites.signatureTone'), 
          colorHex: item?.colorHex || '#C91D1D', 
          image: item?.image 
        }
      ];

  const [activeVariant, setActiveVariant] = useState(variants[0]);
  const [imageFade, setImageFade] = useState(false);

  const handleColorClick = (e, v) => {
    // Do not let a swatch click trigger the card-level quick view.
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
      className="matcha-hover-card w-64 sm:w-72 lg:w-80 shrink-0 p-5 sm:p-6 flex flex-col justify-between hover:bg-[#F1F1F1]/60 transition-colors duration-200 cursor-pointer group relative rounded-none border-0"
    >
      {/* Top Tag & Category */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <span className="text-[11px] font-mono font-bold text-[#C91D1D] uppercase bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
          {item.tag || item.season}
        </span>
        <span className="text-[10px] font-mono text-[#666666] uppercase">
          {item.category}
        </span>
      </div>

      {/* Product Image Container */}
      <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden mb-3 p-2 bg-[#F1F1F1]/60 rounded-xl group-hover:bg-[#F1F1F1] transition-colors z-10">
        <img
          src={webpSrc(activeVariant.image)} data-original-src={activeVariant.image}
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

        {/* Sold Out Overlay */}
        {!item.inStock && (
          <div className="absolute inset-0 bg-[#000000]/60 backdrop-blur-[1px] flex items-center justify-center z-25">
            <span className="px-3 py-1 bg-white text-[#000000] text-xs font-mono font-bold uppercase tracking-wider rounded-lg shadow-md">
              {t('favorites.soldOutBadge')}
            </span>
          </div>
        )}
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
                    ? 'border-[#000000] scale-120 ring-2 ring-[#C91D1D]/40 shadow-xs' 
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

      {/* Solid Terracotta Action Button */}
      <div className="mb-3 relative z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!item.inStock) return;
            // Route ambiguous sizes through quick view; otherwise construct a complete
            // cart line using the active color and the product's sole size.
            if (needsSizeChoice) {
              onQuickView && onQuickView({
                ...item,
                initialVariant: activeVariant,
                activeImage: activeVariant.image
              });
            } else {
              onAddToCart && onAddToCart({
                ...item,
                image: activeVariant.image,
                color: activeVariant.color,
                colorHex: activeVariant.colorHex,
                size: sizeList[0],
                quantity: 1
              });
            }
          }}
          disabled={!item.inStock}
          className={`w-full py-2.5 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 rounded-lg ${
            item.inStock
              ? 'bg-[#C91D1D] hover:bg-[#A81515] text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          {needsSizeChoice && item.inStock ? <Eye size={13} /> : <ShoppingBag size={13} />}
          <span>{!item.inStock ? t('favorites.soldOut') : needsSizeChoice ? t('favorites.selectSize') : t('favorites.addToCart')}</span>
        </button>
      </div>

      {/* Product Title and Price */}
      <div className="text-center relative z-10">
        <h3 className="text-xs sm:text-sm font-bold text-[#000000] line-clamp-1 leading-tight group-hover:text-[#C91D1D] transition-colors">
          {item.name}
        </h3>
        <p className="text-xs font-mono font-black text-[#C91D1D] mt-1">
          ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
        </p>
      </div>

    </SpotlightCard>
  );
}

export default function StreetFavorites({ onAddToCart, onQuickView, onExploreCatalog }) {
  const { t } = useLanguage();
  const scrollRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const reduced = useReducedMotion();

  // The hook owns remote loading and retry behavior; this component selects which
  // loading, error, empty, or product-list state to render.
  const { products, loading, error, slow, retry } = useStreetProducts();

  // Keys double as the product-category filter, so they stay untranslated.
  const categories = ['ALL', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];

  // Limit the unfiltered home carousel to 24 items; category views show every match.
  const filteredProducts = activeCategory === 'ALL'
    ? products.slice(0, 24)
    : products.filter(p => p.category === activeCategory);

  // A narrow category can be shorter than the distance already scrolled, which
  // would land the viewer on empty rail. Snap back so the new set animates in
  // where they are looking.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [activeCategory]);

  const scrollLeft = () => {
    // One navigation click moves approximately one desktop card plus its spacing.
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
    <section id="street-favorites" className="w-full bg-[#F1F1F1] text-[#000000] py-16 sm:py-24 px-4 sm:px-8 lg:px-12 border-b border-[#DCDCDC] overflow-hidden select-none">
      <div className="max-w-7xl mx-auto">
        
        {/* 1. Header Title & Navigation Controls */}
        <Reveal y={30} className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black text-[#C91D1D] tracking-tight font-sans">
              {t('favorites.title')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onExploreCatalog && (
              <button
                onClick={onExploreCatalog}
                className="px-4 py-2 bg-[#042509] hover:bg-[#021505] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer mr-2"
              >
                <Sparkles size={13} className="text-[#518F5C]" />
                <span>{t('favorites.viewCatalog')}{!loading && !error ? ` (${products.length})` : ''}</span>
              </button>
            )}
            <button
              onClick={scrollLeft}
              aria-label={t('favorites.prevAria')}
              className="w-10 h-10 border-2 border-[#C91D1D] text-[#C91D1D] hover:bg-[#C91D1D] hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer active:scale-95 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={scrollRight}
              aria-label={t('favorites.nextAria')}
              className="w-10 h-10 border-2 border-[#C91D1D] text-[#C91D1D] hover:bg-[#C91D1D] hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer active:scale-95 rounded-lg"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </Reveal>

        {/* 2. Interactive Category Filter Pills.
            The red fill is one shared element that slides between pills rather
            than six fills switching on and off, so the eye can follow the
            selection to its new home. */}
        <Reveal y={24} delay={0.08} className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
          {categories.map((key) => {
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`relative px-4 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer rounded-lg ${
                  isActive
                    ? 'text-white'
                    : 'bg-white text-[#000000] border border-[#DCDCDC] hover:border-[#C91D1D]'
                }`}
              >
                {isActive && (
                  reduced ? (
                    <span className="absolute inset-0 bg-[#C91D1D] rounded-lg shadow-md" />
                  ) : (
                    <motion.span
                      layoutId="favorites-active-pill"
                      className="absolute inset-0 bg-[#C91D1D] rounded-lg shadow-md"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )
                )}
                <span className="relative z-10">{t(`favorites.categories.${key}`)}</span>
              </button>
            );
          })}
        </Reveal>

        {/* 3. Main Framed Carousel Container with Spotlight Tracking */}
        <Reveal y={40} delay={0.16} className="relative border-2 border-[#C91D1D] bg-white shadow-xl overflow-hidden rounded-2xl">

          {/* The dividing rules moved from `divide-x` onto the cards themselves.
              `divide-x` styles every child but the first, and which card is
              first changes mid-filter while a card is still animating out. */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-none scroll-smooth"
          >
            {loading ? <div role="status" aria-label={t('common.loading')} className="p-5">
                {slow && (
                  <p className="mb-4 text-xs font-mono text-[#666666] leading-relaxed">
                    {t('favorites.wakingServer')}
                  </p>
                )}
                <div className="flex gap-4">{[0, 1, 2, 3].map(i => <div key={i} className="w-64 sm:w-72 lg:w-80 shrink-0"><ProductCardSkeleton /></div>)}</div>
              </div>
              : error ? <div role="alert" className="p-6 text-red-900"><p>{t('favorites.loadError')}</p><button onClick={retry} className="mt-3 px-4 py-2 rounded-lg bg-[#042509] text-white hover:bg-[#021505]">{t('common.retry')}</button></div>
              : !filteredProducts.length ? <div className="m-5 p-6 border border-dashed border-[#DCDCDC] rounded-xl"><ShoppingBag aria-hidden="true" /><p className="my-3">{t('favorites.emptyCategory')}</p><button onClick={onExploreCatalog} className="px-4 py-2 rounded-lg bg-[#042509] text-white hover:bg-[#021505]">{t('favorites.viewAll')}</button></div>
              : (
              /* Changing category reorders one shared set of cards instead of
                 tearing the rail down and building a new one: what survives the
                 filter slides to its new slot, what leaves scales away, and what
                 arrives fades in behind it. `popLayout` takes the leaving cards
                 out of flow first, so the survivors move exactly once. */
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredProducts.map((item) => (
                  <motion.div
                    key={item.id}
                    layout={!reduced}
                    initial={{ opacity: 0, scale: reduced ? 1 : 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: reduced ? 1 : 0.9 }}
                    transition={{
                      duration: 0.35,
                      ease: EASE,
                      layout: { type: 'spring', stiffness: 340, damping: 34 },
                    }}
                    className="shrink-0 border-r-2 border-[#C91D1D] last:border-r-0"
                  >
                    <StreetFavoriteCard
                      item={item}
                      onAddToCart={onAddToCart}
                      onQuickView={onQuickView}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

        </Reveal>

      </div>
    </section>
  );
}
