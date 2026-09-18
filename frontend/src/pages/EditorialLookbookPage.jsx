import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useChangeMotion from '../hooks/useChangeMotion';
import {
  Sparkles,
  X,
  ArrowRight,
  Heart,
  ShoppingBag,
  Check,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import useLookbooks from '../features/media/useLookbooks';
import useCoverCoordinates from '../features/media/useCoverCoordinates';
import ProductModal from '../components/product/ProductModal';
import { handleImageError, webpSrc } from '../utils/imageFallback';
// The palette chips carry their colour name on the colour itself, so they need
// the same ink-contrast rule the catalogue's dye bars use.
import { inkOn } from '../utils/dye';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/* The emoji that used to sit in front of each of these undid the rest of the
   page: a magazine masthead and a weather sticker cannot share a line. The
   season names already say what season they are. */
const SEASONS = [
  { id: 'ALL', label: 'All Issues' },
  { id: 'Spring', label: 'Spring Bloom' },
  { id: 'Summer', label: 'Summer Resort' },
  { id: 'Autumn', label: 'Autumn Earth' },
  { id: 'Winter', label: 'Winter Minimal' }
];

/* The 3D tilt wrapper that used to hold the cover and every spread was
   removed. A photograph that leans toward the pointer and throws a specular
   highlight is a product-card gesture; on an editorial page it fights the
   image it is supposed to present, and it wrapped each spread in yet another
   floating pane on a page that already had too many. The photographs are now
   flat rectangles that sit on the page. */

export default function EditorialLookbookPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { looks: curatedEditorialSpreads, loading, error, retry } = useLookbooks();
  const [purchaseItem, setPurchaseItem] = useState(null);

  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const editorialMotionRef = useChangeMotion(selectedSeason);
  const [selectedSpread, setSelectedSpread] = useState(null);

  // เลือกค้างไว้ด้วยการคลิก - ต้องอยู่จนกว่าจะคลิกอีกครั้งหรือกด Escape
  const [pinnedItemId, setPinnedItemId] = useState(null);
  // เมาส์ชี้ชั่วคราว
  const [hoveredItemId, setHoveredItemId] = useState(null);
  // คีย์บอร์ดโฟกัส
  const [focusedItemId, setFocusedItemId] = useState(null);

  const [likedLooks, setLikedLooks] = useState({});
  const [addedItems, setAddedItems] = useState({});
  const [addedEntireLook, setAddedEntireLook] = useState(false);
  const ambientMotion = true;
  const [isZoomed, setIsZoomed] = useState(false);

  // ล้างสถานะเมื่อเปลี่ยนฤดูกาล เพื่อไม่ให้เหลือสถานะของ Look เก่า
  useEffect(() => {
    setPinnedItemId(null);
    setHoveredItemId(null);
    setFocusedItemId(null);
  }, [selectedSeason]);

  // Filter spreads
  const filteredSpreads = useMemo(() => {
    if (selectedSeason === 'ALL') return curatedEditorialSpreads;
    return curatedEditorialSpreads.filter(
      (s) => s.season.toLowerCase() === selectedSeason.toLowerCase()
    );
  }, [selectedSeason, curatedEditorialSpreads]);

  // Cover story is the first spread in filtered list
  const coverStory = filteredSpreads[0] || curatedEditorialSpreads?.[0] || null;
  const remainingSpreads = filteredSpreads.length > 0 ? filteredSpreads.slice(1) : [];
  const { imageRef: coverImageRef, position: coverPosition } = useCoverCoordinates(coverStory?.heroImage);

  // Keyboard navigation for Lightbox & Hotspot Pin
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedSpread) {
          setSelectedSpread(null);
          setIsZoomed(false);
        } else if (pinnedItemId) {
          setPinnedItemId(null);
        }
        return;
      }
      if (!selectedSpread) return;
      if (e.key === 'ArrowRight') {
        handleNextSpread();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSpread();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSpread, filteredSpreads, pinnedItemId]);

  const handleNextSpread = () => {
    if (!selectedSpread) return;
    const currentIndex = filteredSpreads.findIndex((s) => s.id === selectedSpread.id);
    const nextIndex = (currentIndex + 1) % filteredSpreads.length;
    setSelectedSpread(filteredSpreads[nextIndex]);
    setIsZoomed(false);
  };

  const handlePrevSpread = () => {
    if (!selectedSpread) return;
    const currentIndex = filteredSpreads.findIndex((s) => s.id === selectedSpread.id);
    const prevIndex = (currentIndex - 1 + filteredSpreads.length) % filteredSpreads.length;
    setSelectedSpread(filteredSpreads[prevIndex]);
    setIsZoomed(false);
  };

  const toggleLike = (e, id) => {
    e.stopPropagation();
    setLikedLooks((prev) => {
      const next = !prev[id];
      if (next) showToast('Saved editorial look to your private vault! 🤍');
      return { ...prev, [id]: next };
    });
  };

  const getItemSize = (item) => {
    if (item.size) return item.size;
    if (item.sizes && item.sizes.length > 0) return item.sizes[0];
    const cat = (item.category || '').toLowerCase();
    if (cat.includes('access') || cat.includes('bag') || cat.includes('scarf') || cat.includes('jewelry')) return 'OS';
    if (cat.includes('shoe') || cat.includes('boot') || cat.includes('sneaker')) return 'EU 40';
    return 'M';
  };

  const handleQuickAdd = (e, item) => {
    e.stopPropagation();
    if (loading || item.inStock !== true) {
      showToast('สินค้านี้หมดสต็อกชั่วคราว', 'error');
      return;
    }
    if (!item.sizes || item.sizes.length !== 1) {
      setPurchaseItem({ ...item, id: item.productId || item.id, name: item.name || item.title });
      return;
    }
    const itemId = item.productId || item.id;
    addToCart({
      id: itemId,
      name: item.name || item.title,
      price: item.price,
      image: item.image,
      quantity: 1,
      size: getItemSize(item),
      color: item.color || 'Artisan Default'
    });

    // Trigger micro-animation state for this button
    setAddedItems((prev) => ({ ...prev, [itemId]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [itemId]: false }));
    }, 1600);

    showToast(`Added ${item.name || item.title} to bag! 🛒`, 'success');
  };

  const handleAddEntireLook = (spread) => {
    if (loading) return;
    const needsSelection = spread.shoppableItems.find(item => item.inStock && item.sizes?.length !== 1);
    if (needsSelection) {
      showToast('กรุณาเลือกไซซ์ของแต่ละชิ้นก่อนเพิ่มลงถุง', 'info');
      setPurchaseItem(needsSelection);
      return;
    }
    const availableItems = (spread.shoppableItems || []).filter(item => item.inStock !== false);
    const outOfStockItems = (spread.shoppableItems || []).filter(item => item.inStock === false);

    if (availableItems.length === 0) {
      showToast('ไม่สามารถเพิ่มชุดได้ เนื่องจากสินค้าทั้งหมดในเซ็ตนี้หมดสต็อกชั่วคราว', 'error');
      return;
    }

    availableItems.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
        size: getItemSize(item),
        color: item.color || 'Artisan'
      });
    });

    setAddedEntireLook(true);
    setTimeout(() => setAddedEntireLook(false), 2000);

    if (outOfStockItems.length > 0) {
      const oosNames = outOfStockItems.map(i => i.name).join(', ');
      showToast(`Added ${availableItems.length} items to bag (Excluding ${oosNames} - out of stock)`, 'info');
    } else {
      showToast(`Added full ${spread.title} look (${availableItems.length} items) to bag! ✨`, 'success');
    }
  };

  // Determine if a hotspot or item is active (synchronized selection state)
  const hsKey = (hs) => hs.productId || hs.id;
  // ภาพกับรายการต้องอ่านจากค่าเดียวกัน จะได้ไม่เลือกคนละชิ้น
  // ลำดับความสำคัญ: คลิกค้าง > คีย์บอร์ดโฟกัส > เมาส์ชี้
  const activeItemId = pinnedItemId ?? focusedItemId ?? hoveredItemId;
  const isHotspotActive = (hs) => Boolean(activeItemId) && hsKey(hs) === activeItemId;
  const isItemActive = (item) => Boolean(activeItemId) && item.id === activeItemId;

  if (!curatedEditorialSpreads?.length || !coverStory) {
    return (
      <div className="max-w-3xl mx-auto my-16 p-8 border border-dashed border-[#DCDCDC] rounded-3xl bg-white text-center shadow-sm">
        <h1 className="text-2xl font-bold text-[#000000]">{loading ? 'กำลังโหลด Lookbook' : 'ยังไม่มี Lookbook ที่เผยแพร่'}</h1>
        <p className="my-4 text-xs font-mono text-[#666666]">กลับมาดูลุคใหม่ของเราได้เร็ว ๆ นี้ หรือลองเลือกซีซันอื่น</p>
        <button
          disabled={loading}
          onClick={retry}
          className="px-5 py-2.5 bg-[#000000] text-white font-mono text-xs font-bold rounded-xl cursor-pointer hover:bg-black/80 transition-all disabled:opacity-50"
        >
          {loading ? 'กำลังโหลด...' : 'โหลดใหม่'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F1F1F1] text-[#000000] min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14">
        {purchaseItem && <ProductModal product={purchaseItem} onClose={() => setPurchaseItem(null)} />}
        {loading && <div role="status" aria-label="กำลังโหลดข้อมูลสินค้า" className="h-16 rounded-xl bg-[#EAE5DB]" />}
        {error && <div role="alert" className="p-4 rounded-xl border border-[#C91D1D] bg-[#FFF4ED]">{error} <button onClick={retry} className="underline font-bold ml-3">ลองใหม่</button></div>}

        {/* ========================================================================= */}
        {/* 1. EDITORIAL MAGAZINE MASTHEAD & HEADER (VOGUE / JAPANESE STREET STYLE) */}
        {/* ========================================================================= */}
        <header className="space-y-8">

          {/* Masthead rule. The pulsing radar dot that used to lead this line is
              gone: it animated like a live status indicator while reporting
              nothing, and a magazine's issue line is a fact, not a feed. */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[#0A0A0A] font-mono text-[11px] uppercase tracking-[0.18em] text-[#666666]">
            <span className="text-[#0A0A0A] font-bold">Matcha Archive Magazine — Issue No. 04</span>
            <span>Tokyo · Kyoto · Enoshima — 2026 Edition</span>
          </div>

          {/* The title is the design here rather than a line of text with one
              word dressed up: two words, one weight, set as large and as tight
              as the measure allows, with the archive's own subject standing
              behind them. */}
          <div className="relative py-2 sm:py-6">
            <span
              aria-hidden="true"
              className="absolute -top-2 right-0 text-[5.5rem] sm:text-[9rem] lg:text-[12rem] leading-none font-black text-[#042509]/[0.07] pointer-events-none select-none font-serif tracking-tighter"
            >
              街頭美學
            </span>

            <h1 className="relative text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-black uppercase text-[#0A0A0A] tracking-[-0.03em] font-sans leading-[0.85]">
              Editorial<br />Lookbook
            </h1>

            <p className="relative mt-6 text-xs sm:text-sm text-[#666666] font-sans max-w-2xl leading-relaxed">
              ภาพถ่ายแฟชั่นชุดจริงระดับนิตยสาร ถ่ายทอดความงดงามของผ้ามัทฉะและซิลูเอทสตรีทแวร์ญี่ปุ่นในแสงธรรมชาติ พร้อมพิกัดเสื้อผ้าชิ้นจริงแบบอินเทอร์แอคทีฟ (Interactive Shoppable Hotspots)
            </p>
          </div>

          {/* Running ticker. The ✦ prefixes and the interpunct separators were
              chrome standing in for punctuation; a rule between items does the
              same job without decorating every phrase. */}
          <div className="w-full overflow-hidden border-y border-[#DCDCDC] py-2.5 font-mono text-[11px] text-[#666666] tracking-[0.15em] uppercase">
            <div className="animate-marquee whitespace-nowrap flex items-center">
              {[
                'Matcha Archive, Spring to Autumn 2026',
                'High-precision Japanese street silhouettes',
                'Botanical dyed pieces, 100% artisan guarantee',
                'Click any pin on a photograph to shop it',
                'Limited run fabrications in Ginza, Enoshima and Odaiba',
              ].concat([
                'Matcha Archive, Spring to Autumn 2026',
                'High-precision Japanese street silhouettes',
              ]).map((line, i) => (
                <span key={i} className="flex items-center">
                  <span className="px-6">{line}</span>
                  <span aria-hidden="true" className="h-3 w-px bg-[#DCDCDC]" />
                </span>
              ))}
            </div>
          </div>

          {/* Issue navigation, set as reading matter like the catalogue's
              categories, so the two pages navigate in one voice. */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
            <nav aria-label="Filter by issue" className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              {SEASONS.map((s) => {
                const isActive = selectedSeason === s.id;
                const count = s.id === 'ALL'
                  ? curatedEditorialSpreads.length
                  : curatedEditorialSpreads.filter(sp => sp.season.toLowerCase() === s.id.toLowerCase()).length;

                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setSelectedSeason(s.id);
                      setPinnedItemId(null);
                      setHoveredItemId(null);
                      setFocusedItemId(null);
                    }}
                    className={`font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                      isActive
                        ? 'text-[#0A0A0A] font-bold underline underline-offset-[6px] decoration-2 decoration-[#C91D1D]'
                        : 'text-[#666666] hover:text-[#0A0A0A]'
                    }`}
                  >
                    {s.label}
                    <span className="ml-1.5 text-[10px] tabular-nums text-[#999999]">{count}</span>
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => navigate('/mix-match')}
              className="font-mono text-xs uppercase tracking-wider text-[#C91D1D] hover:underline underline-offset-4 cursor-pointer flex items-center gap-1.5 outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
            >
              <span>Open Mix &amp; Match Studio</span>
              <ArrowRight size={13} />
            </button>
          </div>

        </header>

        {/* ========================================================================= */}
        {/* 2. THE COVER STORY: FULL-BLEED EDITORIAL MASTERPIECE WITH 3D TILT & HOTSPOTS */}
        {/* ========================================================================= */}
        {coverStory && (
          <div ref={editorialMotionRef} key={`cover-${coverStory.id}-${selectedSeason}`}>
            {/* The cover runs as a spread: one wide photograph with the story
                set on it, and the essay and the shopping list carried beneath
                in columns. It used to be a bordered, rounded, shadowed pane
                holding a 7/5 split — a product card at magazine scale. */}
            <figure
              className="relative w-full aspect-4/5 sm:aspect-16/10 overflow-hidden bg-[#E4E4E4] cursor-pointer select-none"
              onClick={() => setSelectedSpread(coverStory)}
            >
              <img
                ref={coverImageRef}
                src={webpSrc(coverStory.heroImage)} data-original-src={coverStory.heroImage}
                alt={coverStory.title}
                onError={handleImageError}
                className="w-full h-full object-cover object-center"
              />

              {/* Enough shading to carry type at either end, and no more. */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-black/40 pointer-events-none" />

              <figcaption className="absolute top-5 left-5 right-5 z-10 flex items-start justify-between gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/90 drop-shadow">
                  Cover story — {coverStory.vol} — {coverStory.season}
                </span>

                <button
                  type="button"
                  onClick={(e) => toggleLike(e, coverStory.id)}
                  aria-label="Save this look"
                  aria-pressed={Boolean(likedLooks[coverStory.id])}
                  className="shrink-0 text-white cursor-pointer transition-transform hover:scale-110 outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Heart size={20} className={likedLooks[coverStory.id] ? 'fill-[#C91D1D] text-[#C91D1D]' : 'drop-shadow'} />
                </button>
              </figcaption>

              {/* Interactive garment pins, unchanged in behaviour. The radar
                  rings around each one were removed: five pulsing targets on a
                  photograph read as an alarm, not an invitation. */}
              {coverStory.hotspots && coverStory.hotspots.map((hs) => {
                const active = isHotspotActive(hs);
                return (
                  <div
                    key={hs.id}
                    className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
                    style={coverPosition(hs)}
                  >
                    <button
                      type="button"
                      aria-label={`ไฮไลต์ ${hs.title} บนภาพ`}
                      aria-pressed={pinnedItemId === hsKey(hs)}
                      onMouseEnter={() => setHoveredItemId(hsKey(hs))}
                      onMouseLeave={() => setHoveredItemId(null)}
                      onFocus={() => setFocusedItemId(hsKey(hs))}
                      onBlur={() => setFocusedItemId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinnedItemId((prev) => (prev === hsKey(hs) ? null : hsKey(hs)));
                      }}
                      className="min-h-11 min-w-11 cursor-pointer flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <span
                        className={`block rounded-full border transition-all duration-200 ${
                          active
                            ? 'h-4 w-4 bg-[#C91D1D] border-white'
                            : 'h-3 w-3 bg-white/90 border-white/60 hover:h-4 hover:w-4'
                        }`}
                      />
                    </button>

                    {active && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 bottom-10 w-60 p-3 bg-[#F1F1F1] shadow-xl text-left z-30 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={webpSrc(hs.image)} data-original-src={hs.image}
                            loading="lazy"
                            decoding="async"
                            alt={hs.title}
                            onError={handleImageError}
                            className="w-12 h-14 object-contain bg-white shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-mono uppercase tracking-wider text-[#666666] block">
                              {hs.category || 'Garment'}
                            </span>
                            <div className="text-xs font-bold text-[#0A0A0A] leading-snug truncate">
                              {hs.title}
                            </div>
                            <div className="text-xs font-mono text-[#0A0A0A] mt-0.5">
                              ${hs.price.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={loading || !hs.inStock} onClick={(e) => handleQuickAdd(e, hs)}
                          className="mt-2.5 w-full py-2 bg-[#0A0A0A] hover:bg-[#C91D1D] disabled:bg-[#DCDCDC] disabled:text-[#666666] text-[#F1F1F1] font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          {addedItems[hs.productId || hs.id] ? <Check size={12} /> : <ShoppingBag size={12} />}
                          <span>{addedItems[hs.productId || hs.id] ? 'Added' : !hs.inStock ? 'Unavailable' : 'Add to bag'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* The story lands on the photograph, the way a cover carries its
                  own headline instead of captioning it underneath. */}
              <div className="absolute bottom-0 inset-x-0 z-10 p-5 sm:p-8 text-white pointer-events-none">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
                  {coverStory.theme} — {coverStory.seasonThai}
                </span>
                <h2 className="mt-2 text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.02em] leading-[0.9] max-w-3xl">
                  {coverStory.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-[11px] text-white/80">
                  <span>{coverStory.subtitle}</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    {coverStory.location}
                  </span>
                </div>
              </div>
            </figure>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pt-10">

              <div className="lg:col-span-7 space-y-7">
                {/* The pull quote is set as a pull quote — large, hung off the
                    measure — rather than parked in a tinted rounded box. */}
                <blockquote className="font-serif italic text-xl sm:text-2xl text-[#0A0A0A] leading-snug border-l-2 border-[#C91D1D] pl-5">
                  {coverStory.leadQuote}
                </blockquote>

                <p className="text-sm text-[#666666] leading-relaxed max-w-prose">
                  {coverStory.narrative}
                </p>

                {/* The palette speaks the catalogue's language: solid colour
                    with its name on it, not a dot inside a rounded chip. */}
                <div className="pt-2">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] mb-2">
                    Botanical palette
                  </h3>
                  <div className="flex flex-wrap">
                    {coverStory.palette.map((c, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider"
                        style={{ backgroundColor: c.hex, color: inkOn(c.hex) }}
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="flex items-baseline justify-between pb-3 border-b border-[#0A0A0A] font-mono text-[10px] uppercase tracking-[0.18em]">
                  <h3 className="text-[#0A0A0A] font-bold">Shop this look</h3>
                  <span className="text-[#666666]">{coverStory.shoppableItems.length} pieces</span>
                </div>

                <ul className="divide-y divide-[#DCDCDC]">
                  {coverStory.shoppableItems.map((item) => {
                    const isActive = isItemActive(item);
                    const isPinned = pinnedItemId === item.id;
                    const isAdded = addedItems[item.id];

                    return (
                      <li
                        key={item.id}
                        onMouseEnter={() => setHoveredItemId(item.id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                        onFocus={() => setFocusedItemId(item.id)}
                        onBlur={() => setFocusedItemId(null)}
                        onClick={() => setPinnedItemId((prev) => (prev === item.id ? null : item.id))}
                        className={`flex items-center gap-3 py-3 cursor-pointer transition-colors ${
                          isActive ? 'bg-white' : 'hover:bg-white/60'
                        }`}
                      >
                        {/* The tie to the pin on the photograph is a rule on the
                            edge of the row, not a ring drawn around a card. */}
                        <span
                          aria-hidden="true"
                          className={`self-stretch w-0.5 shrink-0 transition-colors ${
                            isPinned ? 'bg-[#C91D1D]' : isActive ? 'bg-[#0A0A0A]' : 'bg-transparent'
                          }`}
                        />
                        <img
                          src={webpSrc(item.image)} data-original-src={item.image}
                          alt={item.name}
                          loading="lazy"
                          onError={handleImageError}
                          className="w-11 h-13 object-contain bg-white shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#0A0A0A] truncate">{item.name}</div>
                          <div className="text-[11px] font-mono text-[#666666]">
                            {item.color} · ${item.price.toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={loading || !item.inStock} onClick={(e) => handleQuickAdd(e, item)}
                          className="shrink-0 px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#C91D1D] disabled:bg-transparent disabled:text-[#999999] text-[#F1F1F1] font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isAdded ? 'Added' : !item.inStock ? 'Sold out' : 'Add'}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="button"
                  disabled={loading || !coverStory.shoppableItems.some(i => i.inStock)}
                  onClick={() => handleAddEntireLook(coverStory)}
                  className="mt-5 w-full py-3.5 bg-[#C91D1D] hover:bg-[#A81515] disabled:bg-[#DCDCDC] disabled:text-[#666666] text-white font-mono text-xs uppercase tracking-[0.15em] transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addedEntireLook && <Check size={14} />}
                  <span>
                    {addedEntireLook
                      ? `All ${coverStory.shoppableItems.length} pieces added`
                      : 'Add the whole look'}
                  </span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ASYMMETRICAL MAGAZINE SPREADS (EDITORIAL DUO LAYOUTS WITH 3D TILT) */}
        {/* ========================================================================= */}
        <section className="space-y-16 sm:space-y-24">
          
          <div className="flex items-baseline justify-between pb-3 border-b border-[#0A0A0A] font-mono text-[10px] uppercase tracking-[0.18em]">
            <h2 className="font-bold text-[#0A0A0A]">
              Curated seasonal editions
            </h2>
            <span className="text-[#666666]">
              {remainingSpreads.length} feature {remainingSpreads.length === 1 ? 'story' : 'stories'}
            </span>
          </div>

          {remainingSpreads.map((spread, index) => {
            const isEven = index % 2 === 0;

            return (
              <article
                key={spread.id}
                data-reveal="editorial"
                style={{ '--enter-delay': `${(index % 2) * 120}ms` }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start"
              >

                {/* The photograph alternates sides down the page, which is what
                    gives a run of spreads its rhythm. It is a plain rectangle
                    now: no radius, no border, no shadow, and no ambient
                    Ken Burns drift — a photograph that moves on its own while
                    nobody has touched it is wallpaper, not editorial. */}
                <div className={`lg:col-span-7 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>

                  <figure
                    onClick={() => setSelectedSpread(spread)}
                    className="group relative aspect-4/5 sm:aspect-3/4 overflow-hidden bg-[#E4E4E4] cursor-pointer select-none"
                  >
                    <img
                      src={webpSrc(spread.heroImage)} data-original-src={spread.heroImage}
                      loading="lazy"
                      decoding="async"
                      alt={spread.title}
                      onError={handleImageError}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                    <figcaption className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/90">
                      <span className="drop-shadow">{spread.issueDate} — {spread.season}</span>
                      <button
                        type="button"
                        onClick={(e) => toggleLike(e, spread.id)}
                        aria-label="Save this look"
                        aria-pressed={Boolean(likedLooks[spread.id])}
                        className="shrink-0 text-white cursor-pointer transition-transform hover:scale-110 outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <Heart size={17} className={likedLooks[spread.id] ? 'fill-[#C91D1D] text-[#C91D1D]' : 'drop-shadow'} />
                      </button>
                    </figcaption>

                    <div className="absolute bottom-4 inset-x-4 z-10 flex items-end justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/85">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{spread.location}</span>
                      </span>
                      <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity underline underline-offset-4">
                        Open spread
                      </span>
                    </div>
                  </figure>

                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#999999]">
                    {spread.photographer}
                  </p>

                </div>

                {/* Editorial Text & Shoppable Product Column */}
                {/* Drifts against the photograph as the spread passes, the way a
                    magazine gutter reads when you turn the page slowly. */}
                <div
                  data-drift
                  style={{ '--drift-from': '30px', '--drift-to': '-30px' }}
                  className={`lg:col-span-5 space-y-6 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}
                >

                  <div className="space-y-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C91D1D] block">
                      {spread.theme}
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black uppercase text-[#0A0A0A] tracking-[-0.02em] leading-[0.95]">
                      {spread.title}
                    </h3>
                    <p className="font-mono text-[11px] text-[#666666]">
                      {spread.subtitle}
                    </p>
                  </div>

                  <blockquote className="font-serif italic text-lg text-[#0A0A0A] border-l-2 border-[#C91D1D] pl-5 leading-snug">
                    {spread.leadQuote}
                  </blockquote>

                  <p className="text-sm text-[#666666] leading-relaxed">
                    {spread.narrative}
                  </p>

                  <div className="flex flex-wrap">
                    {spread.palette.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider"
                        style={{ backgroundColor: p.hex, color: inkOn(p.hex) }}
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>

                  {/* The garment list was a white rounded panel sitting on a
                      page that is already white. A rule and a list say the same
                      thing without building another container to say it in. */}
                  <div className="pt-2">
                    <div className="flex items-baseline justify-between pb-2 border-b border-[#0A0A0A] font-mono text-[10px] uppercase tracking-[0.18em]">
                      <h4 className="font-bold text-[#0A0A0A]">Key garments</h4>
                      <button
                        type="button"
                        onClick={() => setSelectedSpread(spread)}
                        className="text-[#C91D1D] hover:underline underline-offset-4 cursor-pointer flex items-center gap-1 outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                      >
                        <span>All details</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>

                    <ul className="divide-y divide-[#DCDCDC]">
                      {spread.shoppableItems.map((item) => {
                        const isAdded = addedItems[item.id];
                        return (
                          <li
                            key={item.id}
                            className="flex items-center gap-3 py-3 transition-colors hover:bg-white/60"
                          >
                            <img
                              src={webpSrc(item.image)} data-original-src={item.image}
                              alt={item.name}
                              loading="lazy"
                              onError={handleImageError}
                              className="w-11 h-13 object-contain bg-white shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-[#0A0A0A] block truncate">{item.name}</span>
                              <span className="text-[11px] font-mono text-[#666666]">${item.price.toFixed(2)}</span>
                            </div>
                            <button
                              type="button"
                              disabled={loading || !item.inStock} onClick={(e) => handleQuickAdd(e, item)}
                              className="shrink-0 px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#C91D1D] disabled:bg-transparent disabled:text-[#999999] text-[#F1F1F1] font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                              {isAdded ? 'Added' : !item.inStock ? 'Sold out' : 'Add'}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                </div>

              </article>
            );
          })}

        </section>

        {/* ========================================================================= */}
        {/* 4. FULL SPREAD INSPECTION — keyboard: ← → to page, Escape to close      */}
        {/* ========================================================================= */}
        {selectedSpread && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/90 animate-fade-in select-none"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedSpread.title} — full spread`}
            onClick={() => {
              setSelectedSpread(null);
              setIsZoomed(false);
            }}
          >
            <div
              data-lenis-prevent="true"
              className="bg-[#F1F1F1] text-[#0A0A0A] max-w-5xl w-full h-full sm:h-auto sm:max-h-[92vh] overflow-y-auto overscroll-contain relative flex flex-col md:flex-row animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Paging and close. Three white circles floating over the
                  artwork were the loudest thing in the frame; set as plain
                  marks on the dark plate, they stay available without
                  competing with the photograph they sit on. */}
              <div className="absolute top-3 right-3 z-30 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em]">
                <button
                  type="button"
                  onClick={handlePrevSpread}
                  title="Previous spread (left arrow)"
                  aria-label="Previous spread"
                  className="text-white/80 hover:text-white cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleNextSpread}
                  title="Next spread (right arrow)"
                  aria-label="Next spread"
                  className="text-white/80 hover:text-white cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSpread(null);
                    setIsZoomed(false);
                  }}
                  title="Close (Escape)"
                  aria-label="Close"
                  className="text-white/80 hover:text-white cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* The photograph, on its own plate. */}
              <div className="md:w-3/5 bg-[#0A0A0A] flex flex-col items-center justify-center p-4 relative overflow-hidden shrink-0">
                <div
                  className={`w-full flex items-center justify-center transition-transform duration-500 ${
                    isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  <img
                    src={webpSrc(selectedSpread.heroImage)} data-original-src={selectedSpread.heroImage}
                    alt={selectedSpread.title}
                    onError={handleImageError}
                    className="max-h-[60vh] sm:max-h-[65vh] w-full object-contain select-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="absolute bottom-4 left-4 z-20 text-white/70 hover:text-white font-mono text-[10px] uppercase tracking-[0.15em] flex items-center gap-1.5 transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                >
                  {isZoomed ? <ZoomOut size={12} /> : <ZoomIn size={12} />}
                  <span>{isZoomed ? 'Reset' : 'Zoom 1.5×'}</span>
                </button>

                {selectedSpread.detailImages && (
                  <div className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full pb-1 z-10">
                    {selectedSpread.detailImages.map((img, idx) => (
                      <div key={idx} className="w-16 h-20 overflow-hidden shrink-0">
                        <img src={webpSrc(img)} data-original-src={img} alt="Detail" onError={handleImageError} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* The story and the pieces. */}
              <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between gap-6">

                <div className="space-y-5">

                  <div className="space-y-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C91D1D] block">
                      {selectedSpread.theme} — {selectedSpread.seasonThai}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-[-0.02em] leading-[0.95] text-[#0A0A0A]">
                      {selectedSpread.title}
                    </h2>
                    <p className="font-mono text-[11px] text-[#666666] flex items-center gap-1.5">
                      <MapPin size={11} />
                      {selectedSpread.location}
                    </p>
                  </div>

                  <blockquote className="font-serif italic text-base text-[#0A0A0A] border-l-2 border-[#C91D1D] pl-4 leading-snug">
                    {selectedSpread.leadQuote}
                  </blockquote>

                  <p className="text-xs text-[#666666] leading-relaxed">
                    {selectedSpread.narrative}
                  </p>

                  <div>
                    <h3 className="pb-2 border-b border-[#0A0A0A] font-mono text-[10px] uppercase tracking-[0.18em] font-bold text-[#0A0A0A]">
                      Pieces in this spread
                    </h3>
                    <ul className="divide-y divide-[#DCDCDC] max-h-56 overflow-y-auto">
                      {selectedSpread.shoppableItems.map((item) => {
                        const isAdded = addedItems[item.id];
                        return (
                          <li key={item.id} className="flex items-center gap-3 py-3">
                            <img
                              src={webpSrc(item.image)} data-original-src={item.image}
                              alt={item.name}
                              loading="lazy"
                              onError={handleImageError}
                              className="w-11 h-13 object-contain bg-white shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-[#0A0A0A] truncate">{item.name}</div>
                              <div className="text-[11px] font-mono text-[#666666]">${item.price.toFixed(2)}</div>
                            </div>
                            <button
                              type="button"
                              disabled={loading || !item.inStock} onClick={(e) => handleQuickAdd(e, item)}
                              className="shrink-0 px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#C91D1D] disabled:bg-transparent disabled:text-[#999999] text-[#F1F1F1] font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                              {isAdded ? 'Added' : !item.inStock ? 'Sold out' : 'Add'}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                </div>

                <div className="space-y-2 pt-4 border-t border-[#DCDCDC]">
                  <button
                    type="button"
                    disabled={loading || !selectedSpread.shoppableItems.some(i => i.inStock)}
                    onClick={() => handleAddEntireLook(selectedSpread)}
                    className="w-full py-3.5 bg-[#C91D1D] hover:bg-[#A81515] disabled:bg-[#DCDCDC] disabled:text-[#666666] text-white font-mono text-xs uppercase tracking-[0.15em] transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    Add the whole look
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSpread(null);
                      navigate('/mix-match');
                    }}
                    className="w-full py-2.5 font-mono text-xs uppercase tracking-wider text-[#0A0A0A] hover:text-[#C91D1D] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={13} />
                    <span>Open in Mix &amp; Match Studio</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
