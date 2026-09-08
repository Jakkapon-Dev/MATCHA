import React from 'react';
import { X, RotateCcw, Check, Sparkles, Filter } from 'lucide-react';

export default function CatalogFilterDrawer({
  isOpen,
  onClose,
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fade-in">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] text-[#2D231E] border-l border-[#D9D3C7] shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-[#D9D3C7] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-[#2D5A27]" />
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#2D231E]">
                Filters & Refinements
              </h2>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#BC5A36] text-white text-[10px] font-mono font-bold">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-[#2D231E] hover:text-white border border-[#D9D3C7] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-8">
            
            {/* 1. Seasons */}
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B5E55] mb-3">
                Seasonal Drops
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {seasonOptions.map((season) => (
                  <button
                    key={season.value}
                    onClick={() => onSelectSeason(season.value)}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      selectedSeason === season.value
                        ? 'bg-[#2D5A27] text-white border-[#2D5A27] shadow-xs'
                        : 'bg-white text-[#2D231E] border-[#D9D3C7] hover:border-[#2D5A27]'
                    }`}
                  >
                    <span>{season.icon}</span>
                    <span>{season.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Color Palette */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B5E55]">
                  Color Shade
                </h3>
                {selectedColor !== 'ALL' && (
                  <span className="text-[11px] font-mono text-[#2D5A27] font-bold">
                    {selectedColor}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                {colorOptions.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onSelectColor(c.value)}
                    title={c.label}
                    className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedColor === c.value
                        ? 'border-[#2D5A27] bg-[#D0DEC6]/40 shadow-xs'
                        : 'border-[#D9D3C7] bg-white hover:border-[#2D5A27]'
                    }`}
                  >
                    <span 
                      className="w-5 h-5 rounded-full border border-black/15 shadow-2xs flex items-center justify-center text-white text-[9px]"
                      style={{ background: c.hex }}
                    >
                      {selectedColor === c.value && <Check size={11} className="drop-shadow-xs" />}
                    </span>
                    <span className="text-[9px] font-mono truncate max-w-13.5 text-[#6B5E55]">
                      {c.label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Silhouette Fit */}
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B5E55] mb-3">
                Silhouette & Fit
              </h3>
              <div className="flex flex-wrap gap-2">
                {fitOptions.map((fit) => (
                  <button
                    key={fit}
                    onClick={() => onSelectFit(fit)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedFit === fit
                        ? 'bg-[#2D231E] text-white border-[#2D231E]'
                        : 'bg-white text-[#2D231E] border-[#D9D3C7] hover:border-[#2D5A27]'
                    }`}
                  >
                    {fit === 'ALL' ? 'All Fits' : fit}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Price Range */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B5E55]">
                  Max Price
                </h3>
                <span className="text-sm font-bold font-mono text-[#2D5A27]">
                  ${priceRange}
                </span>
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
              <div className="flex justify-between text-[10px] font-mono text-[#6B5E55] mt-1">
                <span>$30</span>
                <span>$100</span>
                <span>$200</span>
              </div>
            </div>

            {/* 5. In Stock Only */}
            <div className="pt-2 border-t border-[#D9D3C7] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#2D231E] uppercase font-mono">In Stock Only</h4>
                <p className="text-[11px] text-[#6B5E55] font-mono">Hide pre-orders and sold-out archive items</p>
              </div>
              <button
                type="button"
                onClick={onToggleInStock}
                className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                  inStockOnly ? 'bg-[#2D5A27] justify-end' : 'bg-[#D9D3C7] justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-[#D9D3C7] bg-white flex items-center gap-3">
            <button
              onClick={onResetFilters}
              className="px-4 py-3.5 border border-[#D9D3C7] hover:bg-[#FAF8F5] text-[#2D231E] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-mono flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer font-mono text-center"
            >
              View Results ({totalResults})
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
