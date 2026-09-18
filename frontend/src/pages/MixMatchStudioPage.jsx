import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ShoppingBag, 
  Check, 
  Layers, 
  Palette, 
  Shuffle, 
  CheckCircle2,
  Footprints,
  Shirt,
  Scissors,
  Briefcase
} from 'lucide-react';
import { productsData } from '../data/productsData';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { handleImageError, webpSrc } from '../utils/imageFallback';
import { computeOutfitSynergy } from '../utils/fashionTheory';
import useChangeMotion from '../hooks/useChangeMotion';

// ส่วนลดเซ็ต 4 ชิ้น — ประกาศที่เดียวเพื่อไม่ให้ตัวเลขที่โชว์กับที่คิดเงินหลุดจากกัน
const BUNDLE_DISCOUNT_RATE = 0.12;
const BUNDLE_DISCOUNT_PERCENT = Math.round(BUNDLE_DISCOUNT_RATE * 100);

// Curated Editorial Presets (Complete 4-Piece Head-to-Toe Looks)
const OUTFIT_PRESETS = [
  {
    id: 'PRESET-01',
    name: '🍵 Kyoto Artisan Earth (Warm Autumn)',
    season: 'Autumn',
    harmonyType: 'Analogous Warm Palette',
    description: 'เสื้อฮู้ดสีเอิร์ธโทน กางเกงชิโน่ บูทหนังแท้ และกระเป๋าหนังโทนอุ่น ขับเน้นเสน่ห์สาวผิว Warm Autumn',
    topId: 'AUT-TOP-009',
    bottomId: 'AUT-BOT-003',
    footwearId: 'AUT-ACC-007',
    accessoryId: 'AUT-ACC-001'
  },
  {
    id: 'PRESET-02',
    name: '🌸 Spring Floral Blossom (Bright Spring)',
    season: 'Spring',
    harmonyType: 'Complementary Pastel',
    description: 'เสื้อคาร์ดิแกนสีพีช ยีนส์สว่าง สนีกเกอร์คอรัล และกระเป๋าสะพายลินิน ลุคสดใสร่าเริง Bright Spring',
    topId: 'SPR-TOP-022',
    bottomId: 'SPR-BOT-015',
    footwearId: 'SPR-ACC-020',
    accessoryId: 'SPR-ACC-013'
  },
  {
    id: 'PRESET-03',
    name: '🌊 Summer Coastal Breeze (Cool Summer)',
    season: 'Summer',
    harmonyType: 'Monochromatic Muted Sky',
    description: 'เสื้อเชิ้ตซัมเมอร์สีฟ้าพาสเทล กางเกงลินิน แซนดัลเบาสบาย และหมวกสาน สุภาพผ่อนคลาย Cool Summer',
    topId: 'SUM-TOP-046',
    bottomId: 'SUM-BOT-040',
    footwearId: 'SUM-ACC-043',
    accessoryId: 'SUM-ACC-037'
  },
  {
    id: 'PRESET-04',
    name: '❄️ Winter Midnight Tailored (Vivid Winter)',
    season: 'Winter',
    harmonyType: 'High Contrast Dramatic',
    description: 'โค้ทฤดูหนาวคัตติ้งเนี้ยบ กางเกงสแล็ค บูทหนังดำ และหมวกบีนนี่ ภูมิฐาน คมกริบ Vivid Winter',
    topId: 'WIN-OUT-057',
    bottomId: 'WIN-BOT-053',
    footwearId: 'WIN-ACC-055',
    accessoryId: 'WIN-ACC-049'
  }
];

// Helper to reliably identify Footwear products
const isFootwear = (p) => {
  return p.category === 'Shoes';
};

// ผลวิเคราะห์จาก Personal Color Lab (เก็บไว้ที่ key เดียวกับหน้า /personal-color)
// ค่าที่ค้างอยู่อาจเป็นของเวอร์ชันเก่า จึงรับเฉพาะฤดูที่มี preset รองรับจริง
const readPersonalColor = () => {
  try {
    const stored = localStorage.getItem('matcha_personal_color');
    return OUTFIT_PRESETS.some((preset) => preset.season === stored) ? stored : null;
  } catch {
    return null;
  }
};

// ลุคเริ่มต้นต้องตรงกับฤดูของผู้ใช้ ไม่ใช่ตัวแรกในลิสต์เสมอ
const getPresetForSeason = (season) =>
  OUTFIT_PRESETS.find((preset) => preset.season === season) || OUTFIT_PRESETS[0];

