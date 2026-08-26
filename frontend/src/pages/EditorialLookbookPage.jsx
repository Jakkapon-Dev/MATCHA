import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Camera, 
  Layers, 
  Eye, 
  X, 
  ArrowRight, 
  Compass, 
  SlidersHorizontal, 
  Palette, 
  Share2, 
  Heart,
  Grid3X3,
  Maximize2
} from 'lucide-react';
import { lifestyleEditorialData } from '../data/lifestyleEditorialData';
import { handleImageError } from '../utils/imageFallback';

const THEMES = [
  { id: 'ALL', label: 'All Locations' },
  { id: 'URBAN STREET', label: 'Urban Street' },
  { id: 'SUMMER RESORT', label: 'Summer Resort' },
  { id: 'INTERIOR ARCHITECTURE', label: 'Architectural' },
  { id: 'CYBER TECHWEAR', label: 'Cyber Techwear' },
  { id: 'STREET CASUAL', label: 'Street Casual' }
];

const SEASONS = [
  { id: 'ALL', label: 'All Seasons' },
  { id: 'Spring', label: 'Spring 🌸' },
  { id: 'Summer', label: 'Summer 🌊' },
  { id: 'Autumn', label: 'Autumn 🍵' },
  { id: 'Winter', label: 'Winter ❄️' }
];

