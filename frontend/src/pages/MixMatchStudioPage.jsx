import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ShoppingBag, 
  Check, 
  RotateCcw, 
  ArrowRight, 
  Layers, 
  Palette, 
  Shuffle, 
  SlidersHorizontal, 
  Tag,
  CheckCircle2,
  Heart
} from 'lucide-react';
import { productsData } from '../data/productsData';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { handleImageError } from '../utils/imageFallback';

// Curated Editorial Presets
const OUTFIT_PRESETS = [
  {
    id: 'PRESET-01',
    name: '🍵 Kyoto Artisan Earth (Warm Autumn)',
    season: 'Autumn',
    harmonyScore: 98,
    harmonyType: 'Analogous Warm Palette',
    description: 'การจับคู่สีมัสตาร์ดเอิร์ธโทนกับกางเกงลินินอบอุ่น ขับเน้นเสน่ห์ของสาวผิว Warm Undertone',
    topId: 'AUT-TOP-001',
    bottomId: 'AUT-BOT-001',
    accessoryId: 'AUT-ACC-001'
  },
  {
    id: 'PRESET-02',
    name: '🌸 Spring Floral Blossom (Bright Spring)',
    season: 'Spring',
    harmonyScore: 95,
    harmonyType: 'Complementary Pastel',
    description: 'โทนสีพีชคอรัลจับคู่กับเฉดครีมสว่าง ให้ลุคสดใส ร่าเริง สไตล์สาวเกาหลี',
    topId: 'SPR-TOP-001',
    bottomId: 'SPR-BOT-001',
    accessoryId: 'SPR-ACC-001'
  },
  {
    id: 'PRESET-03',
    name: '🌊 Summer Coastal Breeze (Cool Summer)',
    season: 'Summer',
    harmonyScore: 94,
    harmonyType: 'Monochromatic Muted Sky',
    description: 'โทนสีลาเวนเดอร์และมินต์พาสเทล ให้ความรู้สึกผ่อนคลายและสุภาพอย่างมีระดับ',
    topId: 'SUM-TOP-001',
    bottomId: 'SUM-BOT-001',
    accessoryId: 'SUM-ACC-001'
  },
  {
    id: 'PRESET-04',
    name: '❄️ Winter Midnight Tailored (Vivid Winter)',
    season: 'Winter',
    harmonyScore: 97,
    harmonyType: 'High Contrast Dramatic',
    description: 'เบลเซอร์สีกรมท่าเข้มตัดกับสแล็คชาร์โคล ให้ลุคภูมิฐาน คมกริบ สไตล์สาวมั่น',
    topId: 'WIN-TOP-001',
    bottomId: 'WIN-BOT-001',
    accessoryId: 'WIN-ACC-001'
  }
];

