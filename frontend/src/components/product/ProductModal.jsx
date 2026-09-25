import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Heart, 
  ShoppingBag, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Ruler, 
  ChevronDown, 
  AlertCircle 
} from 'lucide-react';
import { handleImageError, webpSrc } from '../../utils/imageFallback';
import { wash, inkOn, needsEdge } from '../../utils/dye';
import { describeProduct } from '../../utils/productCopy';
import { localizeSpecs } from '../../utils/specCopy';
import { useCart } from '../../context/CartContext.jsx';
import useDialogFocus from '../../hooks/useDialogFocus';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { SHIPPING_OPTIONS as SHIPPING_RATES, FREE_SHIPPING_THRESHOLD } from '../../config/shipping';

export default function ProductModal({ product, onClose, onAddToCart, onToggleWishlist, isWishlisted = false }) {
  const { addToCart: contextAddToCart } = useCart();
  const { showToast } = useToast();
  const { t, lang } = useLanguage();

  // Normalize products without explicit variants so all image/color controls can use
  // one consistent list shape.
  const variants = product?.variants && product.variants.length > 0
    ? product.variants
    : [
        {
          color: product?.initialVariant?.color || product?.color || null,
          colorHex: product?.initialVariant?.colorHex || product?.colorHex || null,
          image: product?.initialVariant?.image || product?.image
            || '/images/products/standalone/mustard_sweater.jpg'
        }
      ];

  // Missing size data is not guessed. Only a single supplied size is preselected;
  // multiple options require an explicit customer choice.
  const sizeList = Array.isArray(product?.sizes) ? product.sizes.filter(Boolean) : [];
  const [activeVariant, setActiveVariant] = useState(variants[0]);
  const [selectedSize, setSelectedSize] = useState(
    sizeList.length === 1 ? sizeList[0] : null
  );
  /* The catalogue card has its own quantity stepper, and choosing a size opens
     this modal. The card sends what was chosen as `initialQuantity`; this used
     to start at 1 regardless, so three on the card became one in the bag. */
  const startingQuantity = (p) => {
    const n = parseInt(p?.initialQuantity, 10);
    return n > 0 ? n : 1;
  };
  const [quantity, setQuantity] = useState(() => startingQuantity(product));

  const isInitiallyWishlisted = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('matcha_wishlist') || '[]');
      return saved.some(item => item.id === product?.id);
    } catch {
      return Boolean(isWishlisted);
    }
  };

  const [wishlistActive, setWishlistActive] = useState(isInitiallyWishlisted);

  useEffect(() => {
    setWishlistActive(isInitiallyWishlisted());
  }, [product?.id]);

  const handleWishlistToggle = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    try {
      const saved = JSON.parse(localStorage.getItem('matcha_wishlist') || '[]');
      const exists = saved.some(item => item.id === product?.id);
      let updated;
      if (exists) {
        updated = saved.filter(item => item.id !== product?.id);
        setWishlistActive(false);
        showToast(t('product.removedToast', { name: product?.name }), 'info');
      } else {
        updated = [...saved, { id: product?.id, name: product?.name, price: product?.price, image: activeVariant.image }];
        setWishlistActive(true);
        showToast(t('product.savedToast', { name: product?.name }), 'success');
      }
      localStorage.setItem('matcha_wishlist', JSON.stringify(updated));
    } catch (err) {
      console.warn('Wishlist storage error:', err);
    }
    if (onToggleWishlist) onToggleWishlist(product);
  };

  const [addedAnimation, setAddedAnimation] = useState(false);
  const [imageFade, setImageFade] = useState(false);
  const [galleryImage, setGalleryImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Gallery entries may be global or tied to the currently selected color.
  const gallery = (product?.gallery || []).filter(g => !g.color || g.color === activeVariant.color);
  // Changing product or color returns the main frame to its primary variant image and resets loading state.
  useEffect(() => {
    setGalleryImage(null);
    setImageLoading(true);
    setImageError(false);
  }, [product?.id, activeVariant.image, activeVariant.color]);

  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [galleryImage?.url]);
  const [showFitGuide, setShowFitGuide] = useState(false);
  // Raised only when someone asks to buy without having chosen a size, so the
  // message is an answer to an action rather than a standing warning.
  const [needsSize, setNeedsSize] = useState(false);
  const sizeRef = useRef(null);
  const [activeAccordion, setActiveAccordion] = useState(null); // 'materials' | 'care' | 'status'

  // Store confirmation panel. A field the catalogue has not filled in still reads
  // as awaiting the store; one that is filled is shown, and while the record is
  // marked as sample data each value carries a tag saying so, because a fabric
  // composition or a certification is a claim and should never look verified
  // when nobody has verified it.
  const specs = localizeSpecs(product?.specs, lang) || {};
  const isSampleSpec = specs.isSampleData === true;
  const specRows = [
    { label: t('specs.fabric'), value: specs.fabricComposition },
    { label: t('specs.model'), value: specs.modelMeasurements },
    { label: t('specs.origin'), value: specs.countryOfOrigin },
    {
      label: t('specs.certs'),
      value: Array.isArray(specs.certifications) ? specs.certifications.join(', ') : specs.certifications,
    },
  ];

  // Reset transient modal choices when a different product opens. A variant selected
  // on the source card is preserved through product.initialVariant.
  useEffect(() => {
    if (product) {
      const initialVariant = product.initialVariant || (product.variants && product.variants.length > 0
        ? product.variants[0]
        : { color: product.color || null, colorHex: product.colorHex || null, image: product.image });
      setActiveVariant(initialVariant);
      const list = Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
      setSelectedSize(list.length === 1 ? list[0] : null);
      setQuantity(startingQuantity(product));
      setShowFitGuide(false);
      setActiveAccordion(null);
      setNeedsSize(false);
    }
  }, [product]);

  // Support Escape-to-close and lock background scrolling while open. Cleanup removes
  // the global listener and restores the page's previous overflow value.
  useEffect(() => {
    if (!product) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [product, onClose]);

  const dialogRef = useRef(null);
  useDialogFocus(dialogRef, Boolean(product));

  // No selected product means there is no modal or backdrop to render.
  if (!product) return null;

  const handleVariantChange = (v) => {
    if (v.image === activeVariant.image && v.color === activeVariant.color) return;
    // Fade the old image before committing the new variant.
    setImageFade(true);
    setTimeout(() => {
      setActiveVariant(v);
      setImageFade(false);
    }, 150);
  };

  const handleAdd = () => {
    // The button is live whether or not a size is chosen. Asking to buy without
    // one is not an error to be prevented, it is a question to be answered — so
    // the answer is put where the choice is, and the page moves there.
    if (!selectedSize) {
      setNeedsSize(true);
      sizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      sizeRef.current?.querySelector('[data-size-option]')?.focus();
      return;
    }

    setNeedsSize(false);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 600);

    const itemToAdd = {
      ...product,
      image: activeVariant.image,
      color: activeVariant.color,
      colorHex: activeVariant.colorHex,
      size: selectedSize,
      quantity: Number(quantity)
    };

    // Prefer a caller-supplied cart action; otherwise use the shared cart context.
    if (onAddToCart) {
      onAddToCart(itemToAdd);
    } else if (contextAddToCart) {
      contextAddToCart(itemToAdd);
    }
  };

  const handleWishlist = (e) => {
    // Reflect the selection immediately and delegate persistence when provided.
    e.stopPropagation();
    setWishlistActive(!wishlistActive);
    if (onToggleWishlist) onToggleWishlist(product);
  };

  // The dye of the variant on screen. Null when the record carries no colour,
  // which the colour UI then leaves out rather than filling in.
  const dyeHex = activeVariant?.colorHex || null;

  const itemPrice = typeof product.price === 'number' ? product.price : 59.99;
  const currentTotal = itemPrice * quantity;
  // Shipping messaging uses the same shared threshold/rate configuration as checkout.
  const isFreeShippingEligible = currentTotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - currentTotal);

  // The backdrop closes the modal; the inner panel stops click and wheel propagation.
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-[#0A0A0A]/85 animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        className="bg-matcha-bg text-[#0A0A0A] max-w-4xl w-full max-h-[92vh] overflow-y-auto overscroll-contain border border-[#0A0A0A] relative animate-modal-pop flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label={t('product.close')}
          className="absolute top-3 right-3 z-30 w-9 h-9 bg-[#0A0A0A] text-matcha-bg hover:bg-matcha-accent flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* LEFT COLUMN: Clean Framed Product Card */}
        <div className="md:w-1/2 bg-matcha-bg p-3 sm:p-4 flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-matcha-border">
          
          {/* One favourite control, not two: the heart that used to sit here
              carried the same action and the same state as the one beside Add
              to bag. */}
          <div className="w-full flex items-center justify-between z-10 mb-2.5">
            {(product.tag || product.season) && (
              <span className="px-2.5 py-1 bg-[#0A0A0A] text-matcha-bg text-[10px] font-mono font-bold tracking-widest uppercase">
                {product.tag || `${product.season} COLLECTION`}
              </span>
            )}
          </div>

          {/* MAIN PRODUCT PHOTO FRAME */}
          <div
            className="w-full flex-1 aspect-4/5 min-h-75 sm:min-h-90 md:min-h-100 overflow-hidden flex items-center justify-center relative p-4 sm:p-6"
            style={{ backgroundColor: dyeHex ? wash(dyeHex) : '#F1F1F1' }}
          >
            {/* Loading Skeleton */}
            {imageLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 animate-pulse z-15">
                <div className="w-8 h-8 rounded-full border-2 border-matcha-primary border-t-transparent animate-spin" />
                <span className="text-[10px] font-mono text-matcha-muted mt-2 uppercase tracking-wider">
                  Loading image…
                </span>
              </div>
            )}

            {/* Error / Fallback Banner */}
            {imageError && (
              <div className="absolute bottom-3 left-3 right-3 bg-[#0A0A0A]/85 text-white px-3 py-2 flex items-center justify-between text-[11px] font-mono z-20 shadow-md">
                <span className="truncate">Image failed — displaying archive fallback</span>
                <button
                  type="button"
                  onClick={() => { setImageLoading(true); setImageError(false); }}
                  className="underline text-matcha-accent hover:text-white shrink-0 ml-2 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            <img
              src={webpSrc(galleryImage?.url || activeVariant.image)}
              data-original-src={galleryImage?.url || activeVariant.image}
              alt={galleryImage?.alt || (activeVariant.color ? `${product.name} in ${activeVariant.color}` : product.name)}
              onLoad={() => { setImageLoading(false); }}
              onError={(e) => {
                setImageLoading(false);
                setImageError(true);
                handleImageError(e);
              }}
              className={`w-full h-full object-contain object-center mix-blend-multiply transition-opacity duration-300 ${
                imageFade || imageLoading ? 'opacity-20' : 'opacity-100'
              }`}
            />

            {!product.inStock && (
              <div className="absolute inset-0 bg-[#0A0A0A]/65 flex items-center justify-center z-25">
                <span className="px-4 py-2 bg-matcha-bg text-[#0A0A0A] text-xs font-mono font-bold uppercase tracking-wider">
                  {t('product.soldOut')}
                </span>
              </div>
            )}
          </div>

          {/* The dye at full strength with its name on it. This replaces the
              badge that floated over the photograph as a 10px dot — the one
              place the true colour is shown without a wash over it. */}
          {dyeHex && (
            <div
              className="w-full px-3 py-1.5"
              style={{
                backgroundColor: dyeHex,
                color: inkOn(dyeHex),
                boxShadow: needsEdge(dyeHex) ? 'inset 0 0 0 1px #DCDCDC' : undefined,
              }}
            >
              <span className="font-mono text-[11px] uppercase tracking-wider truncate">
                {activeVariant.color}
              </span>
            </div>
          )}

          {/* COLOR VARIANT THUMBNAILS */}
          {gallery.length > 0 && <div className="flex flex-wrap gap-2 mt-3" aria-label={t('product.moreImages')}>{gallery.map((g, i) => <button key={g.url} type="button" aria-label={`${t('product.moreImages')} ${i + 1}`} aria-pressed={galleryImage?.url === g.url} onClick={() => setGalleryImage(g)} className="w-14 h-16 border border-matcha-border overflow-hidden hover:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"><img src={webpSrc(g.url)} alt={g.alt || product.name} className="w-full h-full object-contain" /></button>)}</div>}
          {variants.length > 1 && (
            <div className="w-full flex items-center justify-center gap-2 pt-2.5 overflow-x-auto pb-0.5">
              {variants.map((v, i) => {
                const isActive = activeVariant.color === v.color;
                return (
                  <button
                    key={i}
                    onClick={() => handleVariantChange(v)}
                    aria-label={v.color || 'This colourway'}
                    aria-pressed={isActive}
                    className={`w-11 shrink-0 cursor-pointer transition-opacity outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                      isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={webpSrc(v.image)} data-original-src={v.image} alt="" className="w-full h-13 object-cover" />
                    <span
                      className="block h-1.5"
                      style={{ backgroundColor: isActive ? (v.colorHex || '#0A0A0A') : 'transparent' }}
                    />
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Product Specifications & Add to Cart Controls */}
        <div className="md:w-1/2 p-6 sm:p-8 md:p-9 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4 sm:space-y-5">
            
            {/* Header: Title, Category, Rating, Price */}
            <div>
              <div className="flex items-baseline justify-between gap-3 text-xs font-mono text-matcha-muted mb-1.5 pr-10">
                <span className="uppercase">{[product.season, product.category].filter(Boolean).join(' ')}</span>
                <span className="tabular-nums shrink-0">{product.id}</span>
              </div>

              <h2 id="product-modal-title" className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A] uppercase tracking-tight leading-tight">
                {product.name}
              </h2>

              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-2xl sm:text-3xl font-black text-[#0A0A0A]">
                    ${itemPrice.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm line-through text-matcha-muted">
                      ${(typeof product.originalPrice === 'number' ? product.originalPrice : Number(product.originalPrice)).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Rating - Only display when verified data exists, no fake defaults */}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-matcha-muted leading-relaxed">
              {describeProduct(product, lang)}
            </p>

            {/* 1. Interactive Color Swatches */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>{t('product.colour')}: <strong className="text-[#0A0A0A]">{activeVariant.color || t('product.notRecorded')}</strong></span>
                <span className="text-[10px] font-mono text-matcha-muted">
                  {variants.length === 1 ? t('product.oneTone') : t('product.tones', { n: variants.length })}
                </span>
              </div>
              <div className="flex items-stretch gap-1.5 flex-wrap">
                {variants.map((v, idx) => {
                  const isSelected = activeVariant.color === v.color;
                  const hex = v.colorHex;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleVariantChange(v)}
                      aria-label={v.color || 'This colourway'}
                      aria-pressed={isSelected}
                      className={`px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider cursor-pointer outline-hidden transition-shadow focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                        isSelected ? 'ring-2 ring-[#0A0A0A]' : ''
                      }`}
                      style={{
                        backgroundColor: hex || '#F1F1F1',
                        color: hex ? inkOn(hex) : '#666666',
                        boxShadow: !isSelected && (!hex || needsEdge(hex)) ? 'inset 0 0 0 1px #DCDCDC' : undefined,
                      }}
                    >
                      {v.color || '—'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Interactive Size Selector with Functional Fit Guide Button */}
            <div ref={sizeRef} className="scroll-mt-6">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>{t('product.size')}: <strong className="text-[#0A0A0A]">{selectedSize || '—'}</strong></span>
                <button
                  type="button"
                  onClick={() => setShowFitGuide(prev => !prev)}
                  aria-expanded={showFitGuide}
                  className="text-[11px] font-mono font-bold text-matcha-accent hover:text-matcha-accent-hover underline cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Ruler size={13} />
                  <span>{showFitGuide ? t('product.hideFitGuide') : t('product.fitGuide')}</span>
                </button>
              </div>

              {needsSize && (
                <p role="status" className="mb-2 text-xs font-mono text-matcha-accent">
                  {sizeList.length ? t('product.pickSize') : t('product.noSizes')}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {sizeList.map((sz) => (
                  <button
                    key={sz}
                    data-size-option
                    onClick={() => { setSelectedSize(sz); setNeedsSize(false); }}
                    className={`min-w-10 h-10 px-2 text-xs font-mono font-bold uppercase transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                      selectedSize === sz
                        ? 'bg-[#0A0A0A] text-matcha-bg'
                        : 'bg-matcha-bg border border-matcha-border text-[#0A0A0A] hover:border-[#0A0A0A]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {/* Functional Interactive Fit Guide View (Requirement 3) */}
              {showFitGuide && (
                <div className="mt-3 p-3.5 sm:p-4 bg-matcha-bg border border-matcha-border space-y-3 animate-fade-in text-xs">
                  {/* Mandatory Sample Sizing Badge Attached to Table */}
                  <div className="p-2.5 bg-matcha-bg border-l-2 border-matcha-accent text-[#0A0A0A] text-[11px] font-mono flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 text-matcha-accent mt-0.5" />
                    <div>
                      <span className="font-bold">{t('product.sampleBadge')}</span> {t('product.sampleNote')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-matcha-text uppercase">
                      {specs.sizeGuide?.system || t('product.fitGuide')}
                    </span>
                    <span className="text-[10px] text-matcha-muted">{t('product.unitCm')}</span>
                  </div>

                  {/* Shoes Size Guide */}
                  {product.category === 'Shoes' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-[10px] sm:text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-matcha-border text-matcha-muted bg-matcha-bg">
                            <th className="py-1.5 px-2">{t('product.shoe.eu')}</th>
                            <th className="py-1.5 px-2">{t('product.shoe.usMen')}</th>
                            <th className="py-1.5 px-2">{t('product.shoe.usWomen')}</th>
                            <th className="py-1.5 px-2">{t('product.shoe.footLength')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-matcha-border/50">
                          {specs.sizeGuide?.rows?.map((r, i) => (
                            <tr key={i} className={selectedSize === r.size ? 'bg-matcha-primary/10 font-bold text-matcha-primary' : 'text-matcha-text'}>
                              <td className="py-1.5 px-2">{r.size}</td>
                              <td className="py-1.5 px-2">{r.usMen}</td>
                              <td className="py-1.5 px-2">{r.usWomen}</td>
                              <td className="py-1.5 px-2">{r.footLengthCm} cm</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : product.category === 'Accessories' ? (
                    <div className="p-3 bg-matcha-bg border border-matcha-border space-y-1.5">
                      <div className="font-bold text-matcha-text text-xs">
                        {t('product.dimensions')}: <span className="text-[#0A0A0A]">{specs.sizeGuide?.dimensionText || 'One Size (OS)'}</span>
                      </div>
                      <p className="text-[11px] text-matcha-muted leading-relaxed">
                        {specs.sizeGuide?.note || t('product.oneSizeNote')}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-[10px] sm:text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-matcha-border text-matcha-muted bg-matcha-bg">
                            {specs.sizeGuide?.headers?.map((h, i) => (
                              <th key={i} className="py-1.5 px-2">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-matcha-border/50">
                          {specs.sizeGuide?.rows?.map((r, i) => (
                            <tr key={i} className={selectedSize === r.size ? 'bg-matcha-primary/10 font-bold text-matcha-primary' : 'text-matcha-text'}>
                              <td className="py-1.5 px-2">{r.size}</td>
                              {r.chest && <td className="py-1.5 px-2">{r.chest}</td>}
                              {r.waist && <td className="py-1.5 px-2">{r.waist}</td>}
                              {r.hip && <td className="py-1.5 px-2">{r.hip}</td>}
                              {r.length && <td className="py-1.5 px-2">{r.length}</td>}
                              {r.shoulder && <td className="py-1.5 px-2">{r.shoulder}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Measurement Instruction */}
                  {specs.sizeGuide?.measureInstruction && (
                    <div className="pt-2 border-t border-matcha-border/60 text-[10px] text-matcha-muted leading-relaxed">
                      <strong className="text-[#0A0A0A]">{t('product.measure')}:</strong> {specs.sizeGuide.measureInstruction}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Collapsible Accordion: Materials, Care & Store Status (Requirement 3) */}
            <div className="border border-matcha-border overflow-hidden bg-matcha-bg divide-y divide-matcha-border text-xs">
              
              {/* Accordion 1: วัสดุและรูปทรง */}
              <div>
                <button
                  type="button"
                  onClick={() => setActiveAccordion(activeAccordion === 'materials' ? null : 'materials')}
                  aria-expanded={activeAccordion === 'materials'}
                  className="w-full px-4 py-3 text-left font-mono font-bold text-matcha-text flex items-center justify-between hover:bg-matcha-bg transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-matcha-primary" />
                    <span>{t('product.materials')}</span>
                  </span>
                  <ChevronDown size={15} className={`transition-transform duration-200 ${activeAccordion === 'materials' ? 'rotate-180 text-matcha-primary' : 'text-matcha-muted'}`} />
                </button>
                {activeAccordion === 'materials' && (
                  <div className="px-4 pb-3.5 pt-1 space-y-2 text-matcha-muted font-mono text-[11px] bg-matcha-bg/40 animate-fade-in">
                    <div>
                      <span className="font-bold text-[#0A0A0A]">{t('product.silhouette')}:</span> {specs.silhouette || product.fit || 'Relaxed Fit'}
                    </div>
                    <div>
                      <span className="font-bold text-[#0A0A0A]">{t('product.fitDetails')}:</span> {specs.fitDetails || '—'}
                    </div>
                    <div>
                      <span className="font-bold text-[#0A0A0A]">{t('product.materialHint')}:</span> {specs.materialHint || '—'}
                    </div>
                    <div className="p-2 bg-matcha-bg border-l-2 border-matcha-accent text-[#0A0A0A] text-[10px]">
                      <strong>{t('product.fibreLabel')}:</strong> {t('product.fibrePending')}
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: วิธีดูแลรักษา */}
              <div>
                <button
                  type="button"
                  onClick={() => setActiveAccordion(activeAccordion === 'care' ? null : 'care')}
                  aria-expanded={activeAccordion === 'care'}
                  className="w-full px-4 py-3 text-left font-mono font-bold text-matcha-text flex items-center justify-between hover:bg-matcha-bg transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw size={14} className="text-matcha-primary" />
                    <span>{t('product.care')}</span>
                  </span>
                  <ChevronDown size={15} className={`transition-transform duration-200 ${activeAccordion === 'care' ? 'rotate-180 text-matcha-primary' : 'text-matcha-muted'}`} />
                </button>
                {activeAccordion === 'care' && (
                  <div className="px-4 pb-3.5 pt-1 space-y-1.5 text-matcha-muted font-mono text-[11px] bg-matcha-bg/40 animate-fade-in">
                    {(specs.careInstructions || t('product.careDefaults')).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-matcha-primary font-bold">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 3: สถานะข้อมูลสินค้า */}
              <div>
                <button
                  type="button"
                  onClick={() => setActiveAccordion(activeAccordion === 'status' ? null : 'status')}
                  aria-expanded={activeAccordion === 'status'}
                  className="w-full px-4 py-3 text-left font-mono font-bold text-matcha-text flex items-center justify-between hover:bg-matcha-bg transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-matcha-primary" />
                    <span>{t('product.status')}</span>
                  </span>
                  <ChevronDown size={15} className={`transition-transform duration-200 ${activeAccordion === 'status' ? 'rotate-180 text-matcha-primary' : 'text-matcha-muted'}`} />
                </button>
                {activeAccordion === 'status' && (
                  <div className="px-4 pb-3.5 pt-1 space-y-2 text-matcha-muted font-mono text-[11px] bg-matcha-bg/40 animate-fade-in">
                    <div className="flex items-center justify-between py-1 border-b border-matcha-border/40">
                      <span className="font-bold text-[#0A0A0A]">{t('product.specStatus')}:</span>
                      <span className="px-2 py-0.5 bg-[#0A0A0A] text-matcha-bg font-bold text-[10px]">
                        {specs.statusLabel || t('product.sampleBadge')}
                      </span>
                    </div>
                    {specRows.map(({ label, value }, i) => (
                      <div
                        key={label}
                        className={`flex items-start justify-between gap-4 py-1 ${i < specRows.length - 1 ? 'border-b border-matcha-border/40' : ''}`}
                      >
                        <span className="font-bold text-[#0A0A0A] shrink-0">{label}:</span>
                        {value ? (
                          <span className="text-right text-matcha-muted flex items-baseline justify-end gap-1.5 flex-wrap">
                            <span>{value}</span>
                            {isSampleSpec && (
                              <span className="px-1 bg-[#0A0A0A] text-matcha-bg text-[9px] font-bold shrink-0">
                                {t('product.sampleTag')}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-matcha-muted text-right">{t('product.pendingStore')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* 4. Quantity Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider">{t('product.quantity')}</span>
              <div className="flex items-center border border-matcha-border bg-matcha-bg overflow-hidden font-mono text-xs">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-1.5 hover:bg-matcha-bg text-matcha-text font-bold cursor-pointer transition-colors"
                >
                  -
                </button>
                <span className="px-3.5 py-1.5 font-bold min-w-8 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-3 py-1.5 hover:bg-matcha-bg text-matcha-text font-bold cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Actions: Add to Bag Button & Verified Shipping Rules (Requirement 5) */}
          <div className="mt-6 pt-5 border-t border-matcha-border space-y-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleAdd}
                disabled={!product.inStock}
                className={`flex-1 py-4 font-mono font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A0A0A] ${
                  product.inStock
                    ? addedAnimation
                      ? 'bg-matcha-primary text-matcha-bg'
                      : 'bg-[#0A0A0A] hover:bg-matcha-accent text-matcha-bg'
                    : 'bg-matcha-border text-matcha-muted cursor-not-allowed'
                }`}
              >
                <ShoppingBag size={16} />
                <span>
                  {!product.inStock
                    ? t('product.soldOut')
                    : addedAnimation
                      ? t('product.added')
                      : `${t('product.addToBag')} — $${currentTotal.toFixed(2)}`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleWishlistToggle}
                aria-label={wishlistActive ? t('product.wishlistRemove') : t('product.wishlistAdd')}
                className={`p-4 border transition-colors cursor-pointer flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                  wishlistActive
                    ? 'bg-matcha-accent border-matcha-accent text-matcha-bg'
                    : 'bg-matcha-bg border-matcha-border text-matcha-muted hover:text-matcha-accent hover:border-matcha-accent'
                }`}
              >
                <Heart size={18} fill={wishlistActive ? '#F1F1F1' : 'none'} />
              </button>
            </div>

            {/* ค่าส่งมาจากตารางกลางเดียวกับเซิร์ฟเวอร์ — ตัวเลขที่นี่คือตัวแรกที่ผู้ซื้อเห็น */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-matcha-muted pt-1">
              <div className="flex items-center gap-1.5">
                <Truck size={13} className={isFreeShippingEligible ? 'text-matcha-primary' : 'text-matcha-accent'} />
                <span>
                  {isFreeShippingEligible
                    ? t('product.shippingFree', { threshold: FREE_SHIPPING_THRESHOLD })
                    : t('product.shippingStd', {
                        express: SHIPPING_RATES.express,
                        threshold: FREE_SHIPPING_THRESHOLD,
                        remaining: remainingForFreeShipping.toFixed(2),
                      })}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
