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
  // This is a controlled toolbar: CatalogPage owns searching, category selection,
  // sorting, and layout state so all controls operate on the same result set.
  return (
    <div className="space-y-4 mb-8">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 inset-y-0 my-auto text-[#666666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items, silhouettes, fabrics..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-matcha-border bg-white focus:border-matcha-primary focus:ring-2 focus:ring-matcha-primary/20 outline-none text-xs text-matcha-text font-mono shadow-2xs transition-all"
          />
        </div>

        {/* Right Controls: Sort Dropdown & Grid View Switcher */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-[#DCDCDC] bg-white font-mono text-xs font-bold text-[#000000] outline-none hover:border-[#042509] cursor-pointer shadow-2xs pr-8"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest Drops</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {/* Grid Layout Switcher (Desktop) */}
          {/* gridCols is numeric for card grids and the string "list" for list view. */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-white border border-[#DCDCDC] shadow-2xs">
            <button
              onClick={() => onGridChange(2)}
              title="2 Columns"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                gridCols === 2 ? 'bg-[#042509] text-white' : 'text-[#666666] hover:text-[#000000]'
              }`}
            >
              <Grid2x2 size={15} />
            </button>
            <button
              onClick={() => onGridChange(3)}
              title="3 Columns"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                gridCols === 3 ? 'bg-[#042509] text-white' : 'text-[#666666] hover:text-[#000000]'
              }`}
            >
              <Grid3x3 size={15} />
            </button>
            <button
              onClick={() => onGridChange(4)}
              title="4 Columns"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                gridCols === 4 ? 'bg-[#042509] text-white' : 'text-[#666666] hover:text-[#000000]'
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => onGridChange('list')}
              title="List View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                gridCols === 'list' ? 'bg-[#042509] text-white' : 'text-[#666666] hover:text-[#000000]'
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
                ? 'bg-[#000000] text-white border-[#000000] shadow-sm'
                : 'bg-white text-[#666666] border-[#DCDCDC] hover:border-[#042509] hover:text-[#042509]'
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