export default function MixMatchStudioPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  // Categorize items
  const tops = productsData.filter(p => p.category === 'Tops' || p.category === 'Outerwear');
  const bottoms = productsData.filter(p => p.category === 'Bottoms');
  const accessories = productsData.filter(p => p.category === 'Accessories' || p.category === 'Shoes');

  // Selected Outfit Slots
  const [selectedTop, setSelectedTop] = useState(tops[0] || productsData[0]);
  const [selectedBottom, setSelectedBottom] = useState(bottoms[0] || productsData[1]);
  const [selectedAccessory, setSelectedAccessory] = useState(accessories[0] || productsData[2]);
  const [activeSlotTab, setActiveSlotTab] = useState('tops'); // 'tops' | 'bottoms' | 'accessories'
  const [activePresetId, setActivePresetId] = useState('PRESET-01');
  const [justAddedBundle, setJustAddedBundle] = useState(false);

  // Apply Predefined Preset
  const handleApplyPreset = (preset) => {
    const t = productsData.find(p => p.id === preset.topId) || tops[0];
    const b = productsData.find(p => p.id === preset.bottomId) || bottoms[0];
    const a = productsData.find(p => p.id === preset.accessoryId) || accessories[0];

    setSelectedTop(t);
    setSelectedBottom(b);
    setSelectedAccessory(a);
    setActivePresetId(preset.id);
  };

  // Randomize Outfit
  const handleRandomize = () => {
    const randomTop = tops[Math.floor(Math.random() * tops.length)];
    const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    const randomAcc = accessories[Math.floor(Math.random() * accessories.length)];

    setSelectedTop(randomTop);
    setSelectedBottom(randomBottom);
    setSelectedAccessory(randomAcc);
    setActivePresetId(null);
  };

  // Pricing & Combo Discount
  const itemsInOutfit = [selectedTop, selectedBottom, selectedAccessory].filter(Boolean);
  const bundleSubtotal = itemsInOutfit.reduce((sum, item) => sum + Number(item.price), 0);
  const comboDiscount = bundleSubtotal * 0.10; // 10% Bundle Discount
  const finalBundleTotal = Math.max(0, bundleSubtotal - comboDiscount);

  // Calculate Color Harmony Score based on Season Alignment
  const seasons = [selectedTop?.season, selectedBottom?.season, selectedAccessory?.season].filter(Boolean);
  const isSameSeason = seasons.every(s => s === seasons[0]);
  const harmonyScore = isSameSeason ? 98 : (seasons[0] === seasons[1] || seasons[1] === seasons[2] ? 92 : 86);
  const dominantSeason = seasons[0] || 'Autumn';

  // 1-Click Add Entire Outfit to Cart
  const handleAddBundleToCart = () => {
    setJustAddedBundle(true);
    setTimeout(() => setJustAddedBundle(false), 1200);

    itemsInOutfit.forEach(item => {
      addToCart({
        ...item,
        quantity: 1,
        size: item.sizes?.[0] || 'M'
      });
    });

    showToast(`✨ เพิ่มเซ็ตชุด ${itemsInOutfit.length} ชิ้นลงตะกร้าพร้อมรับส่วนลด 10% เรียบร้อยแล้ว!`, 'success');
  };

  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14">

        {/* 1. HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#D9D3C7]">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E2ECE9] border border-[#2D5A27]/20 text-[#2D5A27] text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Sparkles size={14} />
              <span>Interactive Wardrobe Canvas</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase text-[#2D231E] tracking-tight font-serif">
              Mix & Match Fashion Studio
            </h1>
            <p className="text-[#6B5E55] text-xs sm:text-sm mt-1">
              จับคู่เสื้อผ้าข้ามหมวดหมู่ คำนวณความเข้ากันได้ของคู่สี (Color Harmony) และรับส่วนลดเซ็ตพิเศษ 10%
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRandomize}
              className="px-4 py-2.5 rounded-xl border border-[#D9D3C7] bg-white hover:bg-[#FAF8F5] text-[#2D231E] font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Shuffle size={14} />
              <span>สุ่มชุดใหม่ (Shuffle)</span>
            </button>
            <button
              onClick={() => navigate('/personal-color')}
              className="px-4 py-2.5 rounded-xl bg-[#2D231E] text-[#D0DEC6] hover:text-white font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Palette size={14} />
              <span>Personal Color Lab</span>
            </button>
          </div>
        </div>

        {/* 2. EDITORIAL PRESET CHIPS */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-[#6B5E55] tracking-wider block">
              ลุคแฟชั่นยอดนิยม (Curated Presets):
            </span>
            {activePresetId && (
              <span className="text-[10px] font-mono text-[#2D5A27] font-bold bg-[#E2ECE9] px-2.5 py-0.5 rounded-full">
                ✓ กำลังแสดงลุคที่เลือก
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {OUTFIT_PRESETS.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer group relative ${
                    isActive
                      ? 'border-[#2D5A27] bg-[#2D5A27]/8 shadow-lg ring-2 ring-[#2D5A27]/25 scale-[1.02]'
                      : 'border-[#D9D3C7] bg-white hover:border-[#2D5A27]/50 hover:bg-[#FAF8F5] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold font-mono mb-1.5">
                    <span className={`truncate font-bold transition-colors ${
                      isActive ? 'text-[#2D5A27]' : 'text-[#2D231E] group-hover:text-[#2D5A27]'
                    }`}>
                      {preset.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-[#2D5A27] text-white shadow-xs' 
                        : 'bg-[#E2ECE9] text-[#2D5A27]'
                    }`}>
                      {preset.harmonyScore}%
                    </span>
                  </div>
                  <p className={`text-[11px] line-clamp-2 leading-relaxed transition-colors ${
                    isActive ? 'text-[#2D231E] font-medium' : 'text-[#6B5E55]'
                  }`}>
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>

        {/* 3. TWO-COLUMN STUDIO INTERFACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: 3-Slot Interactive Fitting Canvas (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#D9D3C7] p-6 shadow-xl space-y-6 sticky top-24">
            
            <div className="flex items-center justify-between border-b border-[#D9D3C7]/60 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-[#2D5A27]" />
                <h3 className="font-serif text-lg font-bold text-[#2D231E]">Artisan Outfit Canvas</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#2D5A27] text-white">
                {itemsInOutfit.length} ชิ้นในเซ็ต
              </span>
            </div>

            {/* Visual Canvas Stack */}
            <div className="space-y-3 bg-[#FAF8F5] p-4 rounded-2xl border border-[#D9D3C7]">
              
              {/* Slot 1: Top */}
              <div 
                onClick={() => setActiveSlotTab('tops')}
                className={`p-3 bg-white rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                  activeSlotTab === 'tops' ? 'border-[#2D5A27] ring-2 ring-[#2D5A27]/20 shadow-sm' : 'border-[#D9D3C7]'
                }`}
              >
                <img 
                  src={selectedTop?.image} 
                  alt={selectedTop?.name} 
                  onError={handleImageError}
                  className="w-16 h-20 object-contain bg-[#FAF8F5] rounded-lg p-1" 
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#2D5A27]">1. Upper Body</span>
                  <h4 className="font-bold text-xs text-[#2D231E] truncate">{selectedTop?.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedTop?.colorHex }} />
                    <span className="text-[11px] font-mono text-[#6B5E55]">${selectedTop?.price}</span>
                  </div>
                </div>
              </div>

              {/* Slot 2: Bottom */}
              <div 
                onClick={() => setActiveSlotTab('bottoms')}
                className={`p-3 bg-white rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                  activeSlotTab === 'bottoms' ? 'border-[#2D5A27] ring-2 ring-[#2D5A27]/20 shadow-sm' : 'border-[#D9D3C7]'
                }`}
              >
                <img 
                  src={selectedBottom?.image} 
                  alt={selectedBottom?.name} 
                  onError={handleImageError}
                  className="w-16 h-20 object-contain bg-[#FAF8F5] rounded-lg p-1" 
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#2D5A27]">2. Lower Body</span>
                  <h4 className="font-bold text-xs text-[#2D231E] truncate">{selectedBottom?.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedBottom?.colorHex }} />
                    <span className="text-[11px] font-mono text-[#6B5E55]">${selectedBottom?.price}</span>
                  </div>
                </div>
              </div>

              {/* Slot 3: Accessory */}
              <div 
                onClick={() => setActiveSlotTab('accessories')}
                className={`p-3 bg-white rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                  activeSlotTab === 'accessories' ? 'border-[#2D5A27] ring-2 ring-[#2D5A27]/20 shadow-sm' : 'border-[#D9D3C7]'
                }`}
              >
                <img 
                  src={selectedAccessory?.image} 
                  alt={selectedAccessory?.name} 
                  onError={handleImageError}
                  className="w-16 h-20 object-contain bg-[#FAF8F5] rounded-lg p-1" 
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#2D5A27]">3. Accent Accessory</span>
                  <h4 className="font-bold text-xs text-[#2D231E] truncate">{selectedAccessory?.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedAccessory?.colorHex }} />
                    <span className="text-[11px] font-mono text-[#6B5E55]">${selectedAccessory?.price}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Color Harmony Score Metric */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#D9D3C7] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="uppercase text-[#6B5E55]">Color Harmony Index:</span>
                <span className="text-[#2D5A27] font-black text-sm">{harmonyScore}% Synergy</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white border border-[#D9D3C7] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#8F9779] to-[#2D5A27] transition-all duration-500" 
                  style={{ width: `${harmonyScore}%` }}
                />
              </div>
              <p className="text-[11px] text-[#6B5E55] leading-relaxed">
                {isSameSeason 
                  ? `✨ โทนสีคุมธีม ${dominantSeason} อย่างสมบูรณ์แบบ ขับผิวให้ดูโดดเด่น ไร้ที่ติ`
                  : `🎨 การจับคู่แบบ Contrast ข้ามฤดูกาล ให้ลุคโมเดิร์นร่วมสมัย`}
              </p>
            </div>

            {/* Pricing & 1-Click Bundle Button */}
            <div className="space-y-3 pt-2">
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xs text-[#6B5E55] uppercase font-bold">Total Bundle (3 Items):</span>
                <div className="text-right">
                  <span className="text-xs line-through text-[#6B5E55] mr-2">${bundleSubtotal.toFixed(2)}</span>
                  <span className="text-xl font-black text-[#2D231E]">${finalBundleTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleAddBundleToCart}
                className={`w-full py-4 rounded-2xl font-mono font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                  justAddedBundle 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-[#2D5A27] hover:bg-[#1E3D1A] text-white shadow-[#2D5A27]/25'
                }`}
              >
                {justAddedBundle ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Added Outfit to Bag! ✓</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>Add Complete Outfit to Bag • ${finalBundleTotal.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Slot Item Pickers (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#D9D3C7] p-6 sm:p-8 shadow-xl space-y-6">
            
            {/* Slot Tab Switches */}
            <div className="flex items-center gap-2 border-b border-[#D9D3C7] pb-4">
              <button
                onClick={() => setActiveSlotTab('tops')}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeSlotTab === 'tops' 
                    ? 'bg-[#2D231E] text-white shadow-sm' 
                    : 'bg-[#FAF8F5] text-[#6B5E55] hover:text-[#2D231E]'
                }`}
              >
                1. Tops & Sweaters ({tops.length})
              </button>
              <button
                onClick={() => setActiveSlotTab('bottoms')}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeSlotTab === 'bottoms' 
                    ? 'bg-[#2D231E] text-white shadow-sm' 
                    : 'bg-[#FAF8F5] text-[#6B5E55] hover:text-[#2D231E]'
                }`}
              >
                2. Bottoms ({bottoms.length})
              </button>
              <button
                onClick={() => setActiveSlotTab('accessories')}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeSlotTab === 'accessories' 
                    ? 'bg-[#2D231E] text-white shadow-sm' 
                    : 'bg-[#FAF8F5] text-[#6B5E55] hover:text-[#2D231E]'
                }`}
              >
                3. Accessories ({accessories.length})
              </button>
            </div>

            {/* Grid of Items for the Active Slot (Isolated Scrollable Container) */}
            <div 
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-160 overflow-y-auto overscroll-contain pr-2"
            >
              {(activeSlotTab === 'tops' ? tops : activeSlotTab === 'bottoms' ? bottoms : accessories).map((item) => {
                const isSelected = (
                  (activeSlotTab === 'tops' && selectedTop?.id === item.id) ||
                  (activeSlotTab === 'bottoms' && selectedBottom?.id === item.id) ||
                  (activeSlotTab === 'accessories' && selectedAccessory?.id === item.id)
                );

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (activeSlotTab === 'tops') setSelectedTop(item);
                      if (activeSlotTab === 'bottoms') setSelectedBottom(item);
                      if (activeSlotTab === 'accessories') setSelectedAccessory(item);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected 
                        ? 'border-[#2D5A27] bg-[#FAF8F5] ring-2 ring-[#2D5A27]/20 shadow-md' 
                        : 'border-[#D9D3C7] bg-white hover:border-[#6B5E55]'
                    }`}
                  >
                    <div className="relative aspect-4/5 w-full bg-[#FAF8F5] rounded-xl overflow-hidden mb-2.5 p-2 flex items-center justify-center">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        onError={handleImageError}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200" 
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#2D5A27] text-white flex items-center justify-center shadow-md">
                          <Check size={14} />
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 text-[9px] font-mono px-2 py-0.5 bg-white/90 rounded backdrop-blur-xs font-bold text-[#2D231E]">
                        {item.season}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-[#2D231E] line-clamp-1 group-hover:text-[#2D5A27]">
                        {item.name}
                      </h5>
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold text-[#2D231E]">${Number(item.price).toFixed(2)}</span>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.colorHex }} />
                          <span className="text-[10px] text-[#6B5E55] truncate max-w-16">{item.color}</span>
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
