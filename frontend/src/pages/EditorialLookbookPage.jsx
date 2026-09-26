import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { taxonomyLabel } from '../utils/taxonomy';
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
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatCurrency } from '../utils/currency.js';

/* The emoji that used to sit in front of each of these undid the rest of the
   page: a magazine masthead and a weather sticker cannot share a line. The
   season names already say what season they are. */
const SEASONS = [
  { id: 'ALL', label: 'lookbookUi.issue.ALL' },
  { id: 'Spring', label: 'lookbookUi.issue.Spring' },
  { id: 'Summer', label: 'lookbookUi.issue.Summer' },
  { id: 'Autumn', label: 'lookbookUi.issue.Autumn' },
  { id: 'Winter', label: 'lookbookUi.issue.Winter' }
];

/* A spread's editorial copy is written once. Its season caption carries a Thai
   gloss in brackets — "Autumn Warm (เอิร์ธโทนอบอุ่น)" — which English readers
   are spared; its narrative has an English version beside the Thai one. */
const THAI_GLOSS = /\s*\([^)]*[\u0E00-\u0E7F][^)]*\)/g;
const seasonCaption = (spread, lang) => (lang === 'en'
  ? String(spread?.seasonThai || spread?.season || '').replace(THAI_GLOSS, '').trim()
  : spread?.seasonThai || spread?.season);
const narrativeFor = (spread, lang) => (lang === 'en' ? spread?.narrativeEn || spread?.narrative : spread?.narrative);

/* The 3D tilt wrapper that used to hold the cover and every spread was
   removed. A photograph that leans toward the pointer and throws a specular
   highlight is a product-card gesture; on an editorial page it fights the
   image it is supposed to present, and it wrapped each spread in yet another
   floating pane on a page that already had too many. The photographs are now
   flat rectangles that sit on the page. */

export const SAVED_LOOKS_STORAGE_KEY = 'matcha_saved_looks';

function readSavedLooks() {
  try {
    const ids = JSON.parse(localStorage.getItem(SAVED_LOOKS_STORAGE_KEY) || '[]');
    return Array.isArray(ids) ? Object.fromEntries(ids.map((id) => [id, true])) : {};
  } catch {
    return {};
  }
}

function writeSavedLooks(liked) {
  try {
    localStorage.setItem(SAVED_LOOKS_STORAGE_KEY, JSON.stringify(Object.keys(liked).filter((id) => liked[id])));
  } catch {
    // Storage is off (private mode): the heart still works for this visit.
  }
}

/* The photographs of one look, cover first.

   A look stores its cover as `heroImage` and its close-ups as
   `detailImages`; the gallery treats them as one list so a thumbnail, the
   arrows and the counter all speak about the same index. Repeats and empty
   entries are dropped, and a look with no close-ups is a gallery of one. */
export function lookGallery(spread) {
  const images = [spread?.heroImage, ...(Array.isArray(spread?.detailImages) ? spread.detailImages : [])]
    .filter(src => typeof src === 'string' && src.trim());
  return [...new Set(images)];
}

/* Keep each detail photograph paired with the products placed on it. Older
   or admin-created looks without per-photo metadata inherit the look's pins. */
export function galleryHotspots(spread, index) {
  if (index === 0) return spread?.hotspots ?? [];
  const photo = spread?.detailHotspots?.find((entry) => entry.image === lookGallery(spread)[index]);
  if (Array.isArray(spread?.detailHotspots)) return photo?.hotspots ?? [];
  return spread?.hotspots ?? [];
}

function LookbookPieceImage({ item, alt, className }) {
  if (Number.isInteger(item.imageQuadrant)) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`${className} block bg-no-repeat`}
        style={{
          backgroundImage: `url("${item.image}")`,
          backgroundSize: '200% 200%',
          backgroundPosition: `${item.imageQuadrant % 2 ? '100%' : '0%'} ${item.imageQuadrant > 1 ? '100%' : '0%'}`
        }}
      />
    );
  }
  return <img src={webpSrc(item.image)} data-original-src={item.image} alt={alt} loading="lazy" onError={handleImageError} className={className} />;
}

/* One garment pin on a photograph, and the card it opens.

   The cover used to be the only photograph that drew its pins; every other
   spread had the same hotspot data from the API and rendered none of it, so
   the lookbook looked shoppable on one image and inert on the rest. Both now
   go through this component.

   `style` is the pin's position after object-fit compensation, so the card
   is anchored to whichever side keeps it inside the frame. */
