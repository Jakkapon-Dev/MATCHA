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
  // Filter values are controlled by CatalogPage. Each interaction reports a change
  // immediately, so the result count can update while the drawer remains open.
  // Removing a closed drawer from the DOM prevents its backdrop from blocking the page.
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fade-in">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F1F1F1] text-[#000000] border-l border-[#DCDCDC] shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-[#DCDCDC] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-[#042509]" />
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#000000]">
                Filters & Refinements
              </h2>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#C91D1D] text-white text-[10px] font-mono font-bold">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F1F1F1] hover:bg-[#000000] hover:text-white border border-[#DCDCDC] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-8">
            
            {/* 1. Seasons */}
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666] mb-3">
                Seasonal Drops
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {seasonOptions.map((season) => (
                  <button
                    key={season.value}
                    onClick={() => onSelectSeason(season.value)}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      selectedSeason === season.value
                        ? 'bg-[#042509] text-white border-[#042509] shadow-xs'
                        : 'bg-white text-[#000000] border-[#DCDCDC] hover:border-[#042509]'
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
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666]">
                  Color Shade
                </h3>
                {selectedColor !== 'ALL' && (
                  <span className="text-[11px] font-mono text-[#042509] font-bold">
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
                        ? 'border-[#042509] bg-[#518F5C]/40 shadow-xs'
                        : 'border-[#DCDCDC] bg-white hover:border-[#042509]'
                    }`}
                  >
                    <span 
                      className="w-5 h-5 rounded-full border border-black/15 shadow-2xs flex items-center justify-center text-white text-[9px]"
                      style={{ background: c.hex }}
                    >
                      {selectedColor === c.value && <Check size={11} className="drop-shadow-xs" />}
                    </span>
                    <span className="text-[9px] font-mono truncate max-w-13.5 text-[#666666]">
                      {c.label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Silhouette Fit */}
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666] mb-3">
                Silhouette & Fit
              </h3>
              <div className="flex flex-wrap gap-2">
                {fitOptions.map((fit) => (
                  <button
                    key={fit}
                    onClick={() => onSelectFit(fit)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedFit === fit
                        ? 'bg-[#000000] text-white border-[#000000]'
                        : 'bg-white text-[#000000] border-[#DCDCDC] hover:border-[#042509]'
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
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666]">
                  Max Price
                </h3>
                <span className="text-sm font-bold font-mono text-[#042509]">
                  ${priceRange}
                </span>
              </div>
              {/* Range inputs emit strings; normalize to a number for price comparisons. */}
              <input
                type="range"
                min="30"
                max="200"
                step="5"
                value={priceRange}
                onChange={(e) => onChangePrice(Number(e.target.value))}
                className="w-full accent-[#042509] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#666666] mt-1">
                <span>$30</span>
                <span>$100</span>
                <span>$200</span>
              </div>
            </div>

            {/* 5. In Stock Only */}
            <div className="pt-2 border-t border-[#DCDCDC] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#000000] uppercase font-mono">In Stock Only</h4>
                <p className="text-[11px] text-[#666666] font-mono">Hide pre-orders and sold-out archive items</p>
              </div>
              <button
                type="button"
                onClick={onToggleInStock}
                className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                  inStockOnly ? 'bg-[#042509] justify-end' : 'bg-[#DCDCDC] justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>

          </div>

          {/* Footer Actions */}
          {/* Reset changes parent filter state; View Results only closes the drawer. */}
          <div className="p-6 border-t border-[#DCDCDC] bg-white flex items-center gap-3">
            <button
              onClick={onResetFilters}
              className="px-4 py-3.5 border border-[#DCDCDC] hover:bg-[#F1F1F1] text-[#000000] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-mono flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-[#042509] hover:bg-[#021505] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer font-mono text-center"
            >
              View Results ({totalResults})
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
