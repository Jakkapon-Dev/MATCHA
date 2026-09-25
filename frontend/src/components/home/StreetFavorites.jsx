import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Eye } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Reveal, EASE } from '../motion';
import useStreetProducts from '../../hooks/useStreetProducts';
import ProductCardSkeleton from '../ui/ProductCardSkeleton';
import { webpSrc } from '../../utils/imageFallback';
// The catalogue's colour rules, so a garment looks the same in the rail as it
// does on the catalogue page.
import { wash, inkOn, needsEdge } from '../../utils/dye';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { taxonomyLabel } from '../../utils/taxonomy';

/* The home rail's product card, speaking the catalogue's language.

   This one component renders twenty-four times on the landing page and was on
   its own responsible for 258 of the page's 279 rounded boxes and 77 of its
   117 shadows: a rounded spotlight panel holding a rounded badge, a rounded
   image well, round swatches and a rounded button, all with their own shadow.
   It is the same product the catalogue sells, so it is now shown the way the
   catalogue shows it — standing on a wash of its own dye, with the true colour
   named on a solid bar beneath.

   The swatches stay: being able to flip a garment through its colours is the
   point of this rail, and it is the one thing here the catalogue tile cannot
   do. They are square now, because a dye is a field, not a dot. */
function StreetFavoriteCard({ item, onAddToCart, onQuickView }) {
  const { t } = useLanguage();
  // Products with zero or multiple sizes must open quick view for an explicit choice;
  // exactly one size can be added directly from the carousel.
  const sizeList = Array.isArray(item?.sizes) ? item.sizes.filter(Boolean) : [];
  const needsSizeChoice = sizeList.length !== 1;

  /* Normalize single-image products into the same variant shape used by
     swatches. A garment whose colour was never recorded is left without one:
     the fallback here used to be the brand's own red, which put a colour on
     the bar that no dye vat ever mixed and that a customer would reasonably
     read as the garment's real shade. */
  const variants = item?.variants && item.variants.length > 0
    ? item.variants
    : [
        {
          color: item?.color || null,
          colorHex: item?.colorHex || null,
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

  const hex = activeVariant?.colorHex || null;
  const openQuickView = () =>
    onQuickView && onQuickView({ ...item, initialVariant: activeVariant, activeImage: activeVariant.image });

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openQuickView}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openQuickView();
        }
      }}
      aria-label={`${item.name} - ${activeVariant?.color || ''}`}
      className="w-64 sm:w-72 lg:w-80 shrink-0 flex flex-col cursor-pointer group relative select-none outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-matcha-accent rounded-xs"
    >
      {/* Tag and category, set as the plain marginalia they are. */}
      <div className="flex justify-between items-baseline gap-2 px-3 pt-3 pb-2 font-mono text-[10px] uppercase tracking-wider">
        <span className="text-matcha-accent truncate">{item.tag ? taxonomyLabel(t, 'tag', item.tag) : taxonomyLabel(t, 'season', item.season)}</span>
        <span className="text-matcha-muted truncate">{taxonomyLabel(t, 'category', item.category)}</span>
      </div>

      {/* The garment on its own dye. Every product here is shot on white, so
          `multiply` drops the studio backdrop into the wash. */}
      {/* The frame follows the photography. Every garment here is shot
          896x1200, so a square frame scaled each one down to fit its height
          and left a band of empty wash down both sides; at 320 wide that was
          40px of nothing on each edge with the garment shrunk to match. */}
      <div className="relative aspect-3/4 overflow-hidden" style={{ backgroundColor: hex ? wash(hex) : '#E4E4E4' }}>
        <img
          src={webpSrc(activeVariant.image)} data-original-src={activeVariant.image}
          alt={`${item.name} - ${activeVariant.color}`}
          className={`absolute inset-0 w-full h-full object-contain object-center mix-blend-multiply transition-all duration-300 group-hover:scale-[1.04] ${
            imageFade ? 'opacity-30' : 'opacity-100'
          }`}
        />

        {!item.inStock && (
          <div className="absolute inset-0 bg-matcha-bg/70 flex items-center justify-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#0A0A0A]">
              {t('favorites.soldOutBadge')}
            </span>
          </div>
        )}

        {/* The action answers the pointer rather than sitting on all
            twenty-four cards at once. */}
        {item.inStock && (
          <div className="absolute inset-x-0 bottom-0 flex opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (needsSizeChoice) return openQuickView();
                onAddToCart && onAddToCart({
                  ...item,
                  image: activeVariant.image,
                  color: activeVariant.color,
                  colorHex: activeVariant.colorHex,
                  size: sizeList[0],
                  quantity: 1
                });
              }}
              className="flex-1 py-2.5 bg-[#0A0A0A] hover:bg-matcha-accent text-matcha-bg font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {needsSizeChoice ? <Eye size={13} /> : <ShoppingBag size={13} />}
              <span>{needsSizeChoice ? t('favorites.selectSize') : t('favorites.addToCart')}</span>
            </button>
          </div>
        )}
      </div>

      {/* The dye at full strength, named on itself — the same bar the
          catalogue tiles carry. */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-1"
        style={{
          backgroundColor: hex || '#F1F1F1',
          color: hex ? inkOn(hex) : '#666666',
          boxShadow: !hex || needsEdge(hex) ? 'inset 0 0 0 1px #DCDCDC' : undefined,
        }}
      >
        <span className="font-mono text-[10px] uppercase tracking-wider truncate">
          {activeVariant.color || t('favorites.signatureTone')}
        </span>
        <span className="font-mono text-[10px] tabular-nums shrink-0">
          ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
        </span>
      </div>

      <div className="px-3 pt-2.5 pb-3 flex flex-col gap-2.5">
        <h3 className="text-[13px] leading-snug text-[#0A0A0A] line-clamp-2 group-hover:underline underline-offset-4 decoration-2 decoration-matcha-accent">
          {item.name}
        </h3>

        {variants.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {variants.map((v, i) => {
              const isSelected = activeVariant.image === v.image;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => handleColorClick(e, v)}
                  title={v.color}
                  aria-label={v.color}
                  aria-pressed={isSelected}
                  className={`w-5 h-5 cursor-pointer transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-1 ${
                    isSelected ? 'ring-2 ring-[#0A0A0A] ring-offset-1' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: v.colorHex || '#F1F1F1',
                    boxShadow: !v.colorHex || needsEdge(v.colorHex) ? 'inset 0 0 0 1px #DCDCDC' : undefined,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </article>
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
    <section id="street-favorites" className="w-full bg-matcha-bg text-matcha-text py-16 sm:py-24 px-5 sm:px-8 lg:px-12 border-b border-matcha-border overflow-hidden select-none">
      <div className="max-w-7xl mx-auto">
        
        {/* 1. Header Title & Navigation Controls */}
        <Reveal y={30} className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black text-matcha-accent tracking-tight font-sans">
              {t('favorites.title')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onExploreCatalog && (
              <button
                onClick={onExploreCatalog}
                className="font-mono text-xs uppercase tracking-wider text-matcha-accent hover:underline underline-offset-4 cursor-pointer flex items-center gap-1.5 mr-2 outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
              >
                <Sparkles size={13} className="text-matcha-secondary" />
                <span>{t('favorites.viewCatalog')}{!loading && !error ? ` (${products.length})` : ''}</span>
              </button>
            )}
            <button
              onClick={scrollLeft}
              aria-label={t('favorites.prevAria')}
              className="w-11 h-11 text-[#0A0A0A] hover:text-matcha-accent flex items-center justify-center transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] rounded-lg"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={scrollRight}
              aria-label={t('favorites.nextAria')}
              className="w-11 h-11 text-[#0A0A0A] hover:text-matcha-accent flex items-center justify-center transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] rounded-lg"
            >
              <ChevronRight size={22} />
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
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveCategory(key)}
                className={`relative pb-1.5 font-mono text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                  isActive ? 'text-[#0A0A0A] font-bold' : 'text-matcha-muted hover:text-[#0A0A0A]'
                }`}
              >
                <span>{t(`favorites.categories.${key}`)}</span>
                {/* The rule that slides between categories, the same mark the
                    catalogue puts under its current category. It is still one
                    shared element rather than six that switch on and off, so
                    the eye can follow the selection to where it went. */}
                {isActive && (
                  reduced ? (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-matcha-accent" />
                  ) : (
                    <motion.span
                      layoutId="favorites-active-pill"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-matcha-accent"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )
                )}
              </button>
            );
          })}
        </Reveal>

        {/* 3. Main Framed Carousel Container with Spotlight Tracking */}
        <Reveal y={40} delay={0.16} className="relative border-t border-b border-[#0A0A0A] bg-white overflow-hidden">

          {/* The dividing rules moved from `divide-x` onto the cards themselves.
              `divide-x` styles every child but the first, and which card is
              first changes mid-filter while a card is still animating out. */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-none scroll-smooth"
          >
            {loading ? <div role="status" aria-label={t('common.loading')} className="p-5">
                {slow && (
                  <p className="mb-4 text-xs font-mono text-matcha-muted leading-relaxed">
                    {t('favorites.wakingServer')}
                  </p>
                )}
                <div className="flex gap-4">{[0, 1, 2, 3].map(i => <div key={i} className="w-64 sm:w-72 lg:w-80 shrink-0"><ProductCardSkeleton /></div>)}</div>
              </div>
              : error ? <div role="alert" className="p-6 text-red-900"><p>{t('favorites.loadError')}</p><button onClick={retry} className="mt-3 px-4 py-2 rounded-lg bg-matcha-primary text-white hover:bg-matcha-primary-dark">{t('common.retry')}</button></div>
              : !filteredProducts.length ? <div className="m-5 p-6 border border-dashed border-matcha-border rounded-xl"><ShoppingBag aria-hidden="true" /><p className="my-3">{t('favorites.emptyCategory')}</p><button onClick={onExploreCatalog} className="px-4 py-2 rounded-lg bg-matcha-primary text-white hover:bg-matcha-primary-dark">{t('favorites.viewAll')}</button></div>
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
                    className="shrink-0 border-r border-matcha-border last:border-r-0"
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
