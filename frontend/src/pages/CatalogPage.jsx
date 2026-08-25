import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, SlidersHorizontal, ArrowUpDown, Grid2x2, Grid3x3, LayoutGrid, 
  List, X, Check, Star, ShoppingBag, Eye, Sparkles, Filter, ChevronLeft, 
  ChevronRight, RefreshCw, ArrowLeft, ArrowUpRight, RotateCcw
} from 'lucide-react';
import { api } from '../services/api';

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
  const [priceRange, setPriceRange] = useState(150);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  // UI States - Slide-Out Filter Drawer
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [gridCols, setGridCols] = useState(3); // 2, 3, 4, or 'list'
  const [hoveredCardId, setHoveredCardId] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Season Options
  const seasonOptions = [
    { label: 'All Seasons', value: 'ALL', icon: '✦' },
    { label: 'Spring Drop', value: 'Spring', icon: '🌸' },
    { label: 'Summer Drop', value: 'Summer', icon: '☀️' },
    { label: 'Autumn Drop', value: 'Autumn', icon: '🍂' },
    { label: 'Winter Drop', value: 'Winter', icon: '❄️' },
    { label: 'Artisan Core', value: 'Artisan', icon: '🍵' },
  ];

  // Predefined Color Palette Filters across all collections
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

  // Predefined Fit Types
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
    let isMounted = true;
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
          limit: 500 // Load full 247 catalog items for responsive client-side filtering & snappy pagination
        });

        if (isMounted && response && response.data) {
          setProducts(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError('Failed to load products. Please check connection.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProducts();
    return () => { isMounted = false; };
  }, [selectedCategory, selectedSeason, searchQuery, sortBy, selectedColor, selectedFit, inStockOnly, priceRange]);

  // Reset page when key filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSeason, searchQuery, selectedColor, selectedFit, inStockOnly, priceRange, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage, itemsPerPage]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'ALL') count++;
    if (selectedSeason !== 'ALL') count++;
    if (selectedColor !== 'ALL') count++;
    if (selectedFit !== 'ALL') count++;
    if (inStockOnly) count++;
    if (priceRange < 150) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCategory, selectedSeason, selectedColor, selectedFit, inStockOnly, priceRange, searchQuery]);

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedSeason('ALL');
    setSelectedColor('ALL');
    setSelectedFit('ALL');
    setPriceRange(150);
    setInStockOnly(false);
    setSearchQuery('');
    setSortBy('featured');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D231E] relative">
      
      {/* 1. Catalog Header & Breadcrumb */}
      <section className="bg-[#FAF8F5] border-b border-[#D9D3C7] pt-8 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Breadcrumb Navigation & Back to Home */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#6B5E55]">
              <button 
                onClick={onBackToHome}
                className="hover:text-[#2D5A27] transition-colors flex items-center gap-1 font-bold cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>HOME</span>
              </button>
              <span>/</span>
              <span className="text-[#2D5A27] font-bold uppercase">COLLECTIONS & CATALOG</span>
            </div>

            <button
              onClick={onBackToHome}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9D3C7] hover:border-[#2D5A27] bg-white text-xs font-mono font-bold text-[#2D231E] hover:text-[#2D5A27] shadow-2xs transition-all cursor-pointer"
            >
              <span>RETURN TO LOOKBOOK</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          {/* Title & Description */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2D5A27]/10 text-[#2D5A27] text-[11px] font-mono font-bold tracking-wider uppercase mb-2">
                <Sparkles size={13} className="text-[#BC5A36]" />
                <span>MATCH.A 2026 ARCHIVE • 247 PIECES</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight uppercase text-[#2D231E]">
                All Collections
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#6B5E55] max-w-2xl font-normal">
                Discover organic heavyweight textures, volume Japanese denim, seasonal outerwear, and artisanal accessories.
              </p>
            </div>

            {/* Quick Category Tab Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#2D5A27] text-white border-[#2D5A27] shadow-sm scale-102'
                      : 'bg-white text-[#2D231E] border-[#D9D3C7] hover:border-[#2D5A27] hover:text-[#2D5A27]'
                  }`}
                >
                  {cat.name.split(' ')[0]} ({cat.count})
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 2. Main Sticky Control Bar: Search + Filter Trigger + Sort + Layout Switcher */}
      <section className="sticky top-16 sm:top-20 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#D9D3C7] py-3 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Live Search Input */}
          <div className="relative w-full md:w-80 lg:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 247 items by name, silhouette, color..."
              className="w-full pl-9 pr-9 py-2 bg-white border border-[#D9D3C7] rounded-xl text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent transition-all shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5E55] hover:text-[#2D231E]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Right: FILTERS Slide-Out Drawer Button + Sort + Layout Switchers */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2 sm:gap-3">
            
            {/* Primary Filter Slide-Out Trigger Button (Desktop & Mobile) */}
            <button
              onClick={() => setFilterDrawerOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95 ${
                activeFiltersCount > 0
                  ? 'bg-[#2D5A27] text-white hover:bg-[#23471E] ring-2 ring-[#2D5A27]/30'
                  : 'bg-white text-[#2D231E] border border-[#D9D3C7] hover:border-[#2D5A27] hover:text-[#2D5A27]'
              }`}
            >
              <SlidersHorizontal size={14} className={activeFiltersCount > 0 ? 'text-[#D0DEC6]' : 'text-[#BC5A36]'} />
              <span>FILTERS</span>
              {activeFiltersCount > 0 ? (
                <span className="w-5 h-5 rounded-full bg-[#BC5A36] text-white text-[11px] flex items-center justify-center font-bold font-mono">
                  {activeFiltersCount}
                </span>
              ) : (
                <span className="text-[10px] text-[#6B5E55]">✦</span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-[#D9D3C7] rounded-xl px-3 py-1.5 shadow-2xs">
              <ArrowUpDown size={13} className="text-[#6B5E55] hidden sm:inline" />
              <label htmlFor="sort-select" className="text-[11px] font-mono font-bold text-[#6B5E55] uppercase hidden sm:inline">
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-[#2D231E] focus:outline-none cursor-pointer py-0.5"
              >
                <option value="featured">Featured Drops</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Grid Layout Switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-white border border-[#D9D3C7] p-1 rounded-xl shadow-2xs">
              <button
                onClick={() => setGridCols(2)}
                title="2 Columns (Editorial)"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  gridCols === 2 ? 'bg-[#2D5A27] text-white' : 'text-[#6B5E55] hover:text-[#2D231E]'
                }`}
              >
                <Grid2x2 size={15} />
              </button>
              <button
                onClick={() => setGridCols(3)}
                title="3 Columns (Standard)"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  gridCols === 3 ? 'bg-[#2D5A27] text-white' : 'text-[#6B5E55] hover:text-[#2D231E]'
                }`}
              >
                <Grid3x3 size={15} />
              </button>
              <button
                onClick={() => setGridCols(4)}
                title="4 Columns (Full Width Grid)"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  gridCols === 4 ? 'bg-[#2D5A27] text-white' : 'text-[#6B5E55] hover:text-[#2D231E]'
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setGridCols('list')}
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
      </section>

      {/* 3. Full-Width Product Catalog Grid (No boxy sidebar!) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Active Filters Summary Chips Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6 p-3.5 rounded-2xl bg-white border border-[#D9D3C7] text-xs shadow-2xs animate-fade-in">
            <span className="font-mono text-[11px] font-bold text-[#6B5E55] uppercase flex items-center gap-1">
              <Filter size={12} className="text-[#2D5A27]" />
              Active Filters ({activeFiltersCount}):
            </span>
            
            {selectedCategory !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2D5A27]/10 text-[#2D5A27] font-bold text-xs font-mono">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('ALL')} className="hover:text-[#BC5A36] cursor-pointer"><X size={12} /></button>
              </span>
            )}

            {selectedSeason !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2D5A27]/10 text-[#2D5A27] font-bold text-xs font-mono">
                Season: {selectedSeason} Drop
                <button onClick={() => setSelectedSeason('ALL')} className="hover:text-[#BC5A36] cursor-pointer"><X size={12} /></button>
              </span>
            )}

            {selectedColor !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2D5A27]/10 text-[#2D5A27] font-bold text-xs font-mono">
                Color: {selectedColor}
                <button onClick={() => setSelectedColor('ALL')} className="hover:text-[#BC5A36] cursor-pointer"><X size={12} /></button>
              </span>
            )}

            {selectedFit !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#BC5A36]/10 text-[#BC5A36] font-bold text-xs font-mono">
                Fit: {selectedFit}
                <button onClick={() => setSelectedFit('ALL')} className="hover:text-[#2D231E] cursor-pointer"><X size={12} /></button>
              </span>
            )}

            {priceRange < 150 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF8F5] border border-[#D9D3C7] text-[#2D231E] font-bold text-xs font-mono">
                Under ${priceRange}
                <button onClick={() => setPriceRange(150)} className="hover:text-[#BC5A36] cursor-pointer"><X size={12} /></button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2D5A27]/10 text-[#2D5A27] font-bold text-xs font-mono">
                In Stock Only
                <button onClick={() => setInStockOnly(false)} className="hover:text-[#BC5A36] cursor-pointer"><X size={12} /></button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF8F5] border border-[#D9D3C7] text-[#2D231E] font-bold text-xs font-mono">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-[#BC5A36] cursor-pointer"><X size={12} /></button>
              </span>
            )}

            <button 
              onClick={handleResetFilters}
              className="ml-auto text-xs font-mono font-bold text-[#BC5A36] hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={12} />
              <span>Reset All</span>
            </button>
          </div>
        )}

        {/* Results Count & Items Per Page Selector */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-mono text-[#6B5E55]">
            Showing <strong className="text-[#2D231E]">{products.length}</strong> styles in MatchA archive
          </p>

          <div className="flex items-center gap-2 text-xs font-mono text-[#6B5E55]">
            <span>Show:</span>
            {[12, 24, 48].map((num) => (
              <button
                key={num}
                onClick={() => { setItemsPerPage(num); setCurrentPage(1); }}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  itemsPerPage === num ? 'bg-[#2D5A27] text-white font-bold' : 'hover:text-[#2D231E]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="py-24 text-center">
            <RefreshCw size={28} className="mx-auto text-[#2D5A27] animate-spin mb-3" />
            <p className="text-sm font-mono text-[#6B5E55]">Curating MatchA Collection...</p>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-center my-6">
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={handleResetFilters}
              className="mt-3 px-4 py-1.5 bg-red-700 text-white rounded-lg text-xs font-mono font-bold hover:bg-red-800"
            >
              Retry & Clear Filters
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="py-24 px-6 text-center bg-white border border-[#D9D3C7] rounded-3xl my-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#D9D3C7] flex items-center justify-center mx-auto text-2xl mb-4">
              🔍
            </div>
            <h3 className="text-lg font-bold uppercase text-[#2D231E]">No Matching Silhouettes Found</h3>
            <p className="text-xs text-[#6B5E55] max-w-md mx-auto mt-2 mb-5">
              Try adjusting your search query, price limit, or clearing color filters to discover available pieces.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-[#2D5A27] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:bg-[#23471E] transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Product Grid / List Layout */}
        {!loading && products.length > 0 && (
          <>
            {gridCols === 'list' ? (
              /* --- LIST VIEW --- */
              <div className="space-y-4">
                {paginatedProducts.map((product) => (
                  <div 
                    key={product.id}
                    className="bg-white border border-[#D9D3C7] hover:border-[#2D5A27] rounded-2xl p-4 transition-all shadow-2xs hover:shadow-md flex flex-col sm:flex-row items-center gap-5 group"
                  >
                    <div className="w-full sm:w-44 aspect-square rounded-xl overflow-hidden bg-[#FAF8F5] shrink-0 relative">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      {product.tag && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#2D231E]/90 text-white text-[9px] font-mono font-bold rounded">
                          {product.tag}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left w-full">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#6B5E55]">
                        <span className="text-[#2D5A27] font-bold uppercase">{product.season} Drop</span>
                        <span>•</span>
                        <span className="uppercase">{product.category}</span>
                        <span>•</span>
                        <span>{product.id}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5 text-amber-600 font-bold">
                          <Star size={10} className="fill-amber-500 text-amber-500" />
                          {product.rating} ({product.reviewsCount})
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-[#2D231E] uppercase mt-1 tracking-tight group-hover:text-[#2D5A27] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-[#6B5E55] mt-1 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center gap-2 mt-3 text-xs font-mono">
                        <span className="font-bold text-sm text-[#2D231E]">${product.price.toFixed(2)}</span>
                        {product.originalPrice && (
                          <span className="line-through text-[#6B5E55] text-xs">${product.originalPrice.toFixed(2)}</span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#D0DEC6]/60 text-[#2D5A27] font-bold ml-2">
                          {product.fit}
                        </span>
                        <span 
                          className="w-3 h-3 rounded-full border border-black/10 inline-block ml-1"
                          style={{ backgroundColor: product.colorHex }}
                          title={product.color}
                        />
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 w-full sm:w-36 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#D9D3C7]">
                      <button
                        onClick={() => onAddToCart && onAddToCart(product)}
                        className="flex-1 sm:w-full py-2.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <ShoppingBag size={13} />
                        <span>Add Bag</span>
                      </button>
                      <button
                        onClick={() => onQuickView && onQuickView(product)}
                        className="flex-1 sm:w-full py-2.5 bg-white border border-[#D9D3C7] hover:border-[#2D5A27] text-[#2D231E] text-xs font-bold font-mono uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Quick View</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* --- GRID VIEW (2, 3, or 4 Cols) --- */
              <div className={`grid gap-5 sm:gap-6 ${
                gridCols === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                gridCols === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
                {paginatedProducts.map((product) => {
                  const isHovered = hoveredCardId === product.id;
                  return (
                    <div
                      key={product.id}
                      onMouseEnter={() => setHoveredCardId(product.id)}
                      onMouseLeave={() => setHoveredCardId(null)}
                      className="group relative bg-white border border-[#D9D3C7] hover:border-[#2D5A27] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col"
                    >
                      {/* Image Container with Dynamic Hover Swap */}
                      <div className="relative aspect-3/4 w-full bg-[#FAF8F5] overflow-hidden">
                        <img
                          src={isHovered && product.secondaryImage ? product.secondaryImage : product.image}
                          alt={product.name}
                          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        />

                        {/* Badge */}
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                          {product.tag && (
                            <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg shadow-sm uppercase ${
                              product.tag.includes('Best') ? 'bg-[#BC5A36] text-white' :
                              product.tag.includes('New') ? 'bg-[#2D5A27] text-white' :
                              'bg-[#2D231E] text-[#D0DEC6]'
                            }`}>
                              {product.tag}
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#FAF8F5]/90 text-[#6B5E55] rounded backdrop-blur-xs shadow-2xs self-start">
                            {product.season}
                          </span>
                        </div>

                        {/* Quick View Floating Overlay on Hover */}
                        <div className={`absolute inset-x-3 bottom-3 z-20 flex gap-2 transition-all duration-300 transform ${
                          isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
                        }`}>
                          <button
                            onClick={() => onQuickView && onQuickView(product)}
                            className="flex-1 py-2 bg-white/95 hover:bg-white text-[#2D231E] text-xs font-mono font-bold uppercase rounded-xl backdrop-blur-md shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>Quick View</span>
                          </button>
                          <button
                            onClick={() => onAddToCart && onAddToCart(product)}
                            title="Quick Add"
                            className="p-2 bg-[#2D5A27] hover:bg-[#23471E] text-white rounded-xl shadow-md transition-colors active:scale-90 cursor-pointer"
                          >
                            <ShoppingBag size={15} />
                          </button>
                        </div>

                        {/* Stock Indicator */}
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-[#2D231E]/60 backdrop-blur-[1px] flex items-center justify-center z-15">
                            <span className="px-3 py-1 bg-white text-[#2D231E] text-xs font-mono font-bold uppercase tracking-wider rounded-lg shadow-md">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Content & Details */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#6B5E55] mb-1">
                            <span className="text-[#2D5A27] font-bold uppercase">{product.category}</span>
                            <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                              <Star size={10} className="fill-amber-500 text-amber-500" />
                              {product.rating}
                            </span>
                          </div>

                          <h3 
                            onClick={() => onQuickView && onQuickView(product)}
                            className="text-sm font-extrabold text-[#2D231E] uppercase tracking-tight line-clamp-1 group-hover:text-[#2D5A27] transition-colors cursor-pointer"
                          >
                            {product.name}
                          </h3>

                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#6B5E55]">
                            <span 
                              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: product.colorHex }}
                            />
                            <span className="truncate">{product.color}</span>
                            <span>•</span>
                            <span>{product.fit}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#D9D3C7]/60 flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5 font-mono">
                            <span className="text-sm font-bold text-[#2D231E]">
                              ${product.price.toFixed(2)}
                            </span>
                            {product.originalPrice && (
                              <span className="text-[11px] line-through text-[#6B5E55]">
                                ${product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => onAddToCart && onAddToCart(product)}
                            disabled={!product.inStock}
                            className="px-3 py-1.5 bg-[#D0DEC6]/50 hover:bg-[#2D5A27] text-[#2D5A27] hover:text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 pt-6 border-t border-[#D9D3C7] flex items-center justify-between flex-wrap gap-4">
                <p className="text-xs font-mono text-[#6B5E55]">
                  Page <strong className="text-[#2D231E]">{currentPage}</strong> of <strong className="text-[#2D231E]">{totalPages}</strong> ({products.length} Total Items)
                </p>

                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <button
                    onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-[#D9D3C7] bg-white text-[#2D231E] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#2D5A27] cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft size={13} />
                    <span>PREV</span>
                  </button>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) pageNum = i + 1;
                    else if (currentPage <= 4) pageNum = i + 1;
                    else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                    else pageNum = currentPage - 3 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
                        className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-[#2D5A27] text-white shadow-xs'
                            : 'bg-white border border-[#D9D3C7] text-[#2D231E] hover:border-[#2D5A27]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-[#D9D3C7] bg-white text-[#2D231E] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#2D5A27] cursor-pointer flex items-center gap-1"
                  >
                    <span>NEXT</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* ================= 4. SLIDE-OVER GLASSMORPHISM FILTER DRAWER ================= */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          
          {/* Frosted Glass Backdrop */}
          <div 
            onClick={() => setFilterDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in cursor-pointer" 
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#FAF8F5] border-l border-[#D9D3C7] shadow-2xl flex flex-col justify-between animate-slide-left">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 bg-white border-b border-[#D9D3C7] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#2D5A27] text-white flex items-center justify-center shadow-xs">
                    <SlidersHorizontal size={16} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base uppercase text-[#2D231E] tracking-tight">Curate Archive</h3>
                    <p className="text-[10px] font-mono text-[#6B5E55]">MATCH.A SPECIFICATION & FILTERS</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleResetFilters}
                      className="text-xs font-mono font-bold text-[#BC5A36] hover:underline cursor-pointer px-2 py-1"
                    >
                      Clear ({activeFiltersCount})
                    </button>
                  )}
                  <button 
                    onClick={() => setFilterDrawerOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-[#FAF8F5] text-[#6B5E55] hover:text-[#2D231E] transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Filter Body */}
              <div className="px-6 py-6 overflow-y-auto flex-1 space-y-6">
                
                {/* 1. Category Filter */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-[#6B5E55] uppercase tracking-wider mb-2.5">
                    Category
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'bg-[#2D5A27] text-white font-bold shadow-xs'
                            : 'bg-white text-[#2D231E] border border-[#D9D3C7] hover:border-[#2D5A27]'
                        }`}
                      >
                        <span className="truncate">{cat.name.split(' ')[0]}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-[#FAF8F5] text-[#6B5E55]'
                        }`}>
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Seasonal Drop Filter */}
                <div className="pt-5 border-t border-[#D9D3C7]">
                  <h4 className="text-xs font-mono font-bold text-[#6B5E55] uppercase tracking-wider mb-2.5">
                    Seasonal Drop
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {seasonOptions.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSelectedSeason(s.value)}
                        className={`px-3 py-2 rounded-xl border text-xs text-left transition-all cursor-pointer flex items-center gap-2 ${
                          selectedSeason === s.value
                            ? 'border-[#2D5A27] bg-[#2D5A27] text-white font-bold shadow-xs'
                            : 'bg-white border-[#D9D3C7] text-[#2D231E] hover:border-[#2D5A27]'
                        }`}
                      >
                        <span>{s.icon}</span>
                        <span className="truncate">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Price Range Slider */}
                <div className="pt-5 border-t border-[#D9D3C7]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-mono font-bold text-[#6B5E55] uppercase tracking-wider">
                      Max Price Range
                    </h4>
                    <span className="text-sm font-mono font-bold text-[#2D5A27] bg-white px-2 py-0.5 rounded border border-[#D9D3C7]">
                      ${priceRange}.00
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    step="5"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-[#2D5A27] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#6B5E55] mt-1">
                    <span>$20</span>
                    <span>$85</span>
                    <span>$150+</span>
                  </div>
                </div>

                {/* 4. Color Shade Filter */}
                <div className="pt-5 border-t border-[#D9D3C7]">
                  <h4 className="text-xs font-mono font-bold text-[#6B5E55] uppercase tracking-wider mb-2.5">
                    Color Shade
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {colorOptions.map((c) => {
                      const isSelected = selectedColor === c.value;
                      return (
                        <button
                          key={c.value}
                          onClick={() => setSelectedColor(c.value)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-[#2D5A27] bg-[#2D5A27]/10 font-bold text-[#2D5A27]' 
                              : 'bg-white border-[#D9D3C7] text-[#2D231E] hover:border-[#6B5E55]'
                          }`}
                        >
                          <span 
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-2xs"
                            style={{ background: c.hex }}
                          />
                          <span className="truncate text-[11px]">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Silhouette Fit Filter */}
                <div className="pt-5 border-t border-[#D9D3C7]">
                  <h4 className="text-xs font-mono font-bold text-[#6B5E55] uppercase tracking-wider mb-2.5">
                    Silhouette Fit
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {fitOptions.map((fit) => (
                      <button
                        key={fit}
                        onClick={() => setSelectedFit(fit)}
                        className={`px-3 py-1.5 text-xs font-mono rounded-xl border transition-all cursor-pointer ${
                          selectedFit === fit
                            ? 'bg-[#BC5A36] text-white border-[#BC5A36] font-bold shadow-2xs'
                            : 'bg-white border-[#D9D3C7] text-[#6B5E55] hover:border-[#2D5A27] hover:text-[#2D231E]'
                        }`}
                      >
                        {fit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. In-Stock Only Switch */}
                <div className="pt-5 border-t border-[#D9D3C7] flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#D9D3C7]">
                  <div>
                    <span className="text-xs font-bold text-[#2D231E] block">In Stock Ready</span>
                    <span className="text-[10px] text-[#6B5E55]">Show immediately dispatchable pieces</span>
                  </div>
                  <button
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      inStockOnly ? 'bg-[#2D5A27]' : 'bg-[#D9D3C7]'
                    }`}
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 transition-transform shadow-xs ${
                        inStockOnly ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-5 bg-white border-t border-[#D9D3C7] space-y-2">
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className="w-full py-3.5 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check size={15} />
                  <span>VIEW MATCHING PIECES ({products.length})</span>
                </button>
                <button
                  onClick={handleResetFilters}
                  className="w-full py-2 bg-transparent text-[#BC5A36] hover:text-[#9E4423] text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  RESET ALL FILTERS
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
