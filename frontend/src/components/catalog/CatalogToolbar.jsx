import React from 'react';
import { Search, SlidersHorizontal, Grid2x2, Grid3x3, LayoutGrid, List } from 'lucide-react';

export default function CatalogToolbar({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenFilterDrawer,
  activeFilterCount,
  sortBy,
  onSortChange,
  gridCols,
  onGridChange,
  totalResults
}) {
  return (
    <div className="space-y-4 mb-8">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items, silhouettes, fabrics..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-matcha-border bg-white focus:border-matcha-primary focus:ring-2 focus:ring-matcha-primary/20 outline-none text-xs text-matcha-text font-mono shadow-2xs transition-all"
          />
        </div>

        {/* Right Controls: Filter Drawer Toggle, Sort Dropdown & Grid View Switcher */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          
          {/* Filter Drawer Trigger */}
          <button
            onClick={onOpenFilterDrawer}
            className={`px-3.5 py-2.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
              activeFilterCount > 0
                ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                : 'bg-white text-[#2D231E] border-[#D9D3C7] hover:border-[#2D5A27]'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#BC5A36] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-[#D9D3C7] bg-white font-mono text-xs font-bold text-[#2D231E] outline-none hover:border-[#2D5A27] cursor-pointer shadow-2xs pr-8"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest Drops</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {/* Grid Layout Switcher (Desktop) */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-white border border-[#D9D3C7] shadow-2xs">
            <button
              onClick={() => onGridChange(2)}
              title="2 Columns"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                gridCols === 2 ? 'bg-[#2D5A27] text-white' : 'text-[#6B5E55] hover:text-[#2D231E]'
              }`}
            >
              <Grid2x2 size={15} />
            </button>
            <button
              onClick={() => onGridChange(3)}
              title="3 Columns"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                gridCols === 3 ? 'bg-[#2D5A27] text-white' : 'text-[#6B5E55] hover:text-[#2D231E]'
              }`}
            >
              <Grid3x3 size={15} />
            </button>
            <button
              onClick={() => onGridChange(4)}
              title="4 Columns"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                gridCols === 4 ? 'bg-[#2D5A27] text-white' : 'text-[#6B5E55] hover:text-[#2D231E]'
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => onGridChange('list')}
              title="List View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                gridCols === 'list' ? 'bg-[#2D5A27] text-white' : 'text-[#6B5E55] hover:text-[#2D231E]'
              }`}
            >
              <List size={15} />
            </button>
          </div>

        </div>

      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
              selectedCategory === cat.id
                ? 'bg-[#2D231E] text-white border-[#2D231E] shadow-sm'
                : 'bg-white text-[#6B5E55] border-[#D9D3C7] hover:border-[#2D5A27] hover:text-[#2D5A27]'
            }`}
          >
            <span>{cat.name}</span>
            {cat.count > 0 && (
              <span className={`ml-1.5 text-[10px] opacity-70`}>({cat.count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
