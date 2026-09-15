import React, { useState, useEffect } from 'react';
import { 
  X, 
  Heart, 
  Star, 
  ShoppingBag, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Ruler, 
  ChevronDown, 
  AlertCircle 
} from 'lucide-react';
import { handleImageError, webpSrc } from '../../utils/imageFallback';
import { useCart } from '../../context/CartContext.jsx';
import { SHIPPING_OPTIONS as SHIPPING_RATES, FREE_SHIPPING_THRESHOLD } from '../../config/shipping';

export default function ProductModal({ product, onClose, onAddToCart, onToggleWishlist, isWishlisted = false }) {
  const { addToCart: contextAddToCart } = useCart();

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

  const sizeList = Array.isArray(product?.sizes) ? product.sizes.filter(Boolean) : [];
  const [activeVariant, setActiveVariant] = useState(variants[0]);
  const [selectedSize, setSelectedSize] = useState(
    sizeList.length === 1 ? sizeList[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [wishlistActive, setWishlistActive] = useState(isWishlisted);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [imageFade, setImageFade] = useState(false);
  const [galleryImage, setGalleryImage] = useState(null);
  const gallery = (product?.gallery || []).filter(g => !g.color || g.color === activeVariant.color);
  useEffect(() => { setGalleryImage(null); }, [product?.id, activeVariant.image, activeVariant.color]);
  const [showFitGuide, setShowFitGuide] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null); // 'materials' | 'care' | 'status'

  // Store confirmation panel. A field the catalogue has not filled in still reads
  // as awaiting the store; one that is filled is shown, and while the record is
  // marked as sample data each value carries a tag saying so, because a fabric
  // composition or a certification is a claim and should never look verified
  // when nobody has verified it.
  const specs = product?.specs || {};
  const isSampleSpec = specs.isSampleData === true;
  const specRows = [
    { label: 'ส่วนประกอบวัสดุ', value: specs.fabricComposition },
    { label: 'ขนาดตัวนายแบบ', value: specs.modelMeasurements },
    { label: 'ประเทศผู้ผลิต', value: specs.countryOfOrigin },
    {
      label: 'มาตรฐานรับรอง',
      value: Array.isArray(specs.certifications) ? specs.certifications.join(' · ') : specs.certifications,
    },
  ];

  // Sync when product changes
  useEffect(() => {
    if (product) {
      const initialVariant = product.initialVariant || (product.variants && product.variants.length > 0
        ? product.variants[0]
        : { color: product.color || 'Signature', colorHex: product.colorHex || '#2D5A27', image: product.image });
      setActiveVariant(initialVariant);
      const list = Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
      setSelectedSize(list.length === 1 ? list[0] : null);
      setQuantity(1);
      setShowFitGuide(false);
      setActiveAccordion(null);
    }
  }, [product]);

  // Handle ESC key press & body scroll lock
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

  if (!product) return null;

  const handleVariantChange = (v) => {
    if (v.image === activeVariant.image && v.color === activeVariant.color) return;
    setImageFade(true);
    setTimeout(() => {
      setActiveVariant(v);
      setImageFade(false);
    }, 150);
  };

  const handleAdd = () => {
    if (!selectedSize) return;

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

    if (onAddToCart) {
      onAddToCart(itemToAdd);
    } else if (contextAddToCart) {
      contextAddToCart(itemToAdd);
    }
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    setWishlistActive(!wishlistActive);
    if (onToggleWishlist) onToggleWishlist(product);
  };

  const itemPrice = typeof product.price === 'number' ? product.price : 59.99;
  const currentTotal = itemPrice * quantity;
  const isFreeShippingEligible = currentTotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - currentTotal);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        className="bg-[#FAF8F5] text-[#2D231E] rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto overscroll-contain shadow-2xl border border-[#D9D3C7] relative animate-modal-pop flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-[#2D231E] hover:text-white border border-[#D9D3C7] flex items-center justify-center text-sm font-bold text-[#2D231E] transition-all cursor-pointer shadow-md"
        >
          <X size={18} />
        </button>

        {/* LEFT COLUMN: Clean Framed Product Card */}
        <div className="md:w-1/2 bg-[#FAF8F5] p-3 sm:p-4 flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-[#D9D3C7]">
          
          {/* Top Bar inside Left Column: Tag & Wishlist */}
          <div className="w-full flex items-center justify-between z-10 mb-2.5 px-1">
            <span className="px-3 py-1 bg-[#2D231E] text-[#D0DEC6] text-[10px] font-mono font-bold tracking-widest uppercase rounded-lg shadow-2xs">
              {product.tag || `${product.season} COLLECTION`}
            </span>
            <button
              onClick={handleWishlist}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                wishlistActive 
                  ? 'bg-rose-50 border-rose-300 text-rose-600' 
                  : 'bg-white border-[#D9D3C7] text-[#6B5E55] hover:text-rose-500 hover:border-rose-300'
              }`}
            >
              <Heart size={16} className={wishlistActive ? 'fill-rose-500 text-rose-500' : ''} />
            </button>
          </div>

          {/* MAIN PRODUCT PHOTO FRAME */}
          <div className="w-full flex-1 aspect-4/5 min-h-75 sm:min-h-90 md:min-h-100 rounded-2xl overflow-hidden bg-white border border-[#D9D3C7] shadow-sm flex items-center justify-center relative group p-4 sm:p-6">
            <img 
              src={webpSrc(galleryImage?.url || activeVariant.image)} data-original-src={galleryImage?.url || activeVariant.image}
              alt={galleryImage?.alt || `${product.name} - ${activeVariant.color}`}
              onError={handleImageError}
              className={`w-full h-full object-contain object-center transition-all duration-300 group-hover:scale-102 ${
                imageFade ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
              }`}
            />
            
            {/* Color Overlay Badge on Image */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-[#2D231E]/85 backdrop-blur-xs text-white text-[10px] font-mono rounded-lg flex items-center gap-1.5 shadow-sm">
              <span 
                className="w-2.5 h-2.5 rounded-full border border-white/50"
                style={{ backgroundColor: activeVariant.colorHex }}
              />
              <span>{activeVariant.color}</span>
            </div>

            {/* Sold Out Overlay */}
            {!product.inStock && (
              <div className="absolute inset-0 bg-[#2D231E]/60 backdrop-blur-[1px] flex items-center justify-center z-25">
                <span className="px-4 py-2 bg-white text-[#2D231E] text-xs font-mono font-bold uppercase tracking-wider rounded-xl shadow-lg">
                  Sold Out • สินค้าหมดชั่วคราว
                </span>
              </div>
            )}
          </div>

          {/* COLOR VARIANT THUMBNAILS */}
          {gallery.length > 0 && <div className="flex flex-wrap gap-2 mt-3" aria-label="รูปเพิ่มเติมของสินค้า">{gallery.map((g, i) => <button key={g.url} type="button" aria-label={`ดูรูป ${i + 1}: ${g.alt || product.name}`} aria-pressed={galleryImage?.url === g.url} onClick={() => setGalleryImage(g)} className="w-14 h-16 border border-[#D9D3C7] rounded-lg overflow-hidden hover:border-[#2D5A27] focus-visible:ring-2 focus-visible:ring-[#2D5A27]"><img src={webpSrc(g.url)} alt={g.alt || product.name} className="w-full h-full object-contain" /></button>)}</div>}
          {variants.length > 1 && (
            <div className="w-full flex items-center justify-center gap-2 pt-2.5 overflow-x-auto pb-0.5">
              {variants.map((v, i) => {
                const isActive = activeVariant.color === v.color;
                return (
                  <button
                    key={i}
                    onClick={() => handleVariantChange(v)}
                    title={v.color}
                    className={`w-11 h-13 rounded-lg overflow-hidden border-2 transition-all cursor-pointer relative shrink-0 ${
                      isActive 
                        ? 'border-[#2D5A27] scale-105 shadow-md ring-2 ring-[#2D5A27]/30' 
                        : 'border-[#D9D3C7] opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img src={webpSrc(v.image)} data-original-src={v.image} alt={v.color} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Sample Data Notice Under Photo */}
          <div className="w-full mt-2 text-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200/80 text-[10px] font-mono text-amber-900">
              <AlertCircle size={11} className="text-amber-600" />
              <span>ข้อมูลตัวอย่าง รอยืนยันจากร้าน (Sample Spec)</span>
            </span>
          </div>

        </div>

        {/* RIGHT COLUMN: Product Specifications & Add to Cart Controls */}
        <div className="md:w-1/2 p-6 sm:p-8 md:p-9 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4 sm:space-y-5">
            
            {/* Header: Title, Category, Rating, Price */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#6B5E55] mb-1.5 flex-wrap">
                <span className="text-[#2D5A27] font-bold uppercase">{product.season} Drop</span>
                <span>•</span>
                <span className="uppercase">{product.category}</span>
                <span>•</span>
                <span>{product.id}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D231E] uppercase tracking-tight leading-tight">
                {product.name}
              </h2>

              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-2xl sm:text-3xl font-black text-[#2D231E]">
                    ${itemPrice.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm line-through text-[#6B5E55]">
                      ${(typeof product.originalPrice === 'number' ? product.originalPrice : Number(product.originalPrice)).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Rating - Only display when verified data exists, no fake defaults */}
                {product.rating && product.reviewsCount ? (
                  <div className="flex items-center gap-1 text-xs font-mono text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                    <Star size={13} className="fill-amber-500 text-amber-500" />
                    <span>{product.rating} ({product.reviewsCount} reviews)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-[#8C7E74] bg-[#FAF8F5] border border-[#D9D3C7] px-2 py-0.5 rounded-lg">
                    <span>ยังไม่มีคะแนนรีวิว</span>
                  </div>
                )}
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
              <div className="flex items-center gap-2 flex-wrap">
                {variants.map((v, idx) => {
                  const isSelected = activeVariant.color === v.color;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleVariantChange(v)}
                      title={v.color}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#2D5A27] bg-[#2D5A27]/10 text-[#2D5A27] font-bold shadow-2xs ring-1 ring-[#2D5A27]'
                          : 'border-[#D9D3C7] bg-white text-[#2D231E] hover:border-[#6B5E55]'
                      }`}
                    >
                      <span 
                        className="w-3 h-3 rounded-full border border-black/15 shrink-0" 
                        style={{ backgroundColor: v.colorHex }}
                      />
                      <span>{v.color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Interactive Size Selector with Functional Fit Guide Button */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>Size: <strong className="text-[#2D5A27]">{selectedSize}</strong></span>
                <button
                  type="button"
                  onClick={() => setShowFitGuide(prev => !prev)}
                  aria-expanded={showFitGuide}
                  className="text-[11px] font-mono font-bold text-[#BC5A36] hover:text-[#9E4423] underline cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Ruler size={13} />
                  <span>{showFitGuide ? 'ซ่อนคำแนะนำไซซ์ (Hide Fit Guide)' : 'Fit Guide (คำแนะนำไซซ์)'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {sizeList.map((sz) => (
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

              {/* Functional Interactive Fit Guide View (Requirement 3) */}
              {showFitGuide && (
                <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#D9D3C7] shadow-sm space-y-3 animate-fade-in text-xs">
                  {/* Mandatory Sample Sizing Badge Attached to Table */}
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-mono flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-bold">[ป้ายกำกับ: ข้อมูลตัวอย่าง รอยืนยันจากร้าน]</span>: ตารางวัดขนาดนี้เป็นข้อมูลมาตรฐานสากลจำลอง อยู่ระหว่างรอยืนยันสเปกจริงจากแบรนด์ MatchA
                    </div>
                  </div>

                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-[#2D231E] uppercase">
                      {product.specs?.sizeGuide?.system || 'Size & Fit Specification'}
                    </span>
                    <span className="text-[10px] text-[#6B5E55]">หน่วยวัด: เซนติเมตร (cm)</span>
                  </div>

                  {/* Shoes Size Guide */}
                  {product.category === 'Shoes' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-[10px] sm:text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#D9D3C7] text-[#6B5E55] bg-[#FAF8F5]">
                            <th className="py-1.5 px-2">EU Size</th>
                            <th className="py-1.5 px-2">US Men</th>
                            <th className="py-1.5 px-2">US Women</th>
                            <th className="py-1.5 px-2">ความยาวเท้า (cm)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D9D3C7]/50">
                          {product.specs?.sizeGuide?.rows?.map((r, i) => (
                            <tr key={i} className={selectedSize === r.size ? 'bg-[#2D5A27]/10 font-bold text-[#2D5A27]' : 'text-[#2D231E]'}>
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
                    <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#D9D3C7]/70 space-y-1.5">
                      <div className="font-bold text-[#2D231E] text-xs">
                        ขนาดและสัดส่วน: <span className="text-[#2D5A27]">{product.specs?.sizeGuide?.dimensionText || 'One Size (OS)'}</span>
                      </div>
                      <p className="text-[11px] text-[#6B5E55] leading-relaxed">
                        {product.specs?.sizeGuide?.note || 'สินค้าหมวดเครื่องประดับและกระเป๋าออกแบบขนาด One Size เหมาะสำหรับสรีระทั่วไป'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-[10px] sm:text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#D9D3C7] text-[#6B5E55] bg-[#FAF8F5]">
                            {product.specs?.sizeGuide?.headers?.map((h, i) => (
                              <th key={i} className="py-1.5 px-2">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D9D3C7]/50">
                          {product.specs?.sizeGuide?.rows?.map((r, i) => (
                            <tr key={i} className={selectedSize === r.size ? 'bg-[#2D5A27]/10 font-bold text-[#2D5A27]' : 'text-[#2D231E]'}>
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
                  {product.specs?.sizeGuide?.measureInstruction && (
                    <div className="pt-2 border-t border-[#D9D3C7]/60 text-[10px] text-[#6B5E55] leading-relaxed">
                      <strong className="text-[#2D231E]">วิธีวัดสัดส่วน:</strong> {product.specs.sizeGuide.measureInstruction}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Collapsible Accordion: Materials, Care & Store Status (Requirement 3) */}
            <div className="border border-[#D9D3C7] rounded-2xl overflow-hidden bg-white divide-y divide-[#D9D3C7]/70 text-xs">
              
              {/* Accordion 1: วัสดุและรูปทรง */}
              <div>
                <button
                  type="button"
                  onClick={() => setActiveAccordion(activeAccordion === 'materials' ? null : 'materials')}
                  aria-expanded={activeAccordion === 'materials'}
                  className="w-full px-4 py-3 text-left font-mono font-bold text-[#2D231E] flex items-center justify-between hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#2D5A27]" />
                    <span>วัสดุและคุณลักษณะทรง (Materials & Silhouette)</span>
                  </span>
                  <ChevronDown size={15} className={`transition-transform duration-200 ${activeAccordion === 'materials' ? 'rotate-180 text-[#2D5A27]' : 'text-[#6B5E55]'}`} />
                </button>
                {activeAccordion === 'materials' && (
                  <div className="px-4 pb-3.5 pt-1 space-y-2 text-[#6B5E55] font-mono text-[11px] bg-[#FAF8F5]/40 animate-fade-in">
                    <div>
                      <span className="font-bold text-[#2D231E]">ลักษณะทรง (Silhouette):</span> {product.specs?.silhouette || product.fit || 'Relaxed Fit'}
                    </div>
                    <div>
                      <span className="font-bold text-[#2D231E]">รายละเอียดความพอดี:</span> {product.specs?.fitDetails || 'สวมใส่สบาย คัตติ้งสไตล์มินิมอล'}
                    </div>
                    <div>
                      <span className="font-bold text-[#2D231E]">วัตถุดิบแนะนำ:</span> {product.specs?.materialHint || 'ผ้าทอคอลเลกชันคุณภาพดี (ข้อมูลตัวอย่าง)'}
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-900 text-[10px]">
                      ⚠️ <strong>สัดส่วนเส้นใยผ้า:</strong> รอข้อมูลยืนยันจากร้านค้า (ไม่ระบุเป็นข้อเท็จจริงจนกว่าจะมีสเปกทางการ)
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
                  className="w-full px-4 py-3 text-left font-mono font-bold text-[#2D231E] flex items-center justify-between hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw size={14} className="text-[#2D5A27]" />
                    <span>วิธีดูแลรักษา (Garment Care)</span>
                  </span>
                  <ChevronDown size={15} className={`transition-transform duration-200 ${activeAccordion === 'care' ? 'rotate-180 text-[#2D5A27]' : 'text-[#6B5E55]'}`} />
                </button>
                {activeAccordion === 'care' && (
                  <div className="px-4 pb-3.5 pt-1 space-y-1.5 text-[#6B5E55] font-mono text-[11px] bg-[#FAF8F5]/40 animate-fade-in">
                    {(product.specs?.careInstructions || [
                      'ซักเครื่องด้วยน้ำเย็น โหมดถนอมผ้า',
                      'หลีกเลี่ยงการใช้น้ำยาฟอกขาว',
                      'ตากในที่ร่ม หลีกเลี่ยงแดดจัด'
                    ]).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#2D5A27] font-bold">✓</span>
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
                  className="w-full px-4 py-3 text-left font-mono font-bold text-[#2D231E] flex items-center justify-between hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#2D5A27]" />
                    <span>สถานะข้อมูลสินค้า (Store Confirmation Status)</span>
                  </span>
                  <ChevronDown size={15} className={`transition-transform duration-200 ${activeAccordion === 'status' ? 'rotate-180 text-[#2D5A27]' : 'text-[#6B5E55]'}`} />
                </button>
                {activeAccordion === 'status' && (
                  <div className="px-4 pb-3.5 pt-1 space-y-2 text-[#6B5E55] font-mono text-[11px] bg-[#FAF8F5]/40 animate-fade-in">
                    <div className="flex items-center justify-between py-1 border-b border-[#D9D3C7]/40">
                      <span className="font-bold text-[#2D231E]">สถานะสเปก:</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                        {product.specs?.statusLabel || 'ข้อมูลตัวอย่าง รอยืนยันจากร้าน'}
                      </span>
                    </div>
                    {specRows.map(({ label, value }, i) => (
                      <div
                        key={label}
                        className={`flex items-start justify-between gap-4 py-1 ${i < specRows.length - 1 ? 'border-b border-[#D9D3C7]/40' : ''}`}
                      >
                        <span className="font-bold text-[#2D231E] shrink-0">{label}:</span>
                        {value ? (
                          <span className="text-right text-[#6B5E55] flex items-baseline justify-end gap-1.5 flex-wrap">
                            <span>{value}</span>
                            {isSampleSpec && (
                              <span className="px-1 rounded bg-amber-100 text-amber-800 text-[9px] font-bold shrink-0">
                                ตัวอย่าง
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[#8C7E74] text-right">รอข้อมูลยืนยันจากร้านค้า</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* 4. Quantity Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider">Quantity:</span>
              <div className="flex items-center border border-[#D9D3C7] bg-white rounded-xl overflow-hidden font-mono text-xs shadow-2xs">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-1.5 hover:bg-[#FAF8F5] text-[#2D231E] font-bold cursor-pointer transition-colors"
                >
                  -
                </button>
                <span className="px-3.5 py-1.5 font-bold min-w-8 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-3 py-1.5 hover:bg-[#FAF8F5] text-[#2D231E] font-bold cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Actions: Add to Bag Button & Verified Shipping Rules (Requirement 5) */}
          <div className="mt-6 pt-5 border-t border-[#D9D3C7] space-y-3">
            {selectedSize === null && (
              <p className="text-xs text-[#BC5A36] font-mono text-center">
                {sizeList.length > 1 ? 'กรุณาเลือกไซซ์ก่อน' : 'สินค้านี้ยังไม่มีข้อมูลไซซ์'}
              </p>
            )}

            <button
              onClick={handleAdd}
              disabled={!product.inStock || selectedSize === null}
              className={`w-full py-4 rounded-2xl font-mono font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                product.inStock && selectedSize !== null
                  ? addedAnimation 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-[#2D5A27] hover:bg-[#23471E] text-white shadow-[#2D5A27]/25'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingBag size={16} />
              <span>
                {!product.inStock 
                  ? 'Sold Out • สินค้าหมดชั่วคราว'
                  : addedAnimation 
                    ? 'Added to Bag! ✓' 
                    : `Add to Bag • $${currentTotal.toFixed(2)}`}
              </span>
            </button>

            {/* ค่าส่งมาจากตารางกลางเดียวกับเซิร์ฟเวอร์ — ตัวเลขที่นี่คือตัวแรกที่ผู้ซื้อเห็น */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-[#6B5E55] pt-1">
              <div className="flex items-center gap-1.5">
                <Truck size={13} className={isFreeShippingEligible ? 'text-[#2D5A27]' : 'text-[#BC5A36]'} />
                <span>
                  {isFreeShippingEligible 
                    ? `ส่งฟรีทุกแบบ (ยอดถึงเกณฑ์ $${FREE_SHIPPING_THRESHOLD}+)` 
                    : `ส่งมาตรฐานฟรี · ส่งด่วน $${SHIPPING_RATES.express} (ฟรีเมื่อครบ $${FREE_SHIPPING_THRESHOLD} - ขาดอีก $${remainingForFreeShipping.toFixed(2)})`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#2D5A27]" />
                <span>MatchA Archive Prototype (ข้อมูลตัวอย่าง)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
