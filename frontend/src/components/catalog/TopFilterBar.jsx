import React, { useState, useRef, useEffect } from 'react';
import { 
  Check, 
  ChevronDown, 
  RotateCcw
} from 'lucide-react';

export default function TopFilterBar({
  seasonOptions,
  selectedSeason,
  onSelectSeason,
  colorOptions,
  selectedColor,
  onSelectColor,
  fitOptions,
  selectedFit,
  onSelectFit,
  priceRange,
  onChangePrice,
  inStockOnly,
  onToggleInStock,
  onResetFilters,
  activeFilterCount,
  totalResults
}) {
  // Dropdown Open States (Only one open at a time)
  const [openDropdown, setOpenDropdown] = useState(null); // 'season' | 'color' | 'fit' | 'price' | null
  const barRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (barRef.current && !barRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name) => {
    setOpenDropdown(prev => prev === name ? null : name);
  };

  const selectedSeasonObj = seasonOptions.find(s => s.value === selectedSeason) || seasonOptions[0];
  const selectedColorObj = colorOptions.find(c => c.value === selectedColor) || colorOptions[0];

  return (
    <div ref={barRef} className="w-full relative z-30 mb-6">

      {/* Backdrop overlay when any dropdown is open for crisp click-away */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-20 cursor-default" 
          onClick={() => setOpenDropdown(null)} 
        />
      )}
      
      {/* 1. Horizontal Flex-wrap Pill Filter Bar (No overflow clipping) */}
      <div className="flex items-center gap-2.5 flex-wrap py-1 relative z-20">
        
        {/* Season Dropdown Pill */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('season')}
            className={`px-4 py-2 rounded-full border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              selectedSeason !== 'ALL'
                ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                : openDropdown === 'season'
                ? 'bg-white text-[#2D5A27] border-[#2D5A27] ring-2 ring-[#2D5A27]/20 shadow-md'
                : 'bg-white text-[#2D231E] border-[#D9D3C7] hover:border-[#2D5A27]'
            }`}
          >
            <span>{selectedSeasonObj.icon}</span>
            <span>{selectedSeason === 'ALL' ? 'Season' : selectedSeasonObj.label}</span>
            <ChevronDown size={13} className={`transition-transform duration-200 ${openDropdown === 'season' ? 'rotate-180' : ''}`} />
          </button>

          {/* Season Popover */}
          {openDropdown === 'season' && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl border border-[#D9D3C7] shadow-2xl p-2 z-30 font-mono text-xs animate-fade-in">
              <div className="text-[10px] font-bold uppercase text-[#6B5E55] px-3 py-1.5 tracking-wider border-b border-[#D9D3C7]/40 mb-1">
                Seasonal Drop
              </div>
              <div className="space-y-1">
                {seasonOptions.map(option => {
                  const isSelected = selectedSeason === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSelectSeason(option.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#2D5A27] text-white font-bold'
                          : 'hover:bg-[#FAF8F5] text-[#2D231E]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Color Shade Dropdown Pill */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('color')}
            className={`px-4 py-2 rounded-full border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              selectedColor !== 'ALL'
                ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                : openDropdown === 'color'
                ? 'bg-white text-[#2D5A27] border-[#2D5A27] ring-2 ring-[#2D5A27]/20 shadow-md'
                : 'bg-white text-[#2D231E] border-[#D9D3C7] hover:border-[#2D5A27]'
            }`}
          >
            <div 
              className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0" 
              style={{ background: selectedColorObj.hex }}
            />
            <span>{selectedColor === 'ALL' ? 'Color' : selectedColorObj.label}</span>
            <ChevronDown size={13} className={`transition-transform duration-200 ${openDropdown === 'color' ? 'rotate-180' : ''}`} />
          </button>

          {/* Color Popover */}
          {openDropdown === 'color' && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-[#D9D3C7] shadow-2xl p-3 z-30 font-mono text-xs animate-fade-in">
              <div className="flex items-center justify-between px-1 py-1 border-b border-[#D9D3C7]/40 mb-2">
                <span className="text-[10px] font-bold uppercase text-[#6B5E55] tracking-wider">Color Swatches</span>
                {selectedColor !== 'ALL' && (
                  <button 
                    onClick={() => {
                      onSelectColor('ALL');
                      setOpenDropdown(null);
                    }}
                    className="text-[10px] text-[#BC5A36] hover:underline font-bold cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {colorOptions.map(color => {
                  const isSelected = selectedColor === color.value;
                  return (
                    <button
                      key={color.value}
                      onClick={() => {
                        onSelectColor(color.value);
                        setOpenDropdown(null);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left text-[11px] transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#2D5A27] bg-[#D0DEC6]/30 text-[#2D5A27] font-bold'
                          : 'border-transparent hover:bg-[#FAF8F5] text-[#2D231E]'
                      }`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full border border-black/15 shadow-2xs shrink-0" 
                        style={{ background: color.hex }}
                      />
                      <span className="truncate">{color.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Silhouette & Fit Dropdown Pill */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('fit')}
            className={`px-4 py-2 rounded-full border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              selectedFit !== 'ALL'
                ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                : openDropdown === 'fit'
                ? 'bg-white text-[#2D5A27] border-[#2D5A27] ring-2 ring-[#2D5A27]/20 shadow-md'
                : 'bg-white text-[#2D231E] border-[#D9D3C7] hover:border-[#2D5A27]'
            }`}
          >
            <span>{selectedFit === 'ALL' ? 'Silhouette & Fit' : `Fit: ${selectedFit}`}</span>
            <ChevronDown size={13} className={`transition-transform duration-200 ${openDropdown === 'fit' ? 'rotate-180' : ''}`} />
          </button>

          {/* Fit Popover */}
          {openDropdown === 'fit' && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl border border-[#D9D3C7] shadow-2xl p-2 z-30 font-mono text-xs animate-fade-in">
              <div className="text-[10px] font-bold uppercase text-[#6B5E55] px-3 py-1.5 tracking-wider border-b border-[#D9D3C7]/40 mb-1">
                Garment Silhouette
              </div>
              <div className="space-y-1">
                {fitOptions.map(fit => {
                  const isSelected = selectedFit === fit;
                  return (
                    <button
                      key={fit}
                      onClick={() => {
                        onSelectFit(fit);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#2D5A27] text-white font-bold'
                          : 'hover:bg-[#FAF8F5] text-[#2D231E]'
                      }`}
                    >
                      <span>{fit === 'ALL' ? 'All Silhouettes' : fit}</span>
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Price Range Dropdown Pill */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('price')}
            className={`px-4 py-2 rounded-full border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              priceRange < 200
                ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                : openDropdown === 'price'
                ? 'bg-white text-[#2D5A27] border-[#2D5A27] ring-2 ring-[#2D5A27]/20 shadow-md'
                : 'bg-white text-[#2D231E] border-[#D9D3C7] hover:border-[#2D5A27]'
            }`}
          >
            <span>{priceRange < 200 ? `Max: $${priceRange}` : 'Price Range'}</span>
            <ChevronDown size={13} className={`transition-transform duration-200 ${openDropdown === 'price' ? 'rotate-180' : ''}`} />
          </button>

          {/* Price Popover */}
          {openDropdown === 'price' && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl border border-[#D9D3C7] shadow-2xl p-4 z-30 font-mono text-xs animate-fade-in">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#D9D3C7]/40">
                <span className="text-[10px] font-bold uppercase text-[#6B5E55] tracking-wider">Maximum Price</span>
                <span className="text-sm font-black text-[#2D5A27]">${priceRange}</span>
              </div>
              <input
                type="range"
                min="30"
                max="200"
                step="5"
                value={priceRange}
                onChange={(e) => onChangePrice(Number(e.target.value))}
                className="w-full accent-[#2D5A27] cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-[#6B5E55] mt-2 font-mono">
                <span>$30</span>
                <span>$100</span>
                <span>$200</span>
              </div>
              <div className="mt-4 pt-2 border-t border-[#D9D3C7]/40 flex justify-end">
                <button
                  onClick={() => setOpenDropdown(null)}
                  className="px-3 py-1.5 rounded-lg bg-[#2D5A27] text-white font-bold text-[11px] cursor-pointer hover:bg-[#23471E]"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* In-Stock Only Quick Toggle Pill */}
        <button
          onClick={onToggleInStock}
          className={`px-4 py-2 rounded-full border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
            inStockOnly
              ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
              : 'bg-white text-[#2D231E] border-[#D9D3C7] hover:border-[#2D5A27]'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-[#85E369]' : 'bg-[#BC5A36]'}`} />
          <span>In Stock Only</span>
        </button>

        {/* Reset Filters (Only when any filter is active) */}
        {activeFilterCount > 0 && (
          <button
            onClick={onResetFilters}
            className="px-3 py-2 rounded-full text-xs font-mono font-bold text-[#BC5A36] hover:bg-[#BC5A36]/10 flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
          >
            <RotateCcw size={12} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

    </div>
  );
}