function HotspotPin({ hs, style, active, pinned, added, disabled, onHover, onFocusChange, onToggle, onAdd, t }) {
  const left = parseFloat(style?.left);
  const align = left < 30 ? 'left-0' : left > 70 ? 'right-0' : 'left-1/2 -translate-x-1/2';
  const title = hs.title || hs.name;
  return (
    <div className="absolute z-20 pointer-events-auto transform -translate-x-1/2 -translate-y-1/2" style={style}>
      <button
        type="button"
        aria-label={t('lookbook.highlightOnImage', { title })}
        aria-pressed={pinned}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="min-h-11 min-w-11 cursor-pointer flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-white"
      >
        <span
          className={`block rounded-full border transition-all duration-200 ${
            active
              ? 'h-4 w-4 bg-matcha-accent border-white ring-4 ring-white/30'
              : 'h-3 w-3 bg-white/90 border-white/60 hover:h-4 hover:w-4'
          }`}
        />
      </button>

      {active && (
        <div
          className={`absolute ${align} bottom-10 w-60 max-w-[calc(100vw-2rem)] p-3 bg-white/95 backdrop-blur-md shadow-2xl text-left z-30 pointer-events-auto border border-[#E5E2D8] rounded-xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <LookbookPieceImage item={hs} alt={title} className="w-12 h-12 object-contain bg-[#FAF9F5] rounded-md shrink-0 border border-[#E5E2D8]" />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-matcha-muted block">
                {hs.category || 'Garment'}
              </span>
              <div className="text-xs font-bold text-[#0A0A0A] leading-snug truncate">
                {title}
              </div>
              <div className="text-xs font-mono text-[#0A0A0A] mt-0.5 font-bold">
                {hs.price == null ? t('lookbookUi.unavailable') : formatCurrency(hs.price)}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled || !hs.inStock}
            onClick={(e) => { e.stopPropagation(); onAdd(e); }}
            className="mt-2.5 w-full py-2 bg-[#0A0A0A] hover:bg-matcha-accent disabled:bg-matcha-border disabled:text-matcha-muted text-matcha-bg font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed rounded-lg"
          >
            {added ? <Check size={12} /> : <ShoppingBag size={12} />}
            <span>{added ? t('lookbookUi.added') : !hs.inStock ? t('lookbookUi.unavailable') : t('lookbookUi.addToBag')}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* A spread's photograph with its pins. Each photograph crops differently
   under object-fit: cover, so each one measures itself; the focus passed here
   is the same point the image's object-position uses (centred). */
const SPREAD_FOCUS = { x: 0.5, y: 0.5 };
function SpreadPhoto({ spread, renderPin }) {
  const { imageRef, position } = useCoverCoordinates(spread.heroImage, SPREAD_FOCUS);
  const drift = 'absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]';
  /* The pins sit on their own layer above the vignette, scaled by the same
     hover drift as the photograph so they stay on their garments. */
  return (
    <>
    <div className={drift}>
      <img
        ref={imageRef}
        src={webpSrc(spread.heroImage)} data-original-src={spread.heroImage}
        loading="lazy"
        decoding="async"
        alt={spread.title}
        onError={handleImageError}
        style={{ objectPosition: `${SPREAD_FOCUS.x * 100}% ${SPREAD_FOCUS.y * 100}%` }}
        className="w-full h-full object-cover"
      />
    </div>
    <div className={`${drift} z-20 pointer-events-none`}>
      {(spread.hotspots ?? []).map((hs) => renderPin(hs, position(hs)))}
    </div>
    </>
  );
}

export default function EditorialLookbookPage() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { looks: curatedEditorialSpreads, loading, error, retry } = useLookbooks();
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [wholeLookActive, setWholeLookActive] = useState(false);
  const wholeLookStateRef = useRef(null);

  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const editorialMotionRef = useChangeMotion(selectedSeason);
  const [selectedSpread, setSelectedSpread] = useState(null);

  // เลือกค้างไว้ด้วยการคลิก - ต้องอยู่จนกว่าจะคลิกอีกครั้งหรือกด Escape
  const [pinnedItemId, setPinnedItemId] = useState(null);
  // เมาส์ชี้ชั่วคราว
  const [hoveredItemId, setHoveredItemId] = useState(null);
  // คีย์บอร์ดโฟกัส
  const [focusedItemId, setFocusedItemId] = useState(null);

  /* "Save this look" said the look was saved to a private vault and kept it in
     component state, so a refresh forgot it. There is no server-side store for
     looks; like the wishlist, saved looks are kept in this browser, and the
     message now says exactly that. */
  const [likedLooks, setLikedLooks] = useState(readSavedLooks);
  useEffect(() => { writeSavedLooks(likedLooks); }, [likedLooks]);
  const [addedItems, setAddedItems] = useState({});
  const [addedEntireLook, setAddedEntireLook] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  /* Which photograph of the open look is shown. It is stored with the look
     it belongs to: when a different look opens, the stored index no longer
     applies and the gallery starts on that look's cover, and an index that
     is out of range for a shorter look is clamped rather than read. Nothing
     here is persisted. */
  const [galleryPick, setGalleryPick] = useState({ spreadId: null, index: 0 });
  const gallery = useMemo(() => lookGallery(selectedSpread), [selectedSpread]);
  const imageIndex = selectedSpread && galleryPick.spreadId === selectedSpread.id
    ? Math.min(Math.max(galleryPick.index, 0), Math.max(gallery.length - 1, 0))
    : 0;
  // Use the same measured image coordinates as the cover cards. This also
  // keeps pins aligned if a future gallery photograph has another aspect ratio.
  const { imageRef: galleryImageRef, position: galleryPosition } = useCoverCoordinates(gallery[imageIndex]);
  const selectedPhotoStory = imageIndex === 0 ? selectedSpread : {
    ...selectedSpread,
    ...(selectedSpread?.detailHotspots?.find((entry) => entry.image === gallery[imageIndex]) ?? {})
  };
  const selectedPhotoHotspots = useMemo(
    () => galleryHotspots(selectedSpread, imageIndex),
    [selectedSpread, imageIndex]
  );
  const selectedPhotoItems = useMemo(() => {
    const itemsById = new Map((selectedSpread?.shoppableItems ?? []).map((item) => [item.productId || item.id, item]));
    return selectedPhotoHotspots.map((hotspot) => {
      const item = itemsById.get(hotspot.productId || hotspot.id);
      return item ? { ...hotspot, ...item, id: item.id, name: hotspot.title || item.name, image: item.image || hotspot.image, x: hotspot.x, y: hotspot.y } : hotspot;
    });
  }, [selectedSpread, selectedPhotoHotspots]);
  // Closing the lightbox forgets the photograph, so reopening starts on the cover.
  useEffect(() => {
    if (!selectedSpread) setGalleryPick({ spreadId: null, index: 0 });
  }, [selectedSpread]);
  const showImage = (index) => {
    if (!selectedSpread || index < 0 || index >= gallery.length) return;
    setGalleryPick({ spreadId: selectedSpread.id, index });
    setIsZoomed(false);
  };

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
  /* The archive is shot in portrait, and a cover that is wider than the
     photograph has to throw away a band top and bottom. Cropping from the
     centre took a quarter off the top, which is where the heads are. Holding
     the crop near the top of the frame keeps the subject whole; the same
     fraction goes to the image's object-position below, or the pins would no
     longer sit on the garments they point at. */
  const COVER_FOCUS = { x: 0.5, y: 0.18 };
  const { imageRef: coverImageRef, position: coverPosition } = useCoverCoordinates(coverStory?.heroImage, COVER_FOCUS);

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
      /* The arrows step through this look's photographs first and only then
         turn to the neighbouring look, which opens on its cover. A look with
         a single photograph therefore pages exactly as before. */
      if (e.key === 'ArrowRight') {
        if (imageIndex < gallery.length - 1) showImage(imageIndex + 1);
        else handleNextSpread();
      } else if (e.key === 'ArrowLeft') {
        if (imageIndex > 0) showImage(imageIndex - 1);
        else handlePrevSpread();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSpread, filteredSpreads, pinnedItemId, imageIndex, gallery.length]);

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
      if (next) showToast(t('lookbook.lookSaved'), 'success');
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
      showToast(t('lookbook.outOfStock'), 'error');
      return;
    }
    if (!item.sizes || item.sizes.length !== 1) {
      setWholeLookActive(false);
      wholeLookStateRef.current = null;
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

    showToast(t('lookbookUi.toast.addedItem', { name: item.name || item.title }), 'success');
  };

  const handleAddEntireLook = (spread) => {
    if (loading || wholeLookStateRef.current) return;

    const availableItems = (spread.shoppableItems || []).filter(item => item.inStock === true);
    const outOfStockItems = (spread.shoppableItems || []).filter(item => item.inStock === false);

    if (availableItems.length === 0) {
      showToast(t('lookbook.lookOutOfStock'), 'error');
      return;
    }

    const multiSizeItems = availableItems.filter(item => (item.sizes || []).length > 1);
    const singleSizeItems = availableItems.filter(item => (item.sizes || []).length <= 1);

    // Pre-create cart payloads for single-size items in memory
    const initialCollected = singleSizeItems.map(item => ({
      ...item,
      id: item.productId || item.id,
      name: item.name || item.title,
      price: item.price,
      image: item.image,
      quantity: 1,
      size: getItemSize(item),
      color: item.color || 'Artisan Default'
    }));

    // If no multi-size items exist, add all immediately
    if (multiSizeItems.length === 0) {
      initialCollected.forEach(item => addToCart(item));
      setAddedEntireLook(true);
      setTimeout(() => setAddedEntireLook(false), 2000);

      if (outOfStockItems.length > 0) {
        const oosNames = outOfStockItems.map(i => i.name).join(', ');
        showToast(t('lookbookUi.toast.addedPartial', { count: initialCollected.length, names: oosNames }), 'info');
      } else {
        showToast(t('lookbookUi.toast.addedLook', { title: spread.title, count: initialCollected.length }), 'success');
      }
      return;
    }

    // Multi-size items exist: initialize whole-look queue
    const queue = [...multiSizeItems];
    const firstItem = queue[0];
    const remainingQueue = queue.slice(1);

    wholeLookStateRef.current = {
      spread,
      queue: remainingQueue,
      collected: initialCollected,
      expectedCount: availableItems.length,
      outOfStockItems
    };

    setWholeLookActive(true);
    showToast(t('lookbook.chooseSizes'), 'info');
    setPurchaseItem({ ...firstItem, id: firstItem.productId || firstItem.id, name: firstItem.name || firstItem.title });
  };

  const handleWholeLookSelection = (itemToAdd) => {
    const current = wholeLookStateRef.current;
    if (!current) {
      addToCart(itemToAdd);
      setPurchaseItem(null);
      return;
    }

    const normalizedItem = {
      ...itemToAdd,
      id: itemToAdd.productId || itemToAdd.id,
      name: itemToAdd.name || itemToAdd.title
    };

    const nextCollected = [...current.collected, normalizedItem];
    const nextQueue = [...current.queue];

    if (nextQueue.length > 0) {
      const nextItem = nextQueue.shift();
      wholeLookStateRef.current = {
        ...current,
        queue: nextQueue,
        collected: nextCollected
      };
      setPurchaseItem({ ...nextItem, id: nextItem.productId || nextItem.id, name: nextItem.name || nextItem.title });
    } else {
      // Queue complete! All selections collected.
      if (nextCollected.length === current.expectedCount) {
        nextCollected.forEach(item => addToCart(item));

        setAddedEntireLook(true);
        setTimeout(() => setAddedEntireLook(false), 2000);

        if (current.outOfStockItems.length > 0) {
          const oosNames = current.outOfStockItems.map(i => i.name).join(', ');
          showToast(t('lookbookUi.toast.addedPartial', { count: nextCollected.length, names: oosNames }), 'info');
        } else {
          showToast(t('lookbookUi.toast.addedLook', { title: current.spread.title, count: nextCollected.length }), 'success');
        }
      }

      wholeLookStateRef.current = null;
      setWholeLookActive(false);
      setPurchaseItem(null);
    }
  };

  const handleCloseModal = () => {
    if (wholeLookStateRef.current) {
      wholeLookStateRef.current = null;
      setWholeLookActive(false);
    }
    setPurchaseItem(null);
  };

  // Determine if a hotspot or item is active (synchronized selection state)
  const hsKey = (hs) => hs.productId || hs.id;
  // ภาพกับรายการต้องอ่านจากค่าเดียวกัน จะได้ไม่เลือกคนละชิ้น
  // ลำดับความสำคัญ: คลิกค้าง > คีย์บอร์ดโฟกัส > เมาส์ชี้
  const activeItemId = pinnedItemId ?? focusedItemId ?? hoveredItemId;
  const isItemActive = (item) => Boolean(activeItemId) && item.id === activeItemId;

  /* The cover keys its pins by product so they stay in step with the cover's
     garment list. Other spreads prefix the look id, so one product appearing
     in two looks does not light up both. */
  const renderPin = (hs, style, key = `${hs.id}`) => {
    // A crop can push a pin off the visible frame; an invisible button would
    // still take keyboard focus, so it is left out until a wider frame shows it.
    const offFrame = [style?.left, style?.top].some(v => { const n = parseFloat(v); return n < 0 || n > 100; });
    if (offFrame) return null;
    const itemId = hs.productId || hs.id;
    return (
      <HotspotPin
        key={hs.id}
        hs={hs}
        style={style}
        t={t}
        active={Boolean(activeItemId) && activeItemId === key}
        pinned={pinnedItemId === key}
        added={Boolean(addedItems[itemId])}
        disabled={loading}
        onHover={(on) => setHoveredItemId(on ? key : null)}
        onFocusChange={(on) => setFocusedItemId(on ? key : null)}
        onToggle={() => setPinnedItemId((prev) => (prev === key ? null : key))}
        onAdd={(e) => handleQuickAdd(e, { ...hs, id: itemId, name: hs.title || hs.name })}
      />
    );
  };

  if (!curatedEditorialSpreads?.length || !coverStory) {
    return (
      <div className="max-w-3xl mx-auto my-16 p-8 border border-dashed border-matcha-border rounded-3xl bg-white text-center shadow-sm">
        <h1 className="text-2xl font-bold text-matcha-text">{loading ? t('lookbook.loading') : t('lookbook.nonePublished')}</h1>
        <p className="my-4 text-xs font-mono text-matcha-muted">{t('lookbook.comeBackSoon')}</p>
        <button
          disabled={loading}
          onClick={retry}
          className="px-5 py-2.5 bg-matcha-text text-white font-mono text-xs font-bold rounded-xl cursor-pointer hover:bg-black/80 transition-all disabled:opacity-50"
        >
          {loading ? t('lookbook.loadingShort') : t('lookbook.reload')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-matcha-bg text-matcha-text min-h-screen">
      {purchaseItem && (
        <ProductModal
          key={purchaseItem.id || purchaseItem.productId}
          product={purchaseItem}
          onClose={handleCloseModal}
          {...(wholeLookActive ? { onAddToCart: handleWholeLookSelection } : {})}
        />
      )}
      {loading && <div role="status" aria-label={t('common.loading')} className="h-16 bg-[#EAE5DB]" />}
      {error && <div role="alert" className="p-4 border-b border-matcha-accent bg-[#FFF4ED] text-center">{t(error)} <button onClick={retry} className="underline font-bold ml-3">{t('common.retry')}</button></div>}

      {/* ========================================================================= */}
      {/* 1. THE COVER STORY: FULL-BLEED EDITORIAL MAGAZINE COVER (OPTION 1)         */}
      {/* ========================================================================= */}
      {coverStory && (
        <div ref={editorialMotionRef} key={`cover-${coverStory.id}-${selectedSeason}`}>
          <figure
            className="relative w-full h-[88svh] sm:h-[94svh] min-h-[540px] overflow-hidden bg-[#0A0A0A] cursor-pointer select-none"
            onClick={() => setSelectedSpread(coverStory)}
          >
            <img
              ref={coverImageRef}
              src={webpSrc(coverStory.heroImage)} data-original-src={coverStory.heroImage}
              alt={coverStory.title}
              onError={handleImageError}
              style={{ objectPosition: `${COVER_FOCUS.x * 100}% ${COVER_FOCUS.y * 100}%` }}
              className="w-full h-full object-cover"
            />

            {/* Luxury Magazine Vignette Gradient */}
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/25 to-black/65 pointer-events-none" />

            {/* Top Magazine Meta Bar (Over Image) */}
            <figcaption className="absolute top-0 inset-x-0 z-20 p-5 sm:p-8 flex items-start justify-between gap-4 text-white">
              <div className="space-y-1">
                <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/90 drop-shadow">
                  <span>{t('lookbookUi.issueLine')}</span>
                  <span className="hidden sm:inline">{t('lookbookUi.issueCities')}</span>
                </div>
                <div className="text-[10px] font-mono text-matcha-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-matcha-secondary" />
                  <span>{t('lookbookUi.coverStory', { vol: coverStory.vol, season: taxonomyLabel(t, 'season', coverStory.season) })}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => toggleLike(e, coverStory.id)}
                aria-label={t('lookbookUi.saveLook')}
                aria-pressed={Boolean(likedLooks[coverStory.id])}
                className="shrink-0 text-white cursor-pointer transition-transform hover:scale-110 outline-hidden focus-visible:ring-2 focus-visible:ring-white p-2.5 rounded-full bg-black/40 backdrop-blur-xs border border-white/20 shadow-md"
              >
                <Heart size={20} className={likedLooks[coverStory.id] ? 'fill-matcha-accent text-matcha-accent' : 'drop-shadow'} />
              </button>
            </figcaption>

            {/* Giant Masthead Center Watermark / Headline */}
            <div className="absolute top-1/4 sm:top-1/5 inset-x-0 z-10 text-center pointer-events-none px-4">
              <span
                aria-hidden="true"
                className="text-[5rem] sm:text-[9rem] lg:text-[13rem] leading-none font-black text-white/[0.08] select-none font-serif tracking-tighter block"
              >
                街頭美學
              </span>
              <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-[6.8rem] font-black uppercase text-white tracking-[-0.03em] font-sans leading-[0.88] drop-shadow-2xl -mt-8 sm:-mt-16 lg:-mt-24">
                {t('lookbookUi.title')}
              </h1>
            </div>

            {/* Interactive garment pins */}
            {(coverStory.hotspots ?? []).map((hs) => renderPin(hs, coverPosition(hs), hsKey(hs)))}

            {/* Bottom Cover Story Captions */}
            <div className="absolute bottom-0 inset-x-0 z-10 p-5 sm:p-8 lg:p-12 text-white pointer-events-none flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 bg-matcha-accent text-white font-mono text-[10px] uppercase tracking-[0.18em] rounded-xs font-bold mb-2 shadow-xs">
                  {coverStory.theme} — {seasonCaption(coverStory, lang)}
                </span>
                <h2 className="mt-1 text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.02em] leading-[0.9] max-w-3xl text-white drop-shadow-md">
                  {coverStory.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-[11px] text-white/85">
                  <span>{coverStory.subtitle}</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    {coverStory.location}
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-white/70 tracking-wider uppercase hidden md:flex items-center gap-2 drop-shadow">
                <span>{t('lookbook.scrollToRead')}</span>
                <span className="animate-bounce">↓</span>
              </div>
            </div>
          </figure>
        </div>
      )}

      {/* Running ticker (Full-Width Edge-to-Edge) */}
      <div className="w-full overflow-hidden border-y border-matcha-border py-2.5 bg-white font-mono text-[11px] text-matcha-muted tracking-[0.15em] uppercase">
        <div className="animate-marquee whitespace-nowrap flex items-center">
          {[
            t('lookbookUi.marquee.archive'),
            t('lookbookUi.marquee.silhouettes'),
            t('lookbookUi.marquee.dyed'),
            t('lookbookUi.marquee.pins'),
            t('lookbookUi.marquee.limited'),
          ].concat([
            t('lookbookUi.marquee.archive'),
            t('lookbookUi.marquee.silhouettes'),
          ]).map((line, i) => (
            <span key={i} className="flex items-center">
              <span className="px-6">{line}</span>
              <span aria-hidden="true" className="h-3 w-px bg-matcha-border" />
            </span>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN EDITORIAL CONTENT: FILTER & DEEP-DIVE (MAX-W-7XL)                 */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto py-10 sm:py-16 px-5 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Issue navigation */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 pb-6 border-b border-matcha-border">
          <nav aria-label={t('lookbookUi.filterAria')} className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
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
                      ? 'text-[#0A0A0A] font-bold underline underline-offset-[6px] decoration-2 decoration-matcha-accent'
                      : 'text-matcha-muted hover:text-[#0A0A0A]'
                  }`}
                >
                  {t(s.label)}
                  <span className="ml-1.5 text-[10px] tabular-nums text-[#999999]">{count}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => navigate('/mix-match')}
            className="font-mono text-xs uppercase tracking-wider text-matcha-accent hover:underline underline-offset-4 cursor-pointer flex items-center gap-1.5 outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
          >
            <span>{t('lookbookUi.openStudio')}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Cover Story Narrative & Shoppable Pieces */}
        {coverStory && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">

              <div className="lg:col-span-7 space-y-7">
                {/* The pull quote is set as a pull quote — large, hung off the
                    measure — rather than parked in a tinted rounded box. */}
                <blockquote className="font-serif italic text-xl sm:text-2xl text-[#0A0A0A] leading-snug border-l-2 border-matcha-accent pl-5">
                  {coverStory.leadQuote}
                </blockquote>

                <p className="text-sm text-matcha-muted leading-relaxed max-w-prose">
                  {narrativeFor(coverStory, lang)}
                </p>

                {/* The palette speaks the catalogue's language: solid colour
                    with its name on it, not a dot inside a rounded chip. */}
                <div className="pt-2">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-2">
                    {t('lookbookUi.palette')}
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
                  <h3 className="text-[#0A0A0A] font-bold">{t('lookbookUi.shopLook')}</h3>
                  <span className="text-matcha-muted">{t('lookbookUi.pieces', { count: coverStory.shoppableItems.length })}</span>
                </div>

                <ul className="divide-y divide-matcha-border">
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
                            isPinned ? 'bg-matcha-accent' : isActive ? 'bg-[#0A0A0A]' : 'bg-transparent'
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
                          <div className="text-[11px] font-mono text-matcha-muted">
                            {item.color}{item.price != null ? ` · ${formatCurrency(item.price)}` : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={loading || !item.inStock} onClick={(e) => handleQuickAdd(e, item)}
                          className="shrink-0 px-3 py-1.5 bg-[#0A0A0A] hover:bg-matcha-accent disabled:bg-transparent disabled:text-[#999999] text-matcha-bg font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isAdded ? t('lookbookUi.added') : !item.inStock ? t('lookbookUi.soldOut') : t('lookbookUi.add')}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="button"
                  disabled={loading || wholeLookActive || !coverStory.shoppableItems.some(i => i.inStock)}
                  onClick={() => handleAddEntireLook(coverStory)}
                  className="mt-5 w-full py-3.5 bg-matcha-accent hover:bg-matcha-accent-hover disabled:bg-matcha-border disabled:text-matcha-muted text-white font-mono text-xs uppercase tracking-[0.15em] transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addedEntireLook && <Check size={14} />}
                  <span>
                    {addedEntireLook
                      ? t('lookbookUi.allAdded', { count: coverStory.shoppableItems.length })
                      : t('lookbookUi.addWhole')}
                  </span>
                </button>
              </div>

            </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ASYMMETRICAL MAGAZINE SPREADS (EDITORIAL DUO LAYOUTS WITH 3D TILT) */}
        {/* ========================================================================= */}
        <section className="space-y-16 sm:space-y-24">
          
          <div className="flex items-baseline justify-between pb-3 border-b border-[#0A0A0A] font-mono text-[10px] uppercase tracking-[0.18em]">
            <h2 className="font-bold text-[#0A0A0A]">
              {t('lookbookUi.curated')}
            </h2>
            <span className="text-matcha-muted">
              {remainingSpreads.length === 1 ? t('lookbookUi.featureOne') : t('lookbookUi.features', { count: remainingSpreads.length })}
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
                    <SpreadPhoto spread={spread} renderPin={renderPin} />

                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                    <figcaption className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/90">
                      <span className="drop-shadow">{spread.issueDate} — {spread.season}</span>
                      <button
                        type="button"
                        onClick={(e) => toggleLike(e, spread.id)}
                        aria-label={t('lookbookUi.saveLook')}
                        aria-pressed={Boolean(likedLooks[spread.id])}
                        className="shrink-0 text-white cursor-pointer transition-transform hover:scale-110 outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <Heart size={17} className={likedLooks[spread.id] ? 'fill-matcha-accent text-matcha-accent' : 'drop-shadow'} />
                      </button>
                    </figcaption>

                    <div className="absolute bottom-4 inset-x-4 z-10 flex items-end justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/85">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{spread.location}</span>
                      </span>
                      <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity underline underline-offset-4">
                        {t('lookbookUi.openSpread')}
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
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-accent block">
                      {spread.theme}
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black uppercase text-[#0A0A0A] tracking-[-0.02em] leading-[0.95]">
                      {spread.title}
                    </h3>
                    <p className="font-mono text-[11px] text-matcha-muted">
                      {spread.subtitle}
                    </p>
                  </div>

                  <blockquote className="font-serif italic text-lg text-[#0A0A0A] border-l-2 border-matcha-accent pl-5 leading-snug">
                    {spread.leadQuote}
                  </blockquote>

                  <p className="text-sm text-matcha-muted leading-relaxed">
                    {narrativeFor(spread, lang)}
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
                      <h4 className="font-bold text-[#0A0A0A]">{t('lookbookUi.keyGarments')}</h4>
                      <button
                        type="button"
                        onClick={() => setSelectedSpread(spread)}
                        className="text-matcha-accent hover:underline underline-offset-4 cursor-pointer flex items-center gap-1 outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                      >
                        <span>{t('lookbookUi.allDetails')}</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>

                    <ul className="divide-y divide-matcha-border">
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
                              {item.price != null && <span className="text-[11px] font-mono text-matcha-muted">{formatCurrency(item.price)}</span>}
                            </div>
                            <button
                              type="button"
                              disabled={loading || !item.inStock} onClick={(e) => handleQuickAdd(e, item)}
                              className="shrink-0 px-3 py-1.5 bg-[#0A0A0A] hover:bg-matcha-accent disabled:bg-transparent disabled:text-[#999999] text-matcha-bg font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                              {isAdded ? t('lookbookUi.added') : !item.inStock ? t('lookbookUi.soldOut') : t('lookbookUi.add')}
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
              className="bg-matcha-bg text-[#0A0A0A] max-w-5xl w-full h-full sm:h-auto sm:max-h-[92vh] overflow-y-auto overscroll-contain relative flex flex-col md:flex-row animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Paging and close. Three white circles floating over the
                  artwork were the loudest thing in the frame; set as plain
                  marks on the dark plate, they stay available without
                  competing with the photograph they sit on. */}
              <div className="absolute top-2 right-2 z-30 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] md:right-[calc(40%+0.5rem)]">
                <button
                  type="button"
                  onClick={handlePrevSpread}
                  title={t('lookbookUi.prevTitle')}
                  aria-label={t('lookbookUi.prevSpread')}
                  className="h-10 w-10 flex items-center justify-center text-white/80 hover:text-white cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleNextSpread}
                  title={t('lookbookUi.nextTitle')}
                  aria-label={t('lookbookUi.nextSpread')}
                  className="h-10 w-10 flex items-center justify-center text-white/80 hover:text-white cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSpread(null);
                    setIsZoomed(false);
                  }}
                  title={t('lookbookUi.closeTitle')}
                  aria-label={t('lookbookUi.close')}
                  className="h-10 w-10 flex items-center justify-center text-white/80 hover:text-white cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* The photograph, on its own plate, with the look's other
                  photographs beneath it. The plate keeps one height whichever
                  photograph is shown, so changing image never shifts the
                  layout. */}
              <div className="md:w-3/5 bg-[#0A0A0A] flex flex-col shrink-0 md:self-stretch">
                <div className="relative flex-1 flex items-center justify-center overflow-hidden px-4 pt-12 pb-4 min-h-[48vh] md:min-h-[60vh]">
                  <div
                    className={`relative w-full max-w-[32.85vh] sm:max-w-[41.81vh] aspect-[896/1200] transition-transform duration-500 ${
                      isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                    }`}
                    onClick={() => setIsZoomed(!isZoomed)}
                  >
                    <img
                      ref={galleryImageRef}
                      key={gallery[imageIndex]}
                      src={webpSrc(gallery[imageIndex])} data-original-src={gallery[imageIndex]}
                      alt={imageIndex === 0 ? selectedSpread.title : `${selectedSpread.title} — ${t('lookbookUi.detailAlt')} ${imageIndex}`}
                      onError={handleImageError}
                      className="absolute inset-0 h-full w-full object-cover select-none animate-fade-in"
                    />
                    <div className="absolute inset-0 pointer-events-none">
                      {selectedPhotoHotspots.map((hs) => {
                        const key = `${selectedSpread.id}:${gallery[imageIndex]}:${hsKey(hs)}`;
                        return renderPin(hs, galleryPosition(hs), key);
                      })}
                    </div>
                  </div>

                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => showImage(imageIndex - 1)}
                        disabled={imageIndex === 0}
                        aria-label={t('lookbookUi.prevImage')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-11 w-11 flex items-center justify-center rounded-full bg-black/40 text-white/85 hover:bg-black/60 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={() => showImage(imageIndex + 1)}
                        disabled={imageIndex === gallery.length - 1}
                        aria-label={t('lookbookUi.nextImage')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-11 w-11 flex items-center justify-center rounded-full bg-black/40 text-white/85 hover:bg-black/60 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-3 inset-x-4 z-20 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-white/70 pointer-events-none">
                    <button
                      type="button"
                      onClick={() => setIsZoomed(!isZoomed)}
                      className="pointer-events-auto hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                    >
                      {isZoomed ? <ZoomOut size={12} /> : <ZoomIn size={12} />}
                      <span>{isZoomed ? t('lookbookUi.reset') : t('lookbookUi.zoom')}</span>
                    </button>
                    {gallery.length > 1 && (
                      <span aria-live="polite" className="tabular-nums">{t('lookbookUi.imageCounter', { n: imageIndex + 1, total: gallery.length })}</span>
                    )}
                  </div>
                </div>

                {gallery.length > 1 && (
                  <div role="group" aria-label={t('lookbookUi.galleryLabel')} className="flex gap-2 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]">
                    {gallery.map((img, idx) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() => showImage(idx)}
                        aria-label={t('lookbookUi.showImage', { n: idx + 1, total: gallery.length })}
                        aria-current={idx === imageIndex ? 'true' : undefined}
                        className={`relative w-14 h-[4.5rem] sm:w-16 sm:h-20 shrink-0 overflow-hidden cursor-pointer transition outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] ${
                          idx === imageIndex ? 'opacity-100 ring-2 ring-white' : 'opacity-50 hover:opacity-90'
                        }`}
                      >
                        <img src={webpSrc(img)} data-original-src={img} alt="" onError={handleImageError} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* The story and the pieces. */}
              <div className="md:w-2/5 p-6 sm:p-8 pt-8 sm:pt-12 flex flex-col gap-7 min-w-0">

                <div className="space-y-6">

                  <header className="space-y-2">
                    {(selectedPhotoStory.theme || selectedPhotoStory.season) && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-accent block">
                        {[selectedPhotoStory.theme, seasonCaption(selectedPhotoStory, lang)].filter(Boolean).join(' — ')}
                      </span>
                    )}
                    <h2 className="text-2xl sm:text-[2rem] font-black uppercase tracking-[-0.02em] leading-[0.95] text-[#0A0A0A]">
                      {selectedPhotoStory.title}
                    </h2>
                    {selectedPhotoStory.location && (
                      <p className="font-mono text-[11px] text-matcha-muted flex items-center gap-1.5">
                        <MapPin size={11} aria-hidden="true" />
                        {selectedPhotoStory.location}
                      </p>
                    )}
                  </header>

                  {selectedPhotoStory.leadQuote && (
                    <blockquote className="font-serif italic text-lg text-[#0A0A0A] border-l-2 border-matcha-accent pl-4 leading-snug">
                      {selectedPhotoStory.leadQuote}
                    </blockquote>
                  )}

                  {narrativeFor(selectedPhotoStory, lang) && (
                    <p className="text-[13px] text-matcha-muted leading-relaxed">
                      {narrativeFor(selectedPhotoStory, lang)}
                    </p>
                  )}

                  <section>
                    <h3 className="flex items-baseline justify-between pb-2 border-b border-[#0A0A0A] font-mono text-[10px] uppercase tracking-[0.18em] font-bold text-[#0A0A0A]">
                      <span>{t('lookbookUi.piecesInSpread')}</span>
                      <span className="font-normal text-matcha-muted tabular-nums">{selectedPhotoItems.length}</span>
                    </h3>
                    {/* The list scrolls only when it outgrows its space, with a
                        thin scrollbar that still works for mouse, touch and
                        keyboard. */}
                    <ul className="divide-y divide-matcha-border max-h-64 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:#DCDCDC_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-matcha-border">
                      {selectedPhotoItems.length === 0 && (
                        <li className="py-6 text-center text-xs font-mono text-matcha-muted">{t('lookbookUi.noPieces')}</li>
                      )}
                      {selectedPhotoItems.map((item) => {
                        const isAdded = addedItems[item.id];
                        const sizes = (item.sizes || []).filter(Boolean);
                        return (
                          <li key={item.id} className="flex items-center gap-3 py-3">
                            <LookbookPieceImage item={item} alt="" className="w-12 h-12 object-contain bg-white shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-[#0A0A0A] leading-snug line-clamp-2">{item.name}</div>
                              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-mono">
                                {item.price != null && <span className="text-[#0A0A0A] tabular-nums">{formatCurrency(item.price)}</span>}
                                {item.inStock
                                  ? sizes.length > 0 && <span className="text-matcha-muted truncate">{sizes.join(' · ')}</span>
                                  : <span className="text-matcha-accent">{t(item.linked === false ? 'lookbookUi.unavailable' : 'lookbookUi.soldOut')}</span>}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={loading || !item.inStock} onClick={(e) => handleQuickAdd(e, item)}
                              aria-label={`${isAdded ? t('lookbookUi.added') : !item.inStock ? t(item.linked === false ? 'lookbookUi.unavailable' : 'lookbookUi.soldOut') : t('lookbookUi.add')} — ${item.name}`}
                              className="shrink-0 min-h-9 px-3.5 bg-[#0A0A0A] hover:bg-matcha-accent disabled:bg-transparent disabled:text-[#999999] disabled:border disabled:border-matcha-border text-matcha-bg font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                              {isAdded ? t('lookbookUi.added') : !item.inStock ? t(item.linked === false ? 'lookbookUi.unavailable' : 'lookbookUi.soldOut') : t('lookbookUi.add')}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>

                </div>

                <div className="mt-auto space-y-2 pt-5 border-t border-matcha-border">
                  <button
                    type="button"
                    disabled={loading || wholeLookActive || !selectedPhotoItems.some(i => i.inStock)}
                    onClick={() => handleAddEntireLook({ ...selectedSpread, shoppableItems: selectedPhotoItems })}
                    className="w-full min-h-12 py-3.5 bg-matcha-accent hover:bg-matcha-accent-hover disabled:bg-matcha-border disabled:text-matcha-muted text-white font-mono text-xs uppercase tracking-[0.15em] transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {t('lookbookUi.addWhole')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const spread = selectedSpread;
                      setSelectedSpread(null);
                      // The studio opens on this spread's pieces, not a preset.
                      navigate('/mix-match', {
                        state: {
                          lookbookLook: {
                            id: spread.id,
                            title: spread.title,
                            productIds: (spread.shoppableItems || []).map((item) => item.productId || item.id)
                          }
                        }
                      });
                    }}
                    className="w-full min-h-11 py-2.5 border border-[#0A0A0A] font-mono text-xs uppercase tracking-wider text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-matcha-bg transition-colors cursor-pointer flex items-center justify-center gap-1.5 outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-accent"
                  >
                    <Sparkles size={13} aria-hidden="true" />
                    <span>{t('lookbookUi.openInStudio')}</span>
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