// คะแนนบนชิปต้องมาจากเอนจินตัวเดียวกับที่โชว์ใน Color Harmony Index
// ไม่งั้นลุคเดียวกันจะมีสองเลขขัดกันอยู่บนจอเดียว
const PRESET_HARMONY = OUTFIT_PRESETS.reduce((acc, preset) => {
  const find = (id) => productsData.find((p) => p.id === id);
  acc[preset.id] = computeOutfitSynergy(
    find(preset.topId),
    find(preset.bottomId),
    find(preset.footwearId),
    find(preset.accessoryId)
  ).score;
  return acc;
}, {});

export default function MixMatchStudioPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  // Categorize items into 4 distinct wardrobe layers
  const tops = useMemo(() => productsData.filter(p => p.category === 'Tops' || p.category === 'Outerwear'), []);
  const bottoms = useMemo(() => productsData.filter(p => p.category === 'Bottoms'), []);
  const footwear = useMemo(() => productsData.filter(p => p.category === 'Shoes'), []);
  const accessories = useMemo(() => productsData.filter(p => p.category === 'Accessories'), []);

  // โทนสีผิวของผู้ใช้ + ลุคตั้งต้นที่แมตช์กับโทนนั้น
  const [userSeason] = useState(readPersonalColor);
  const initialPreset = useMemo(() => getPresetForSeason(userSeason), [userSeason]);
  const pickById = (id, fallback) => productsData.find((p) => p.id === id) || fallback;

  // Selected Outfit Slots (4-Slot Architecture)
  const [selectedTop, setSelectedTop] = useState(() => pickById(initialPreset.topId, tops[0] || productsData[0]));
  const [selectedBottom, setSelectedBottom] = useState(() => pickById(initialPreset.bottomId, bottoms[0] || productsData[1]));
  const [selectedFootwear, setSelectedFootwear] = useState(() => pickById(initialPreset.footwearId, footwear[0] || productsData[2]));
  const [selectedAccessory, setSelectedAccessory] = useState(() => pickById(initialPreset.accessoryId, accessories[0] || productsData[3]));
  const [activeSlotTab, setActiveSlotTab] = useState('tops'); // 'tops' | 'bottoms' | 'footwear' | 'accessories'
  const [activePresetId, setActivePresetId] = useState(initialPreset.id);
  const [justAddedBundle, setJustAddedBundle] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({
    tops: 'M',
    bottoms: '32',
    footwear: 'EU 41',
    accessories: 'OS'
  });
  const outfitMotionRef = useChangeMotion([selectedTop?.id, selectedBottom?.id, selectedFootwear?.id, selectedAccessory?.id].join('|'), 'outfit');
  const pickerMotionRef = useChangeMotion(activeSlotTab, 'grid');

  // Synchronize Left Column and Right Column heights on desktop (>=1024px)
  const leftColRef = useRef(null);
  const [leftColHeight, setLeftColHeight] = useState(null);
  const [isLgScreen, setIsLgScreen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  useEffect(() => {
    const handleResize = () => {
      setIsLgScreen(window.innerWidth >= 1024);
      if (leftColRef.current) {
        setLeftColHeight(leftColRef.current.offsetHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!leftColRef.current) return;
    const updateHeight = () => {
      if (leftColRef.current) {
        setLeftColHeight(leftColRef.current.offsetHeight);
      }
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(leftColRef.current);

    return () => observer.disconnect();
  }, [selectedTop, selectedBottom, selectedFootwear, selectedAccessory]);

  // Apply Predefined Preset
  const handleApplyPreset = (preset) => {
    const t = productsData.find(p => p.id === preset.topId) || tops[0];
    const b = productsData.find(p => p.id === preset.bottomId) || bottoms[0];
    const f = productsData.find(p => p.id === preset.footwearId) || footwear[0];
    const a = productsData.find(p => p.id === preset.accessoryId) || accessories[0];

    setSelectedTop(t);
    setSelectedBottom(b);
    setSelectedFootwear(f);
    setSelectedAccessory(a);
    setActivePresetId(preset.id);
  };

  // Randomize Outfit
  const handleRandomize = () => {
    // สุ่มเฉพาะของที่ยังมีสต็อก ไม่งั้นจะได้ลุคที่กดซื้อไม่ครบ
    const pickRandom = (list) => {
      const pool = list.filter((item) => item.inStock);
      const source = pool.length ? pool : list;
      return source[Math.floor(Math.random() * source.length)];
    };

    setSelectedTop(pickRandom(tops));
    setSelectedBottom(pickRandom(bottoms));
    setSelectedFootwear(pickRandom(footwear));
    setSelectedAccessory(pickRandom(accessories));
    setActivePresetId(null);
  };

  // Pricing & Combo Discount (12% Full 4-Piece Bundle Discount)
  // ราคาที่โชว์ต้องเท่ากับที่จะโดนตัดจริง จึงนับเฉพาะชิ้นที่ยังมีของ
  // และส่วนลดจะใช้ได้ก็ต่อเมื่อซื้อครบทั้ง 4 ชิ้นจริง ๆ ตามเงื่อนไข bundle
  const itemsInOutfit = [selectedTop, selectedBottom, selectedFootwear, selectedAccessory].filter(Boolean);
  const buyableItems = itemsInOutfit.filter((item) => item.inStock);
  const outOfStockItems = itemsInOutfit.filter((item) => !item.inStock);
  const isCompleteBundle = buyableItems.length === 4;
  const bundleSubtotal = buyableItems.reduce((sum, item) => sum + Number(item.price), 0);
  const comboDiscount = isCompleteBundle ? bundleSubtotal * BUNDLE_DISCOUNT_RATE : 0;
  const finalBundleTotal = Math.max(0, bundleSubtotal - comboDiscount);

  // Dynamic Computational Color Harmony Engine (Grounded Theory)
  const synergy = useMemo(() => {
    return computeOutfitSynergy(selectedTop, selectedBottom, selectedFootwear, selectedAccessory);
  }, [selectedTop, selectedBottom, selectedFootwear, selectedAccessory]);

  const harmonyScore = synergy.score;

  // 1-Click Add Entire Outfit to Cart
  const handleAddBundleToCart = () => {
    if (buyableItems.length === 0) {
      showToast('ไม่สามารถเพิ่มชุดได้ เนื่องจากสินค้าทั้งหมดในเซ็ตนี้หมดสต็อกชั่วคราว', 'error');
      return;
    }

    setJustAddedBundle(true);
    setTimeout(() => setJustAddedBundle(false), 1200);

    buyableItems.forEach(item => {
      const slotKey = (item.category === 'Tops' || item.category === 'Outerwear') ? 'tops' :
                      item.category === 'Bottoms' ? 'bottoms' :
                      item.category === 'Shoes' ? 'footwear' : 'accessories';

      const chosenSize = selectedSizes[slotKey] || item.sizes?.[0] || (item.category === 'Accessories' ? 'OS' : item.category === 'Shoes' ? 'EU 40' : 'M');

      addToCart({
        ...item,
        // ส่งราคาเต็มเพื่อความโปร่งใส ส่วนลด bundle แสดงแยกบรรทัดใน Order Summary
        price: Number(item.price),
        originalPrice: Number(item.price),
        isBundleItem: isCompleteBundle,
        bundleDiscountRate: isCompleteBundle ? BUNDLE_DISCOUNT_RATE : 0,
        quantity: 1,
        size: chosenSize
      });
    });

    if (outOfStockItems.length > 0) {
      const oosNames = outOfStockItems.map(i => i.name).join(', ');
      showToast(`⚠️ เพิ่มลงตะกร้า ${buyableItems.length} ชิ้น (ยกเว้น ${oosNames} เนื่องจากหมดสต็อก) — ส่วนลดเซ็ต ${BUNDLE_DISCOUNT_PERCENT}% ใช้ได้เมื่อครบ 4 ชิ้นเท่านั้น`, 'info');
    } else {
      showToast(`✨ เพิ่มเซ็ตชุดครบ ${buyableItems.length} ชิ้นลงตะกร้าเรียบร้อยแล้ว (ส่วนลดเซ็ต ${BUNDLE_DISCOUNT_PERCENT}% จะแสดงในใบสรุปยอด)`, 'success');
    }
  };

  // Currently active items for the right-side picker
  // เรียงของฤดูผู้ใช้ขึ้นก่อน และดันของหมดสต็อกไปท้ายสุด
  const currentSlotItems = useMemo(() => {
    const list =
      activeSlotTab === 'tops' ? tops :
      activeSlotTab === 'bottoms' ? bottoms :
      activeSlotTab === 'footwear' ? footwear : accessories;

    const rank = (item) =>
      (item.inStock ? 0 : 2) + (userSeason && item.season === userSeason ? 0 : 1);

    return [...list].sort((a, b) => rank(a) - rank(b));
  }, [activeSlotTab, tops, bottoms, footwear, accessories, userSeason]);

  return (
    <div className="w-full bg-[#F1F1F1] min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14">

        {/* 1. HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DCDCDC]">
          <div>
            <div data-enter className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1F1F1] border border-[#042509]/20 text-[#042509] text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Sparkles size={14} />
              <span>Head-to-Toe 4-Slot Wardrobe Canvas</span>
            </div>
            <h1 data-enter="wipe" style={{ '--enter-delay': '90ms' }} className="text-3xl sm:text-5xl font-black uppercase text-[#000000] tracking-tight font-serif">
              Mix & Match Fashion Studio
            </h1>
            <p data-enter style={{ '--enter-delay': '190ms' }} className="text-[#666666] text-xs sm:text-sm mt-1">
              จับคู่ลุคสมบูรณ์แบบ เสื้อ • กางเกง • รองเท้า • เครื่องประดับ พร้อมระบบคำนวณ Color Harmony ตามทฤษฎีสากล
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRandomize}
              className="px-4 py-2.5 rounded-xl border border-[#DCDCDC] bg-white hover:bg-[#F1F1F1] text-[#000000] font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Shuffle size={14} />
              <span>สุ่มชุดใหม่ (Shuffle)</span>
            </button>
            <button
              onClick={() => navigate('/personal-color')}
              className="px-4 py-2.5 rounded-xl bg-[#000000] text-[#518F5C] hover:text-white font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Palette size={14} />
              <span>Personal Color Lab</span>
            </button>
          </div>
        </div>

        {/* 2. EDITORIAL PRESET CHIPS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-[#666666] tracking-wider block">
              {userSeason
                ? `ลุคแนะนำตามโทนสีผิวของคุณ (${userSeason}) 4-Piece Presets:`
                : 'ลุคแฟชั่นยอดนิยม 4-Piece Presets:'}
            </span>
            {activePresetId && (
              <span className="text-[10px] font-mono text-[#042509] font-bold bg-[#F1F1F1] px-2.5 py-0.5 rounded-full">
                ✓ กำลังแสดงลุคที่เลือก
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {OUTFIT_PRESETS.map((preset) => {
              const isActive = activePresetId === preset.id;
              const isUserSeason = Boolean(userSeason) && preset.season === userSeason;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer group relative ${
                    isActive
                      ? 'border-[#042509] bg-[#042509]/8 shadow-lg ring-2 ring-[#042509]/25 scale-[1.02]'
                      : 'border-[#DCDCDC] bg-white hover:border-[#042509]/50 hover:bg-[#F1F1F1] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold font-mono mb-1.5">
                    <span className={`truncate font-bold transition-colors ${
                      isActive ? 'text-[#042509]' : 'text-[#000000] group-hover:text-[#042509]'
                    }`}>
                      {preset.name}
                    </span>
                    <span
                      title={`Color Harmony: ${preset.harmonyType}`}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors shrink-0 ${
                        isActive
                          ? 'bg-[#042509] text-white shadow-xs'
                          : 'bg-[#F1F1F1] text-[#042509]'
                      }`}
                    >
                      {PRESET_HARMONY[preset.id]}% Harmony
                    </span>
                  </div>
                  <p className={`text-[11px] line-clamp-2 leading-relaxed transition-colors ${
                    isActive ? 'text-[#000000] font-medium' : 'text-[#666666]'
                  }`}>
                    {preset.description}
                  </p>
                  {isUserSeason && (
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#042509] bg-[#F1F1F1] px-2 py-0.5 rounded-full">
                      ✓ ตรงกับผลวิเคราะห์ของคุณ
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. TWO-COLUMN STUDIO INTERFACE (Equal Height Aligned) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: 4-Slot Interactive Fitting Canvas (5 Cols - Sourced Height) */}
          <div 
            ref={leftColRef}
            className="lg:col-span-5 bg-white rounded-3xl border border-[#DCDCDC] p-6 shadow-xl space-y-6"
          >
            
            <div className="flex items-center justify-between border-b border-[#DCDCDC]/60 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-[#042509]" />
                <h3 className="font-serif text-lg font-bold text-[#000000]">Head-to-Toe Canvas</h3>
              </div>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                isCompleteBundle ? 'bg-[#042509] text-white' : 'bg-[#FEE4E2] text-[#B42318]'
              }`}>
                {isCompleteBundle
                  ? `${buyableItems.length} ชิ้นครบเซ็ต`
                  : `ซื้อได้ ${buyableItems.length}/${itemsInOutfit.length} ชิ้น`}
              </span>
            </div>

            {/* Visual Canvas Stack (4 Slots) */}
            <div ref={outfitMotionRef} className="space-y-2.5 bg-[#F1F1F1] p-3.5 rounded-2xl border border-[#DCDCDC]">
              
              {/* Slot 1: Top / Upper Body */}
              <div 
                onClick={() => setActiveSlotTab('tops')}
                data-motion-slot="tops" data-motion-item={selectedTop?.id}
                className={`p-2.5 bg-white rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                  activeSlotTab === 'tops' ? 'border-[#042509] ring-2 ring-[#042509]/20 shadow-sm' : 'border-[#DCDCDC]'
                }`}
              >
                <img 
                  src={webpSrc(selectedTop?.image)} data-original-src={selectedTop?.image} 
                  alt={selectedTop?.name} 
                  onError={handleImageError}
                  className="w-14 h-16 object-contain bg-[#F1F1F1] rounded-lg p-1" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#042509]">
                    <Shirt size={12} />
                    <span>1. Upper Body (30%)</span>
                  </div>
                  <h4 className="font-bold text-xs text-[#000000] truncate">{selectedTop?.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: selectedTop?.colorHex }} />
                    <span className="text-[11px] font-mono text-[#666666]">${selectedTop?.price}</span>
                    {selectedTop && !selectedTop.inStock && (
                      <span className="text-[9px] font-mono font-bold text-[#B42318] bg-[#FEE4E2] px-1.5 py-0.5 rounded">หมดสต็อก</span>
                    )}
                    <span className="text-[10px] font-mono text-[#8C7E74]">({selectedTop?.fit || 'Regular'})</span>
                  </div>

                  {/* Size Selector */}
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pt-1 border-t border-[#DCDCDC]/50" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[9px] font-mono font-bold text-[#666666] uppercase">ไซซ์:</span>
                    {(selectedTop?.sizes || ['S', 'M', 'L', 'XL']).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSizes(prev => ({ ...prev, tops: sz }))}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                          selectedSizes.tops === sz
                            ? 'bg-[#042509] text-white shadow-2xs'
                            : 'bg-[#F1F1F1] text-[#666666] hover:bg-[#DCDCDC]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slot 2: Bottom / Lower Body */}
              <div 
                onClick={() => setActiveSlotTab('bottoms')}
                data-motion-slot="bottoms" data-motion-item={selectedBottom?.id}
                className={`p-2.5 bg-white rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                  activeSlotTab === 'bottoms' ? 'border-[#042509] ring-2 ring-[#042509]/20 shadow-sm' : 'border-[#DCDCDC]'
                }`}
              >
                <img 
                  src={webpSrc(selectedBottom?.image)} data-original-src={selectedBottom?.image} 
                  alt={selectedBottom?.name} 
                  onError={handleImageError}
                  className="w-14 h-16 object-contain bg-[#F1F1F1] rounded-lg p-1" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#042509]">
                    <Scissors size={12} />
                    <span>2. Lower Body (60% Base)</span>
                  </div>
                  <h4 className="font-bold text-xs text-[#000000] truncate">{selectedBottom?.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: selectedBottom?.colorHex }} />
                    <span className="text-[11px] font-mono text-[#666666]">${selectedBottom?.price}</span>
                    {selectedBottom && !selectedBottom.inStock && (
                      <span className="text-[9px] font-mono font-bold text-[#B42318] bg-[#FEE4E2] px-1.5 py-0.5 rounded">หมดสต็อก</span>
                    )}
                    <span className="text-[10px] font-mono text-[#8C7E74]">({selectedBottom?.fit || 'Regular'})</span>
                  </div>

                  {/* Size Selector */}
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pt-1 border-t border-[#DCDCDC]/50" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[9px] font-mono font-bold text-[#666666] uppercase">ไซซ์:</span>
                    {(selectedBottom?.sizes || ['30', '32', '34', '36']).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSizes(prev => ({ ...prev, bottoms: sz }))}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                          selectedSizes.bottoms === sz
                            ? 'bg-[#042509] text-white shadow-2xs'
                            : 'bg-[#F1F1F1] text-[#666666] hover:bg-[#DCDCDC]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slot 3: Footwear Anchor */}
              <div 
                onClick={() => setActiveSlotTab('footwear')}
                data-motion-slot="footwear" data-motion-item={selectedFootwear?.id}
                className={`p-2.5 bg-white rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                  activeSlotTab === 'footwear' ? 'border-[#042509] ring-2 ring-[#042509]/20 shadow-sm' : 'border-[#DCDCDC]'
                }`}
              >
                <img 
                  src={webpSrc(selectedFootwear?.image)} data-original-src={selectedFootwear?.image} 
                  alt={selectedFootwear?.name} 
                  onError={handleImageError}
                  className="w-14 h-16 object-contain bg-[#F1F1F1] rounded-lg p-1" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#C91D1D]">
                    <Footprints size={12} />
                    <span>3. Footwear Anchor (5%)</span>
                  </div>
                  <h4 className="font-bold text-xs text-[#000000] truncate">{selectedFootwear?.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: selectedFootwear?.colorHex }} />
                    <span className="text-[11px] font-mono text-[#666666]">${selectedFootwear?.price}</span>
                    {selectedFootwear && !selectedFootwear.inStock && (
                      <span className="text-[9px] font-mono font-bold text-[#B42318] bg-[#FEE4E2] px-1.5 py-0.5 rounded">หมดสต็อก</span>
                    )}
                    <span className="text-[10px] font-mono text-[#8C7E74]">({selectedFootwear?.color})</span>
                  </div>

                  {/* Size Selector */}
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pt-1 border-t border-[#DCDCDC]/50" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[9px] font-mono font-bold text-[#666666] uppercase">ไซซ์:</span>
                    {(selectedFootwear?.sizes || ['EU 40', 'EU 41', 'EU 42', 'EU 43']).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSizes(prev => ({ ...prev, footwear: sz }))}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                          selectedSizes.footwear === sz
                            ? 'bg-[#042509] text-white shadow-2xs'
                            : 'bg-[#F1F1F1] text-[#666666] hover:bg-[#DCDCDC]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slot 4: Accent Accessories */}
              <div 
                onClick={() => setActiveSlotTab('accessories')}
                data-motion-slot="accessories" data-motion-item={selectedAccessory?.id}
                className={`p-2.5 bg-white rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                  activeSlotTab === 'accessories' ? 'border-[#042509] ring-2 ring-[#042509]/20 shadow-sm' : 'border-[#DCDCDC]'
                }`}
              >
                <img 
                  src={webpSrc(selectedAccessory?.image)} data-original-src={selectedAccessory?.image} 
                  alt={selectedAccessory?.name} 
                  onError={handleImageError}
                  className="w-14 h-16 object-contain bg-[#F1F1F1] rounded-lg p-1" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#042509]">
                    <Briefcase size={12} />
                    <span>4. Accent Accessory (5%)</span>
                  </div>
                  <h4 className="font-bold text-xs text-[#000000] truncate">{selectedAccessory?.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: selectedAccessory?.colorHex }} />
                    <span className="text-[11px] font-mono text-[#666666]">${selectedAccessory?.price}</span>
                    {selectedAccessory && !selectedAccessory.inStock && (
                      <span className="text-[9px] font-mono font-bold text-[#B42318] bg-[#FEE4E2] px-1.5 py-0.5 rounded">หมดสต็อก</span>
                    )}
                    <span className="text-[10px] font-mono text-[#8C7E74]">({selectedAccessory?.color})</span>
                  </div>

                  {/* Size Selector */}
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pt-1 border-t border-[#DCDCDC]/50" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[9px] font-mono font-bold text-[#666666] uppercase">ไซซ์:</span>
                    {(selectedAccessory?.sizes || ['One Size']).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSizes(prev => ({ ...prev, accessories: sz }))}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                          selectedSizes.accessories === sz
                            ? 'bg-[#042509] text-white shadow-2xs'
                            : 'bg-[#F1F1F1] text-[#666666] hover:bg-[#DCDCDC]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Color Harmony Score Metric (Computational Fashion Engine) */}
            <div className="p-4 rounded-2xl bg-[#F1F1F1] border border-[#DCDCDC] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="uppercase text-[#666666]">Color Harmony Index:</span>
                <span className="text-[#042509] font-black text-sm">{harmonyScore}% Synergy</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white border border-[#DCDCDC] overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-[#8F9779] to-[#042509] transition-all duration-500" 
                  style={{ width: `${harmonyScore}%` }}
                />
              </div>

              {/* Harmony Type & Season Tag */}
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-[#042509]/10 text-[#042509] font-bold">
                  {synergy.harmonyType}
                </span>
                <span className="text-[#666666]">
                  {synergy.dominantSeason} Capsule
                </span>
              </div>

              {/* 60-30-10 Color Proportion Rule (4-Piece Distribution) */}
              {synergy.proportion60_30_10 && (
                <div className="pt-2 border-t border-[#DCDCDC]/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#666666]">
                    <span>RULE 60-30-10 PROPORTION</span>
                    <span className="text-[#042509]">Base • Top • Shoes • Bag</span>
                  </div>
                  <div className="flex h-3 w-full rounded-md overflow-hidden border border-[#DCDCDC] shadow-xs">
                    <div 
                      style={{ width: '60%', backgroundColor: synergy.proportion60_30_10.base.hex }} 
                      title={`60% Base (Lower Body): ${synergy.proportion60_30_10.base.name}`} 
                    />
                    <div 
                      style={{ width: '30%', backgroundColor: synergy.proportion60_30_10.secondary.hex }} 
                      title={`30% Secondary (Upper Body): ${synergy.proportion60_30_10.secondary.name}`} 
                    />
                    <div 
                      style={{ width: '5%', backgroundColor: synergy.proportion60_30_10.footwear.hex }} 
                      title={`5% Footwear Anchor: ${synergy.proportion60_30_10.footwear.name}`} 
                    />
                    <div 
                      style={{ width: '5%', backgroundColor: synergy.proportion60_30_10.accent.hex }} 
                      title={`5% Accessory: ${synergy.proportion60_30_10.accent.name}`} 
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-[#666666]">
                    <span className="truncate max-w-[28%]">60% {synergy.proportion60_30_10.base.color}</span>
                    <span className="truncate max-w-[28%] text-center">30% {synergy.proportion60_30_10.secondary.color}</span>
                    <span className="truncate max-w-[22%] text-center">5% {synergy.proportion60_30_10.footwear.color}</span>
                    <span className="truncate max-w-[22%] text-right">5% {synergy.proportion60_30_10.accent.color}</span>
                  </div>
                </div>
              )}

              {/* Detected Itten Optical Contrasts & Delta E */}
              <div className="pt-2 border-t border-[#DCDCDC]/60 space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-[#666666] block">
                  Optical Contrasts (Johannes Itten):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {synergy.ittenContrasts && synergy.ittenContrasts.map((contrast) => (
                    <span 
                      key={contrast.id} 
                      className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#F1F1F1] text-[#042509] font-semibold"
                      title={contrast.description}
                    >
                      {contrast.name}: {contrast.badge}
                    </span>
                  ))}
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white border border-[#DCDCDC] text-[#666666]" title="CIELAB Color Distance (ΔE)">
                    ΔE: {synergy.deltaE}
                  </span>
                </div>
              </div>

              {/* Styling Critique Advice */}
              <p className="text-[11px] text-[#000000] leading-relaxed pt-1 font-medium bg-white/60 p-2 rounded-lg border border-[#DCDCDC]/50">
                💡 {synergy.stylingAdvice}
              </p>
            </div>

            {/* Pricing & 1-Click Bundle Button */}
            <div className="space-y-3 pt-2">
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xs text-[#666666] uppercase font-bold">
                  Total Bundle ({buyableItems.length} Item{buyableItems.length === 1 ? '' : 's'}):
                </span>
                <div className="text-right">
                  {isCompleteBundle && (
                    <span className="text-xs line-through text-[#666666] mr-2">${bundleSubtotal.toFixed(2)}</span>
                  )}
                  <span className="text-xl font-black text-[#000000]">${finalBundleTotal.toFixed(2)}</span>
                </div>
              </div>

              {outOfStockItems.length > 0 && (
                <p className="text-[10px] font-mono text-[#B42318] bg-[#FEE4E2] px-2.5 py-1.5 rounded-lg leading-relaxed">
                  {outOfStockItems.map((i) => i.name).join(', ')} หมดสต็อก — ไม่ถูกนับในราคานี้
                  {` และส่วนลดเซ็ต ${BUNDLE_DISCOUNT_PERCENT}% ใช้ได้เมื่อครบ 4 ชิ้น`}
                </p>
              )}

              <button
                onClick={handleAddBundleToCart}
                className={`w-full py-4 rounded-2xl font-mono font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                  justAddedBundle 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-[#042509] hover:bg-[#1E3D1A] text-white shadow-[#042509]/25'
                }`}
              >
                {justAddedBundle ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Added Complete Outfit to Bag! ✓</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>
                      {isCompleteBundle
                        ? `Add Complete Outfit (4 Pcs) • $${finalBundleTotal.toFixed(2)}`
                        : `Add ${buyableItems.length} Available Pcs • $${finalBundleTotal.toFixed(2)}`}
                    </span>
                  </>
                )}
              </button>
              <p className="text-[10px] font-mono text-center text-[#8C7E74] pt-1">
                * ข้อมูลสเปกและไซซ์เป็นข้อมูลตัวอย่าง รอยืนยันจากร้าน (Sample Spec)
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Slot Item Pickers (7 Cols - Equal Height to Left Column) */}
          <div 
            style={isLgScreen && leftColHeight ? { height: `${leftColHeight}px` } : undefined}
            className="lg:col-span-7 bg-white rounded-3xl border border-[#DCDCDC] p-6 sm:p-8 shadow-xl flex flex-col transition-[height] duration-150"
          >
            
            {/* Slot Tab Switches (4 Tabs) */}
            <div className="flex items-center gap-1.5 sm:gap-2 border-b border-[#DCDCDC] pb-4 overflow-x-auto shrink-0 mb-6">
              <button
                onClick={() => setActiveSlotTab('tops')}
                className={`px-3 sm:px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeSlotTab === 'tops' 
                    ? 'bg-[#000000] text-white shadow-sm' 
                    : 'bg-[#F1F1F1] text-[#666666] hover:text-[#000000]'
                }`}
              >
                <Shirt size={14} />
                <span>1. Tops ({tops.length})</span>
              </button>

              <button
                onClick={() => setActiveSlotTab('bottoms')}
                className={`px-3 sm:px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeSlotTab === 'bottoms' 
                    ? 'bg-[#000000] text-white shadow-sm' 
                    : 'bg-[#F1F1F1] text-[#666666] hover:text-[#000000]'
                }`}
              >
                <Scissors size={14} />
                <span>2. Bottoms ({bottoms.length})</span>
              </button>

              <button
                onClick={() => setActiveSlotTab('footwear')}
                className={`px-3 sm:px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeSlotTab === 'footwear' 
                    ? 'bg-[#000000] text-white shadow-sm' 
                    : 'bg-[#F1F1F1] text-[#666666] hover:text-[#000000]'
                }`}
              >
                <Footprints size={14} />
                <span>3. Shoes ({footwear.length})</span>
              </button>

              <button
                onClick={() => setActiveSlotTab('accessories')}
                className={`px-3 sm:px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeSlotTab === 'accessories' 
                    ? 'bg-[#000000] text-white shadow-sm' 
                    : 'bg-[#F1F1F1] text-[#666666] hover:text-[#000000]'
                }`}
              >
                <Briefcase size={14} />
                <span>4. Bags &amp; Accs ({accessories.length})</span>
              </button>
            </div>

            {/* Grid of Items for the Active Slot (Fills Available Height to Match Left Column) */}
            <div 
              data-lenis-prevent="true"
              ref={pickerMotionRef}
              onWheel={(e) => e.stopPropagation()}
              className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 min-h-120 lg:min-h-0 overflow-y-auto overscroll-contain pr-2"
            >
              {currentSlotItems.map((item) => {
                const isSelected = (
                  (activeSlotTab === 'tops' && selectedTop?.id === item.id) ||
                  (activeSlotTab === 'bottoms' && selectedBottom?.id === item.id) ||
                  (activeSlotTab === 'footwear' && selectedFootwear?.id === item.id) ||
                  (activeSlotTab === 'accessories' && selectedAccessory?.id === item.id)
                );

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (activeSlotTab === 'tops') setSelectedTop(item);
                      else if (activeSlotTab === 'bottoms') setSelectedBottom(item);
                      else if (activeSlotTab === 'footwear') setSelectedFootwear(item);
                      else if (activeSlotTab === 'accessories') setSelectedAccessory(item);
                      setActivePresetId(null);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected 
                        ? 'border-[#042509] bg-[#F1F1F1] ring-2 ring-[#042509]/20 shadow-md' 
                        : 'border-[#DCDCDC] bg-white hover:border-[#666666]'
                    }`}
                  >
                    <div className="relative aspect-4/5 w-full bg-[#F1F1F1] rounded-xl overflow-hidden mb-2.5 p-2 flex items-center justify-center">
                      <img 
                        src={webpSrc(item.image)} data-original-src={item.image} 
                        loading="lazy"
                        decoding="async"
                        alt={item.name} 
                        onError={handleImageError}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200" 
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#042509] text-white flex items-center justify-center shadow-md">
                          <Check size={14} />
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 text-[9px] font-mono px-2 py-0.5 bg-white/90 rounded backdrop-blur-xs font-bold text-[#000000]">
                        {item.season}
                      </span>
                      {!item.inStock && (
                        <span className="absolute top-2 left-2 text-[9px] font-mono px-2 py-0.5 bg-[#B42318] text-white rounded font-bold">
                          หมดสต็อก
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-[#000000] line-clamp-1 group-hover:text-[#042509]">
                        {item.name}
                      </h5>
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold text-[#000000]">${Number(item.price).toFixed(2)}</span>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: item.colorHex }} />
                          <span className="text-[10px] text-[#666666] truncate max-w-16">{item.color}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
