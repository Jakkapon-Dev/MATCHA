import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, ArrowLeft, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/ui/ProductCardSkeleton';
import EmptyState from '../components/ui/EmptyState';
import CatalogFilterDrawer from '../components/catalog/CatalogFilterDrawer';
import CatalogToolbar from '../components/catalog/CatalogToolbar';
import CatalogPagination from '../components/catalog/CatalogPagination';

export default function CatalogPage({ 
  initialCategory = 'ALL',
  onBackToHome, 
  onAddToCart, 
  onQuickView, 
  onSelectFit 
}) {
  // State for products and categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const [selectedColor, setSelectedColor] = useState('ALL');
  const [selectedFit, setSelectedFit] = useState('ALL');
  const [priceRange, setPriceRange] = useState(200);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  // UI States
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [gridCols, setGridCols] = useState(3); // 2, 3, 4, or 'list'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Options
  const seasonOptions = [
    { label: 'All Seasons', value: 'ALL', icon: '✦' },
    { label: 'Spring Drop', value: 'Spring', icon: '🌸' },
    { label: 'Summer Drop', value: 'Summer', icon: '☀️' },
    { label: 'Autumn Drop', value: 'Autumn', icon: '🍂' },
    { label: 'Winter Drop', value: 'Winter', icon: '❄️' },
    { label: 'Artisan Core', value: 'Artisan', icon: '🍵' },
  ];

  const colorOptions = [
    { label: 'All Colors', value: 'ALL', hex: 'linear-gradient(135deg, #2D5A27, #BC5A36, #1B3B6F)' },
    { label: 'Olive Green', value: 'Olive', hex: '#556B2F' },
    { label: 'Mustard Gold', value: 'Mustard', hex: '#D4A338' },
    { label: 'Burnt Orange', value: 'Orange', hex: '#C05C2B' },
    { label: 'Warm Brown', value: 'Brown', hex: '#5C4033' },
    { label: 'Cobalt Blue', value: 'Cobalt', hex: '#1A365D' },
    { label: 'Sky Blue', value: 'Sky', hex: '#64B5F6' },
    { label: 'Matcha Teal', value: 'Teal', hex: '#00796B' },
    { label: 'Charcoal Black', value: 'Charcoal', hex: '#2C3539' },
    { label: 'Crimson Red', value: 'Crimson', hex: '#800020' },
    { label: 'Fuchsia Pink', value: 'Fuchsia', hex: '#C2185B' },
    { label: 'Lavender', value: 'Lavender', hex: '#9575CD' },
    { label: 'Natural Ecru', value: 'Ecru', hex: '#EAE6DF' }
  ];

  const fitOptions = ['ALL', 'Oversized', 'Relaxed', 'Tailored', 'Wide Leg', 'Vintage Boxy'];

  // Load Categories on mount
  useEffect(() => {
    async function fetchCats() {
      try {
        const catData = await api.getCategories();
        setCategories(catData);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }
    fetchCats();
  }, []);

  // Fetch Products based on filters
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const response = await api.getProducts({
          category: selectedCategory,
          season: selectedSeason,
          search: searchQuery,
          sort: sortBy,
          color: selectedColor,
          fit: selectedFit,
          inStockOnly,
          maxPrice: priceRange,
          page: 1,
          limit: 100,
        });

        if (response && response.data) {
          setProducts(response.data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Unable to reach server. Displaying cached archive collection.');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [selectedCategory, selectedSeason, searchQuery, sortBy, selectedColor, selectedFit, inStockOnly, priceRange]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSeason, searchQuery, sortBy, selectedColor, selectedFit, inStockOnly, priceRange]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedSeason !== 'ALL') count++;
    if (selectedColor !== 'ALL') count++;
    if (selectedFit !== 'ALL') count++;
    if (inStockOnly) count++;
    if (priceRange < 200) count++;
    return count;
  }, [selectedSeason, selectedColor, selectedFit, inStockOnly, priceRange]);

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedSeason('ALL');
    setSelectedColor('ALL');
    setSelectedFit('ALL');
    setPriceRange(200);
    setInStockOnly(false);
    setSearchQuery('');
    setSortBy('featured');
    setCurrentPage(1);
  };

  // Client-side pagination slice
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage, itemsPerPage]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Grid class mapping
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    list: 'grid-cols-1 max-w-4xl mx-auto',
  }[gridCols] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#D9D3C7]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2D5A27] uppercase tracking-widest mb-1.5">
              <span>MatchA Catalog Archive</span>
              <span>✦</span>
              <span>2026 Collection</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase text-[#2D231E] tracking-tight">
              Artisan Apparel
            </h1>
          </div>

          <div className="text-xs font-mono text-[#6B5E55]">
            Total <strong className="text-[#2D231E]">{totalItems}</strong> pieces available
          </div>
        </div>

        {/* Toolbar Controls (Search, Categories, Sort, Layout) */}
        <CatalogToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenFilterDrawer={() => setFilterDrawerOpen(true)}
          activeFilterCount={activeFilterCount}
          sortBy={sortBy}
          onSortChange={setSortBy}
          gridCols={gridCols}
          onGridChange={setGridCols}
          totalResults={totalItems}
        />

        {/* Active Filters Pill Bar (When filters applied) */}
        {activeFilterCount > 0 && (
          <div className="mb-6 p-3 rounded-2xl bg-[#D0DEC6]/30 border border-[#B8CBAE]/60 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#2D5A27]">Active Filters ({activeFilterCount}):</span>
              {selectedSeason !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-lg bg-white border border-[#D9D3C7] text-[#2D231E]">
                  Season: {selectedSeason}
                </span>
              )}
              {selectedColor !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-lg bg-white border border-[#D9D3C7] text-[#2D231E]">
                  Color: {selectedColor}
                </span>
              )}
              {selectedFit !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-lg bg-white border border-[#D9D3C7] text-[#2D231E]">
                  Fit: {selectedFit}
                </span>
              )}
              {priceRange < 200 && (
                <span className="px-2 py-0.5 rounded-lg bg-white border border-[#D9D3C7] text-[#2D231E]">
                  Max: ${priceRange}
                </span>
              )}
              {inStockOnly && (
                <span className="px-2 py-0.5 rounded-lg bg-white border border-[#D9D3C7] text-[#2D231E]">
                  In Stock Only
                </span>
              )}
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[#BC5A36] font-bold hover:underline cursor-pointer flex items-center gap-1 shrink-0"
            >
              <RotateCcw size={12} />
              <span>Clear All</span>
            </button>
          </div>
        )}

        {/* Product Grid Area (4-State Contract: Loading, Empty, Error, Data) */}
        {loading ? (
          <div className={`grid ${gridClasses} gap-6`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <EmptyState
            title="No garments matched your filters"
            description="We couldn't find any MatchA pieces matching this combination. Try clearing your search query or loosening the color/season filters."
            actionLabel="Reset All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <div className={`grid ${gridClasses} gap-6`}>
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        )}

        {/* Pagination Navigation */}
        {!loading && paginatedProducts.length > 0 && (
          <CatalogPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 200, behavior: 'smooth' });
            }}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        )}

        {/* Slide-out Facet Filter Drawer */}
        <CatalogFilterDrawer
          isOpen={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          seasonOptions={seasonOptions}
          selectedSeason={selectedSeason}
          onSelectSeason={setSelectedSeason}
          colorOptions={colorOptions}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          fitOptions={fitOptions}
          selectedFit={selectedFit}
          onSelectFit={setSelectedFit}
          priceRange={priceRange}
          onChangePrice={setPriceRange}
          inStockOnly={inStockOnly}
          onToggleInStock={() => setInStockOnly(!inStockOnly)}
          onResetFilters={handleResetFilters}
          activeFilterCount={activeFilterCount}
          totalResults={totalItems}
        />

      </div>
    </div>
  );
}