export default function EditorialLookbookPage() {
  const navigate = useNavigate();
  
  const [selectedTheme, setSelectedTheme] = useState('ALL');
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const [selectedLook, setSelectedLook] = useState(null);
  const [likedLooks, setLikedLooks] = useState({});

  // Filtered dataset
  const filteredLooks = useMemo(() => {
    return lifestyleEditorialData.filter((item) => {
      const matchTheme = selectedTheme === 'ALL' || item.theme.toUpperCase() === selectedTheme.toUpperCase();
      const matchSeason = selectedSeason === 'ALL' || item.season.toLowerCase() === selectedSeason.toLowerCase();
      return matchTheme && matchSeason;
    });
  }, [selectedTheme, selectedSeason]);

  const toggleLike = (e, id) => {
    e.stopPropagation();
    setLikedLooks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14">

        {/* 1. EDITORIAL HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#D9D3C7]">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E2ECE9] border border-[#2D5A27]/20 text-[#2D5A27] text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Camera size={14} />
              <span>Location Lifestyle Archives ({lifestyleEditorialData.length} Shots)</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase text-[#2D231E] tracking-tight font-serif">
              MatchA Editorial Lookbook
            </h1>
            <p className="text-[#6B5E55] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              ภาพถ่ายแฟชั่นชุดจริงในสถานที่จริง ถ่ายทอดความงามของเนื้อผ้า อารมณ์ของแสง และการผสมผสานสีเสื้อผ้าตามทฤษฎี Personal Color
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/mix-match')}
              className="px-4 py-2.5 rounded-xl bg-[#2D5A27] hover:bg-[#1E3D1A] text-white font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Sparkles size={14} />
              <span>เปิด Mix & Match Studio</span>
            </button>
          </div>
        </div>

        {/* 2. FILTER CONTROLS BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-[#D9D3C7] shadow-xs">
          
          {/* Location Scene Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 font-mono text-xs">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`px-3.5 py-2 rounded-xl font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  selectedTheme === theme.id
                    ? 'bg-[#2D231E] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#6B5E55] hover:text-[#2D231E]'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>

          {/* Season Filter Pills */}
          <div className="flex items-center gap-1.5 font-mono text-xs border-t md:border-t-0 pt-2 md:pt-0 border-[#D9D3C7]/60">
            <span className="text-[10px] uppercase font-bold text-[#6B5E55] mr-1 hidden sm:inline">Season:</span>
            {SEASONS.map((season) => (
              <button
                key={season.id}
                onClick={() => setSelectedSeason(season.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSeason === season.id
                    ? 'bg-[#2D5A27] text-white shadow-xs'
                    : 'bg-white border border-[#D9D3C7] text-[#6B5E55] hover:border-[#2D5A27]'
                }`}
              >
                {season.label}
              </button>
            ))}
          </div>

        </div>

        {/* 3. EDITORIAL MASONRY GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#6B5E55]">
            <span>กำลังแสดง {filteredLooks.length} ภาพถ่ายแฟชั่น</span>
            <span>MatchA Seasonal Archives</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredLooks.map((item, index) => {
              const isLiked = likedLooks[item.id];

              return (
                <div
                  key={`${item.id}-${index}`}
                  onClick={() => setSelectedLook(item)}
                  className="group relative bg-white rounded-3xl overflow-hidden border border-[#D9D3C7] hover:border-[#2D5A27] shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer select-none"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-4/5 w-full bg-[#FAF8F5] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      onError={handleImageError}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
                      <span className="px-2.5 py-1 rounded-lg bg-[#2D231E]/85 backdrop-blur-xs text-[#D0DEC6] text-[9px] font-mono font-bold uppercase tracking-wider shadow-md">
                        {item.season} Drop
                      </span>
                      <button
                        onClick={(e) => toggleLike(e, item.id)}
                        className={`pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                          isLiked 
                            ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-300' 
                            : 'bg-white/90 text-[#6B5E55] hover:text-rose-600 hover:scale-110'
                        }`}
                      >
                        <Heart size={14} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                      </button>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                      <span className="px-4 py-2 bg-white text-[#2D231E] font-mono text-xs font-bold uppercase rounded-full shadow-xl flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Maximize2 size={13} />
                        <span>Inspect Look</span>
                      </span>
                    </div>

                    {/* Bottom Floating Location Pill */}
                    <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
                      <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono">
                        {item.tag}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-4 space-y-1 bg-white">
                    <span className="text-[10px] font-mono font-bold text-[#2D5A27] uppercase tracking-wider block">
                      {item.theme}
                    </span>
                    <h3 className="font-serif text-sm font-bold text-[#2D231E] truncate group-hover:text-[#2D5A27] transition-colors">
                      {item.title}
                    </h3>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* 4. LIGHTBOX / FULLSCREEN INSPECT LOOK MODAL */}
        {selectedLook && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none"
            onClick={() => setSelectedLook(null)}
          >
            <div 
              data-lenis-prevent="true"
              className="bg-[#FAF8F5] text-[#2D231E] rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto overscroll-contain shadow-2xl border border-[#D9D3C7] relative flex flex-col md:flex-row overflow-hidden animate-modal-pop"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedLook(null)}
                className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-[#2D231E] hover:text-white border border-[#D9D3C7] flex items-center justify-center text-[#2D231E] transition-all cursor-pointer shadow-md"
              >
                <X size={18} />
              </button>

              {/* High-Res Photo Left Column */}
              <div className="md:w-3/5 bg-black flex items-center justify-center p-2 sm:p-4">
                <img 
                  src={selectedLook.image} 
                  alt={selectedLook.title}
                  onError={handleImageError}
                  className="max-h-[75vh] w-full object-contain rounded-2xl" 
                />
              </div>

              {/* Lookbook Specs Right Column */}
              <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-[#2D5A27] uppercase tracking-wider">
                      {selectedLook.theme} • {selectedLook.season}
                    </span>
                    <h2 className="text-2xl font-black font-serif text-[#2D231E]">
                      {selectedLook.title}
                    </h2>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E2ECE9] text-[#2D5A27] text-[10px] font-mono font-bold">
                      {selectedLook.tag}
                    </span>
                  </div>

                  <p className="text-xs text-[#6B5E55] leading-relaxed">
                    ลุคแฟชั่นระดับ Editorial ถ่ายทำในสถานที่จริง ออกแบบเพื่อสะท้อนความกลมกลืนของสีผิวตาม <strong>Personal Color ฤดูกาล {selectedLook.season}</strong>
                  </p>

                  <div className="p-4 rounded-2xl bg-white border border-[#D9D3C7] space-y-2">
                    <h4 className="font-mono text-xs font-bold text-[#2D231E] uppercase flex items-center gap-1.5">
                      <Palette size={13} className="text-[#2D5A27]" />
                      <span>Styling Recommendations</span>
                    </h4>
                    <p className="text-[11px] text-[#6B5E55] leading-relaxed">
                      จับคู่กับเสื้อผ้าในคอลเลกชัน {selectedLook.season} เพื่อเสริมมิติของลุคให้โดดเด่นและขับผิวที่สุด
                    </p>
                  </div>

                </div>

                {/* Bottom Actions */}
                <div className="space-y-3 pt-4 border-t border-[#D9D3C7]">
                  <button
                    onClick={() => {
                      setSelectedLook(null);
                      navigate('/mix-match');
                    }}
                    className="w-full py-3.5 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>ไปลองแต่งชุดนี้ใน Studio</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedLook(null);
                      navigate('/catalog');
                    }}
                    className="w-full py-3 bg-white hover:bg-[#FAF8F5] border border-[#D9D3C7] text-[#2D231E] font-mono text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    ดูสินค้าในหมวดหมู่นี้
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
