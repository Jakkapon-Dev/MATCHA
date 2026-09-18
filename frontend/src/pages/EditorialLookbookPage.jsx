import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useChangeMotion from '../hooks/useChangeMotion';
import { 
  Sparkles, 
  Camera, 
  Layers, 
  Eye, 
  X, 
  ArrowRight, 
  Compass, 
  Palette, 
  Heart,
  ShoppingBag,
  Maximize2,
  Check,
  Tag,
  Share2,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import useLookbooks from '../features/media/useLookbooks';
import useCoverCoordinates from '../features/media/useCoverCoordinates';
import ProductModal from '../components/product/ProductModal';
import { handleImageError, webpSrc } from '../utils/imageFallback';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const SEASONS = [
  { id: 'ALL', label: 'All Issues', icon: '✦' },
  { id: 'Spring', label: 'Spring Bloom', icon: '🌸' },
  { id: 'Summer', label: 'Summer Resort', icon: '🌊' },
  { id: 'Autumn', label: 'Autumn Earth', icon: '🍵' },
  { id: 'Winter', label: 'Winter Minimal', icon: '❄️' }
];

// Interactive 3D Perspective Tilt Container Component
function TiltCard({ children, className = '', maxTilt = 5, enabled = true, onClick }) {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
  });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = useCallback((e) => {
    if (!enabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPct = (x / rect.width - 0.5) * 2; // -1 to 1
    const yPct = (y / rect.height - 0.5) * 2; // -1 to 1

    const rotX = -yPct * maxTilt;
    const rotY = xPct * maxTilt;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.008, 1.008, 1.008)`,
      transition: 'transform 0.1s ease-out'
    });

    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15
    });
  }, [enabled, maxTilt]);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'
    });
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  return (
    <div
      ref={cardRef}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative will-change-transform ${className}`}
    >
      {children}
      {/* Specular Glare Overlay */}
      {enabled && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.8) 0%, transparent 60%)`,
            opacity: glarePos.opacity
          }}
        />
      )}
    </div>
  );
}

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
        <header className="space-y-6 border-b border-[#DCDCDC] pb-8 text-center sm:text-left">
          
          {/* Top Issue Tagline with Live Pulsing Radar Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs uppercase tracking-widest text-[#666666]">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-[#042509] font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#042509] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#042509]" />
              </span>
              <span>MATCHA ARCHIVE MAGAZINE // ISSUE NO. 04</span>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-3 text-[11px]">
              <span>TOKYO • KYOTO • ENOSHIMA</span>
              <span className="text-[#DCDCDC]">•</span>
              <span>2026 EDITORIAL EDITION</span>
            </div>
          </div>

          {/* Bold Magazine Typography with Floating Drifting Japanese Watermark */}
          <div className="relative py-2 sm:py-4 overflow-hidden sm:overflow-visible">
            {/* Drifting Kanji Watermark */}
            <span className="absolute -top-4 right-2 sm:right-16 text-7xl sm:text-8xl md:text-9xl font-black text-[#042509]/6 pointer-events-none select-none font-serif tracking-tighter animate-card-float-1">
              街頭美學
            </span>
            <span className="absolute -bottom-6 left-1/3 text-5xl sm:text-7xl font-black text-[#C91D1D]/4 pointer-events-none select-none font-serif tracking-widest hidden md:block animate-card-float-2">
              流行文化
            </span>

            <h1 data-enter="wipe" style={{ '--enter-delay': '90ms' }} className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase text-[#000000] tracking-tight font-sans leading-[0.95] drop-shadow-xs">
              Editorial <br />
              <span className="text-[#042509] font-serif italic font-normal">Lookbook</span> Spread
            </h1>

            <p data-enter style={{ '--enter-delay': '190ms' }} className="mt-4 text-xs sm:text-sm text-[#666666] font-sans max-w-2xl leading-relaxed">
              ภาพถ่ายแฟชั่นชุดจริงระดับนิตยสาร ถ่ายทอดความงดงามของผ้ามัทฉะและซิลูเอทสตรีทแวร์ญี่ปุ่นในแสงธรรมชาติ พร้อมพิกัดเสื้อผ้าชิ้นจริงแบบอินเทอร์แอคทีฟ (Interactive Shoppable Hotspots)
            </p>
          </div>

          {/* Editorial Infinite Running Marquee Ticker */}
          <div className="w-full overflow-hidden bg-white/70 backdrop-blur-xs border-y border-[#DCDCDC] py-2 font-mono text-[11px] font-bold text-[#666666] tracking-widest uppercase">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
              <span>✦ MATCHA ARCHIVE // SPRING-AUTUMN 2026 EDITORIAL</span>
              <span>•</span>
              <span className="text-[#042509]">✦ HIGH-PRECISION JAPANESE STREET SILHOUETTES</span>
              <span>•</span>
              <span>✦ BOTANICAL DYED PIECES WITH 100% ARTISAN GUARANTEE</span>
              <span>•</span>
              <span className="text-[#C91D1D]">✦ INTERACTIVE HOTSPOTS: CLICK PINS TO SHOP DIRECTLY</span>
              <span>•</span>
              <span>✦ LIMITED RUN FABRICATIONS IN GINZA, ENOSHIMA & ODAIBA</span>
              <span>•</span>
              <span>✦ MATCHA ARCHIVE // SPRING-AUTUMN 2026 EDITORIAL</span>
            </div>
          </div>

          {/* Seasonal Switcher Navigation Bar (Animated Pills + Motion Controls) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            
            {/* Filter Pills with Spring Animation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full font-mono text-xs">
              {SEASONS.map((s) => {
                const isActive = selectedSeason === s.id;
                const count = s.id === 'ALL' 
                  ? curatedEditorialSpreads.length 
                  : curatedEditorialSpreads.filter(sp => sp.season.toLowerCase() === s.id.toLowerCase()).length;

                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSeason(s.id);
                      setPinnedItemId(null);
                      setHoveredItemId(null);
                      setFocusedItemId(null);
                    }}
                    className={`px-4 py-2 rounded-full font-bold uppercase transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transform active:scale-95 ${
                      isActive
                        ? 'bg-[#042509] text-white shadow-md scale-102 ring-2 ring-[#042509]/25'
                        : 'bg-white border border-[#DCDCDC] text-[#666666] hover:border-[#042509] hover:text-[#000000]'
                    }`}
                  >
                    <span className="text-sm">{s.icon}</span>
                    <span>{s.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-[#666666]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mix & Match CTA */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate('/mix-match')}
                className="px-4 py-2 bg-white hover:bg-[#000000] hover:text-white border border-[#DCDCDC] rounded-full text-xs font-mono font-bold uppercase transition-all duration-300 flex items-center gap-1.5 shadow-xs cursor-pointer group active:scale-95"
              >
                <Sparkles size={13} className="text-[#042509] group-hover:text-[#518F5C] transition-colors" />
                <span>Open Mix & Match Studio</span>
              </button>
            </div>

          </div>

        </header>

        {/* ========================================================================= */}
        {/* 2. THE COVER STORY: FULL-BLEED EDITORIAL MASTERPIECE WITH 3D TILT & HOTSPOTS */}
        {/* ========================================================================= */}
        {coverStory && (
          <div ref={editorialMotionRef} key={`cover-${coverStory.id}-${selectedSeason}`}>
            <TiltCard 
              enabled={true} 
              maxTilt={2.5}
              className="relative bg-white rounded-3xl sm:rounded-[2.5rem] border border-[#DCDCDC] overflow-hidden shadow-xl group/hero transition-all duration-500 hover:border-[#042509]/40"
            >
              
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                
                {/* Left Column: Full-Height Interactive Photo with Pulsing Garment Hotspots */}
                <div 
                  className="lg:col-span-7 relative min-h-[500px] sm:min-h-[600px] lg:min-h-[720px] bg-[#F1F1F1] overflow-hidden cursor-pointer select-none"
                  onClick={() => setSelectedSpread(coverStory)}
                >
                  <img
                    ref={coverImageRef}
                    src={webpSrc(coverStory.heroImage)} data-original-src={coverStory.heroImage}
                    alt={coverStory.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover object-center"
                  />

                  {/* Film Shadow Gradient */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />

                  {/* Top Issue Tag */}
                  <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#000000] font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                      <Flame size={12} className="text-[#C91D1D]" />
                      <span>COVER STORY • {coverStory.vol}</span>
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-[#042509] text-white font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      {coverStory.season} Drop
                    </span>
                  </div>

                  {/* Like / Favorite Button with Pop Animation */}
                  <button
                    onClick={(e) => toggleLike(e, coverStory.id)}
                    className={`absolute top-6 right-6 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer ${
                      likedLooks[coverStory.id]
                        ? 'bg-rose-500 text-white scale-110 shadow-rose-500/30'
                        : 'bg-white/90 text-[#000000] hover:bg-white hover:scale-108'
                    }`}
                    aria-label="Favorite Look"
                  >
                    <Heart 
                      size={19} 
                      className={`transition-transform duration-300 ${
                        likedLooks[coverStory.id] ? 'fill-white scale-110' : 'hover:scale-110'
                      }`} 
                    />
                  </button>

                  {/* Interactive Pulsing Hotspots (Multi-Ring Radar & Synced Highlight) */}
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
                          className="min-h-11 min-w-11 p-0.5 rounded-full cursor-pointer flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#042509] focus-visible:outline-offset-2"
                        >
                          {/* Multi-Ring Pulsing Radar Waves */}
                          <div className="relative flex h-10 w-10 items-center justify-center">
                            <span className="animate-radar-ring-1 absolute inline-flex h-full w-full rounded-full bg-white/70" />
                            <span className="animate-radar-ring-2 absolute inline-flex h-full w-full rounded-full bg-[#042509]/60" />
                            
                            {/* Inner Core Pin with Spring Hover */}
                            <span className={`relative inline-flex rounded-full items-center justify-center font-bold text-xs shadow-2xl border-2 transition-all duration-300 ${
                              active 
                                ? 'h-8 w-8 bg-[#042509] text-white border-white scale-115 shadow-[#042509]/50'
                                : 'h-6 w-6 bg-white text-[#042509] border-[#042509] hover:scale-115'
                            }`}>
                              {active ? '✦' : '+'}
                            </span>
                          </div>
                        </button>

                        {/* Hotspot Floating Product Card (Spring Reveal) */}
                        {active && (
                          <div 
                            className="absolute left-1/2 -translate-x-1/2 bottom-12 w-64 p-3.5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#DCDCDC] text-left space-y-2.5 animate-scale-up z-30 pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-3">
                              <img 
                                src={webpSrc(hs.image)} data-original-src={hs.image} 
                                loading="lazy"
                                decoding="async"
                                alt={hs.title} 
                                onError={handleImageError} 
                                className="w-12 h-14 object-contain rounded-xl bg-[#F1F1F1] shrink-0 border border-[#DCDCDC]" 
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-mono uppercase text-[#C91D1D] font-bold block">
                                  {hs.category || 'Garment'}
                                </span>
                                <div className="text-xs font-bold text-[#000000] leading-snug truncate">
                                  {hs.title}
                                </div>
                                <div className="text-sm font-mono font-black text-[#042509] mt-0.5">
                                  ${hs.price.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            <button
                              disabled={loading || !hs.inStock} onClick={(e) => handleQuickAdd(e, hs)}
                              className={`w-full py-2 font-mono text-[10px] font-bold uppercase rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer ${
                                addedItems[hs.productId || hs.id]
                                  ? 'bg-emerald-600 text-white animate-cart-pop'
                                  : 'bg-[#042509] hover:bg-[#1E3D1A] text-white active:scale-98'
                              }`}
                            >
                              {addedItems[hs.productId || hs.id] ? (
                                <>
                                  <Check size={12} className="stroke-[3]" />
                                  <span>Added to Bag!</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag size={12} />
                                  <span>Quick Add to Bag</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Bottom Image Caption & Inspect Prompt */}
                  <div className="absolute bottom-6 inset-x-6 z-10 flex items-center justify-between text-white font-mono text-xs">
                    <div className="flex items-center gap-2 drop-shadow-md">
                      <MapPin size={14} className="text-[#518F5C]" />
                      <span>{coverStory.location}</span>
                    </div>
                    <span className="px-3.5 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-[10px] uppercase font-bold flex items-center gap-1.5 hover:bg-black/70 transition-colors">
                      <Maximize2 size={13} />
                      <span>Click to Inspect Full Look</span>
                    </span>
                  </div>

                </div>

                {/* Right Column: Editorial Essay, Color Palette & Shoppable Products */}
                <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-8 bg-white">
                  
                  {/* Story Info & Narrative */}
                  <div className="space-y-6">
                    
                    <div className="space-y-2">
                      <span className="text-xs font-mono font-bold text-[#042509] tracking-widest uppercase block">
                        {coverStory.theme} // {coverStory.seasonThai}
                      </span>
                      <h2 className="text-2xl sm:text-4xl font-black text-[#000000] tracking-tight font-serif leading-tight">
                        {coverStory.title}
                      </h2>
                      <p className="text-xs sm:text-sm font-mono text-[#666666]">
                        {coverStory.subtitle}
                      </p>
                    </div>

                    {/* Poetic Quote Box */}
                    <blockquote className="p-4 rounded-2xl bg-[#F1F1F1] border-l-4 border-[#042509] font-serif text-sm sm:text-base italic text-[#000000] leading-relaxed shadow-xs">
                      {coverStory.leadQuote}
                    </blockquote>

                    <p className="text-xs sm:text-sm text-[#666666] leading-relaxed font-sans">
                      {coverStory.narrative}
                    </p>

                    {/* Editorial Palette Swatches */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] block">
                        Botanical Palette Synergy:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {coverStory.palette.map((c, i) => (
                          <div 
                            key={i} 
                            className="flex items-center gap-1.5 bg-[#F1F1F1] px-2.5 py-1 rounded-xl border border-[#DCDCDC] hover:border-[#042509] transition-all hover:scale-105 cursor-default"
                          >
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-xs" 
                              style={{ backgroundColor: c.hex }} 
                            />
                            <span className="text-[10px] font-mono font-bold text-[#000000]">
                              {c.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Shoppable Garment List with Synchronized Hotspot Highlighting */}
                  <div className="space-y-4 pt-6 border-t border-[#DCDCDC]">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-[#000000] uppercase flex items-center gap-1.5">
                        <ShoppingBag size={13} className="text-[#042509]" />
                        <span>Shop This Look ({coverStory.shoppableItems.length} Pieces)</span>
                      </span>
                      <span className="text-[#042509] font-bold text-[11px] bg-[#042509]/10 px-2 py-0.5 rounded-full">
                        {coverStory.shoppableItems.some(i => i.inStock) ? 'Available pieces' : 'ยังไม่พร้อมจำหน่าย'}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {coverStory.shoppableItems.map((item) => {
                        const isActive = isItemActive(item);
                        const isPinned = pinnedItemId === item.id;
                        const isAdded = addedItems[item.id];

                        return (
                          <div 
                            key={item.id}
                            onMouseEnter={() => setHoveredItemId(item.id)}
                            onMouseLeave={() => setHoveredItemId(null)}
                            onFocus={() => setFocusedItemId(item.id)}
                            onBlur={() => setFocusedItemId(null)}
                            onClick={() => setPinnedItemId((prev) => (prev === item.id ? null : item.id))}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                              isActive 
                                ? `bg-[#EBF3E7] border-[#042509] shadow-md scale-[1.01] ${isPinned ? 'ring-2 ring-[#C91D1D]' : 'ring-2 ring-[#042509]/20'}` 
                                : 'bg-[#F1F1F1] border-[#DCDCDC] hover:border-[#042509]/60'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img 
                                src={webpSrc(item.image)} data-original-src={item.image} 
                                alt={item.name} 
                                onError={handleImageError} 
                                className={`w-11 h-13 object-contain rounded-xl bg-[#F1F1F1] border border-[#DCDCDC] shrink-0 transition-transform duration-300 ${
                                  isActive ? 'scale-108' : ''
                                }`} 
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#000000] truncate">
                                  {item.name}
                                </div>
                                <div className="text-[11px] font-mono text-[#666666]">
                                  {item.color} • <span className="font-bold text-[#042509]">${item.price.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              disabled={loading || !item.inStock} onClick={(e) => handleQuickAdd(e, item)}
                              className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase rounded-lg shadow-sm transition-all duration-300 cursor-pointer shrink-0 ml-2 ${
                                isAdded
                                  ? 'bg-emerald-600 text-white animate-cart-pop'
                                  : 'bg-[#042509] hover:bg-[#1E3D1A] text-white active:scale-95'
                              }`}
                            >
                              {isAdded ? '✓ Added' : !item.inStock ? 'Unavailable' : 'Select / Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Entire Look Master Button with Ripple Motion */}
                    <button
                      disabled={loading || !coverStory.shoppableItems.some(i => i.inStock)} onClick={() => handleAddEntireLook(coverStory)}
                      className={`w-full py-3.5 font-mono text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 shadow-md hover:shadow-xl active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
                        addedEntireLook
                          ? 'bg-emerald-700 text-white animate-cart-pop'
                          : 'bg-[#000000] hover:bg-[#1E3D1A] text-white'
                      }`}
                    >
                      {addedEntireLook ? (
                        <>
                          <Check size={16} className="text-white stroke-[3]" />
                          <span>All {coverStory.shoppableItems.length} Pieces Added!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} className="text-[#518F5C] animate-spin" />
                          <span>Add Entire Look to Bag</span>
                        </>
                      )}
                    </button>

                  </div>

                </div>

              </div>

            </TiltCard>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ASYMMETRICAL MAGAZINE SPREADS (EDITORIAL DUO LAYOUTS WITH 3D TILT) */}
        {/* ========================================================================= */}
        <section className="space-y-16 sm:space-y-24">
          
          <div className="flex items-center justify-between pb-4 border-b border-[#DCDCDC] font-mono text-xs">
            <span className="font-bold uppercase text-[#000000] flex items-center gap-2">
              <Layers size={14} className="text-[#042509]" />
              <span>Curated Seasonal Editions ({remainingSpreads.length} Feature Stories)</span>
            </span>
            <span className="text-[#666666]">Vol. 04 Spring-Summer-Autumn-Winter</span>
          </div>

          {remainingSpreads.map((spread, index) => {
            const isEven = index % 2 === 0;

            return (
              <article 
                key={spread.id} 
                data-reveal="editorial"
                style={{ '--enter-delay': `${(index % 2) * 120}ms` }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
              >
                
                {/* Visual Image Column (Asymmetric Order Flip + 3D Tilt) */}
                <div className={`lg:col-span-7 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  
                  <TiltCard
                    maxTilt={4}
                    enabled={true}
                    onClick={() => setSelectedSpread(spread)}
                    className="group relative aspect-4/5 sm:aspect-3/4 rounded-3xl sm:rounded-[2rem] overflow-hidden border border-[#DCDCDC] shadow-lg hover:shadow-2xl hover:border-[#042509] transition-all duration-500 cursor-pointer bg-neutral-100"
                  >
                    <img
                      src={webpSrc(spread.heroImage)} data-original-src={spread.heroImage}
                      loading="lazy"
                      decoding="async"
                      alt={spread.title}
                      onError={handleImageError}
                      className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out ${
                        ambientMotion ? 'animate-ken-burns' : ''
                      }`}
                    />

                    {/* Gradient & Film Tint */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

                    {/* Badges */}
                    <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#000000] font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {spread.issueDate}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#042509] text-white font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {spread.season}
                      </span>
                    </div>

                    {/* Like Button */}
                    <button
                      onClick={(e) => toggleLike(e, spread.id)}
                      className={`absolute top-5 right-5 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer ${
                        likedLooks[spread.id]
                          ? 'bg-rose-500 text-white scale-110 shadow-rose-500/30'
                          : 'bg-white/90 text-[#000000] hover:bg-white hover:scale-110'
                      }`}
                    >
                      <Heart size={17} className={likedLooks[spread.id] ? 'fill-white' : ''} />
                    </button>

                    {/* Overlay Hover CTA */}
                    <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 pointer-events-none">
                      <span className="px-5 py-2.5 bg-white text-[#000000] font-mono text-xs font-bold uppercase rounded-full shadow-2xl flex items-center gap-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                        <Maximize2 size={14} />
                        <span>Inspect Spread Details</span>
                      </span>
                    </div>

                    {/* Bottom Metadata Bar */}
                    <div className="absolute bottom-5 inset-x-5 z-10 flex items-center justify-between text-white font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-[#518F5C]" />
                        <span className="text-[11px] truncate max-w-[220px] sm:max-w-xs">{spread.location}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#518F5C]">{spread.photographer}</span>
                    </div>

                  </TiltCard>

                </div>

                {/* Editorial Text & Shoppable Product Card Column */}
                {/* Drifts against the photograph as the spread passes, the way a
                    magazine gutter reads when you turn the page slowly. */}
                <div
                  data-drift
                  style={{ '--drift-from': '30px', '--drift-to': '-30px' }}
                  className={`lg:col-span-5 space-y-6 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}
                >
                  
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-[#C91D1D] uppercase tracking-widest block">
                      {spread.theme}
                    </span>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#000000] tracking-tight font-serif">
                      {spread.title}
                    </h3>
                    <p className="text-xs font-mono text-[#666666]">
                      {spread.subtitle}
                    </p>
                  </div>

                  <blockquote className="font-serif italic text-sm sm:text-base text-[#000000] border-l-3 border-[#C91D1D] pl-4 leading-relaxed">
                    {spread.leadQuote}
                  </blockquote>

                  <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                    {spread.narrative}
                  </p>

                  {/* Swatches */}
                  <div className="flex items-center gap-2 pt-1">
                    {spread.palette.map((p, idx) => (
                      <span 
                        key={idx}
                        title={p.name}
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform"
                        style={{ backgroundColor: p.hex }}
                      />
                    ))}
                  </div>

                  {/* Shoppable Outfit Mini Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCDCDC] shadow-sm space-y-3">
                    <div className="flex items-center justify-between font-mono text-xs font-bold text-[#000000]">
                      <span className="uppercase flex items-center gap-1.5">
                        <Tag size={13} className="text-[#042509]" />
                        <span>Key Garments</span>
                      </span>
                      <button 
                        onClick={() => setSelectedSpread(spread)}
                        className="text-[#042509] hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <span>View All Details</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {spread.shoppableItems.map((item) => {
                        const isAdded = addedItems[item.id];
                        return (
                          <div 
                            key={item.id}
                            className="flex items-center justify-between py-2 border-b border-[#DCDCDC]/40 last:border-none text-xs hover:bg-[#F1F1F1] px-1 rounded-lg transition-colors"
                          >
                            <img src={webpSrc(item.image)} data-original-src={item.image} alt={item.name} loading="lazy" onError={handleImageError} className="w-12 h-14 object-contain rounded-lg bg-[#F1F1F1] border border-[#DCDCDC] shrink-0 mr-3" />
                            <div className="min-w-0 pr-2 flex-1">
                              <span className="font-bold text-[#000000] block truncate">{item.name}</span>
                              <span className="text-[10px] font-mono text-[#666666]">${item.price.toFixed(2)}</span>
                            </div>
                            <button
                              disabled={loading || !item.inStock} onClick={(e) => handleQuickAdd(e, item)}
                              className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                                isAdded
                                  ? 'bg-emerald-600 text-white animate-cart-pop'
                                  : 'bg-[#F1F1F1] hover:bg-[#042509] hover:text-white border border-[#DCDCDC]'
                              }`}
                            >
                              {isAdded ? '✓ Added' : !item.inStock ? 'Unavailable' : 'Select / Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </article>
            );
          })}

        </section>

        {/* ========================================================================= */}
        {/* 4. LIGHTBOX / FULLSCREEN INSPECTION MODAL WITH SLIDE MOTION & KEYBOARD */}
        {/* ========================================================================= */}
        {selectedSpread && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none"
            onClick={() => {
              setSelectedSpread(null);
              setIsZoomed(false);
            }}
          >
            <div 
              data-lenis-prevent="true"
              className="bg-[#F1F1F1] text-[#000000] rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto overscroll-contain shadow-2xl border border-[#DCDCDC] relative flex flex-col md:flex-row overflow-hidden animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Controls: Prev/Next Spread & Close */}
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                <button
                  onClick={handlePrevSpread}
                  title="Previous spread (Left arrow key)"
                  className="w-9 h-9 rounded-full bg-white/90 hover:bg-[#000000] hover:text-white border border-[#DCDCDC] flex items-center justify-center text-[#000000] transition-all cursor-pointer shadow-md"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextSpread}
                  title="Next spread (Right arrow key)"
                  className="w-9 h-9 rounded-full bg-white/90 hover:bg-[#000000] hover:text-white border border-[#DCDCDC] flex items-center justify-center text-[#000000] transition-all cursor-pointer shadow-md"
                >
                  <ChevronRight size={16} />
                </button>
                <button 
                  onClick={() => {
                    setSelectedSpread(null);
                    setIsZoomed(false);
                  }}
                  title="Close (Escape key)"
                  className="w-9 h-9 rounded-full bg-white/90 hover:bg-[#000000] hover:text-white border border-[#DCDCDC] flex items-center justify-center text-[#000000] transition-all cursor-pointer shadow-md"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>

              {/* High-Res Photo Left Column with Zoom Lens */}
              <div className="md:w-3/5 bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
                    className="max-h-[65vh] w-full object-contain rounded-2xl select-none" 
                  />
                </div>

                {/* Floating Zoom Control Pill */}
                <button
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[10px] font-bold uppercase flex items-center gap-1.5 hover:bg-black/80 transition-colors"
                >
                  {isZoomed ? <ZoomOut size={12} /> : <ZoomIn size={12} />}
                  <span>{isZoomed ? 'Click to Reset Zoom' : 'Click to 1.5x Zoom'}</span>
                </button>

                {/* Sub-details dual row if available */}
                {selectedSpread.detailImages && (
                  <div className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full pb-1 z-10">
                    {selectedSpread.detailImages.map((img, idx) => (
                      <div key={idx} className="w-16 h-20 rounded-lg overflow-hidden border border-white/20 shrink-0 shadow-sm">
                        <img src={webpSrc(img)} data-original-src={img} alt="Detail" onError={handleImageError} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lookbook Specs Right Column */}
              <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                
                <div className="space-y-4">
                  
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-[#042509] uppercase tracking-wider block">
                      {selectedSpread.theme} // {selectedSpread.seasonThai}
                    </span>
                    <h2 className="text-2xl font-black font-serif text-[#000000]">
                      {selectedSpread.title}
                    </h2>
                    <p className="text-xs font-mono text-[#666666]">
                      {selectedSpread.location}
                    </p>
                  </div>

                  <blockquote className="p-3.5 rounded-xl bg-white border border-[#DCDCDC] text-xs font-serif italic text-[#000000] leading-relaxed">
                    {selectedSpread.leadQuote}
                  </blockquote>

                  <p className="text-xs text-[#666666] leading-relaxed">
                    {selectedSpread.narrative}
                  </p>

                  {/* Shoppable Products List */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] block">
                      Shop Selected Pieces:
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedSpread.shoppableItems.map((item) => {
                        const isAdded = addedItems[item.id];
                        return (
                          <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#DCDCDC] hover:border-[#042509] transition-all">
                            <img src={webpSrc(item.image)} data-original-src={item.image} alt={item.name} loading="lazy" onError={handleImageError} className="w-12 h-14 object-contain rounded-lg bg-[#F1F1F1] border border-[#DCDCDC] shrink-0 mr-3" />
                            <div className="min-w-0 pr-2 flex-1">
                              <div className="text-xs font-bold text-[#000000] truncate">{item.name}</div>
                              <div className="text-[11px] font-mono text-[#042509] font-bold">${item.price.toFixed(2)}</div>
                            </div>
                            <button
                              disabled={loading || !item.inStock} onClick={(e) => handleQuickAdd(e, item)}
                              className={`px-3 py-1 font-mono text-[10px] font-bold uppercase rounded-lg shadow-xs transition-all duration-200 cursor-pointer shrink-0 ${
                                isAdded
                                  ? 'bg-emerald-600 text-white animate-cart-pop'
                                  : 'bg-[#042509] hover:bg-[#1E3D1A] text-white'
                              }`}
                            >
                              {isAdded ? '✓ Added' : !item.inStock ? 'Unavailable' : 'Select / Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Bottom Actions */}
                <div className="space-y-2.5 pt-4 border-t border-[#DCDCDC]">
                  <button
                    disabled={loading || !selectedSpread.shoppableItems.some(i => i.inStock)} onClick={() => handleAddEntireLook(selectedSpread)}
                    className="w-full py-3.5 bg-[#042509] hover:bg-[#1E3D1A] text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <Sparkles size={14} />
                    <span>Add Entire Look to Bag</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedSpread(null);
                      navigate('/mix-match');
                    }}
                    className="w-full py-2.5 bg-white hover:bg-[#F1F1F1] border border-[#DCDCDC] text-[#000000] font-mono text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Open in Mix & Match Studio
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
