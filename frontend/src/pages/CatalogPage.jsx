import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import useChangeMotion from '../hooks/useChangeMotion';
import { api } from '../services/api';
import ProductCardSkeleton from '../components/ui/ProductCardSkeleton';
import EmptyState from '../components/ui/EmptyState';
import CatalogPagination from '../components/catalog/CatalogPagination';
import DyeIndex from '../components/catalog/DyeIndex';
import DyeTile from '../components/catalog/DyeTile';
import { buildDyeIndex, variantForDye } from '../utils/dye';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'name', label: 'A to Z' },
];

const FITS = ['ALL', 'Oversized', 'Relaxed', 'Tailored', 'Wide Leg', 'Vintage Boxy'];
const SEASONS = ['ALL', 'Spring', 'Summer', 'Autumn', 'Winter', 'Artisan'];
const MAX_PRICE = 200;

const priceOf = (product) =>
  typeof product?.price === 'number' ? product.price : parseFloat(product?.price) || 0;

export default function CatalogPage({
  initialCategory = 'ALL',
  onAddToCart,
  onQuickView,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  /* A dye can arrive in the URL — the colour lab's reading links straight to
     one, and it makes any single colour a page worth sharing or bookmarking.
     The parameter seeds the filter at mount and is kept in step with it after,
     so the address bar and the rail never disagree. */
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDye, setSelectedDye] = useState(() => searchParams.get('dye') || 'ALL');
  const [selectedFit, setSelectedFit] = useState('ALL');
  const [priceRange, setPriceRange] = useState(MAX_PRICE);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Sync category state whenever initialCategory prop changes from external navigation (e.g. ChooseYourFit)
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  /* The archive is fetched once and narrowed in the browser. The dye rail has
     to show how many garments sit behind every colour, which means the page
     needs the whole set in hand regardless of what is currently selected —
     and once it has it, a round trip per filter change buys nothing. */
  useEffect(() => {
    let cancelled = false;

    async function loadArchive() {
      setLoading(true);
      try {
        const response = await api.getProducts({ page: 1, limit: 100 });
        if (cancelled) return;
        setProducts(response?.data || []);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load products:', err);
        setError('The archive could not be reached. Reload to try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadArchive();
    return () => { cancelled = true; };
  }, []);

  // Categories come from the archive rather than a second endpoint, so the nav
  // can never offer a category with nothing in it.
  const categories = useMemo(() => {
    const names = new Set(products.map((p) => p?.category).filter(Boolean));
    return ['ALL', ...[...names].sort()];
  }, [products]);

  const matchesEverythingButDye = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (selectedCategory !== 'ALL' && product?.category !== selectedCategory) return false;
      if (selectedSeason !== 'ALL' && product?.season !== selectedSeason) return false;
      if (selectedFit !== 'ALL' && product?.fit !== selectedFit) return false;
      if (inStockOnly && product?.inStock === false) return false;
      if (priceOf(product) > priceRange) return false;
      if (query) {
        const haystack = `${product?.name || ''} ${product?.category || ''} ${product?.season || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedSeason, selectedFit, inStockOnly, priceRange, searchQuery]);

  /* Counts are taken before the dye filter is applied. Narrowing to Coral must
     not collapse every other band to zero — the rail has to keep showing where
     else the visitor could go. */
  const dyes = useMemo(() => buildDyeIndex(matchesEverythingButDye), [matchesEverythingButDye]);

  /* A dye named in the URL may not survive a rename, or may simply be wrong.
     Rather than an empty grid with no filter the visitor can see they set, an
     unrecognised name drops back to the whole archive. This waits for the
     fetch, because before it lands every name looks unrecognised. */
  useEffect(() => {
    if (loading || selectedDye === 'ALL') return;
    if (!dyes.some((dye) => dye.name === selectedDye)) setSelectedDye('ALL');
  }, [loading, dyes, selectedDye]);

  /* Written back with replace rather than push: a colour index invites a lot
     of trying-things-out, and pushing each one would bury the page the visitor
     arrived from under twenty steps of Back. */
  useEffect(() => {
    const current = searchParams.get('dye') || 'ALL';
    if (current === selectedDye) return;
    const next = new URLSearchParams(searchParams);
    if (selectedDye === 'ALL') next.delete('dye');
    else next.set('dye', selectedDye);
    setSearchParams(next, { replace: true });
  }, [selectedDye, searchParams, setSearchParams]);

  const visible = useMemo(() => {
    const byDye = selectedDye === 'ALL'
      ? matchesEverythingButDye
      : matchesEverythingButDye.filter((product) => {
          const variants = product?.variants?.length
            ? product.variants
            : [{ color: product?.color }];
          return variants.some((v) => v?.color === selectedDye);
        });

    const sorted = [...byDye];
    if (sortBy === 'price-asc') sorted.sort((a, b) => priceOf(a) - priceOf(b));
    else if (sortBy === 'price-desc') sorted.sort((a, b) => priceOf(b) - priceOf(a));
    else if (sortBy === 'name') sorted.sort((a, b) => String(a?.name).localeCompare(String(b?.name)));
    return sorted;
  }, [matchesEverythingButDye, selectedDye, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSeason, selectedDye, selectedFit, inStockOnly, priceRange, searchQuery, sortBy]);

  const totalItems = visible.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const pageItems = useMemo(
    () => visible.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [visible, currentPage]
  );
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const refineCount =
    (selectedSeason !== 'ALL' ? 1 : 0) +
    (selectedFit !== 'ALL' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (priceRange < MAX_PRICE ? 1 : 0);

  const hasFilters = refineCount > 0 || selectedDye !== 'ALL' || selectedCategory !== 'ALL' || Boolean(searchQuery);

  const resetAll = () => {
    setSelectedCategory('ALL');
    setSelectedSeason('ALL');
    setSelectedDye('ALL');
    setSelectedFit('ALL');
    setPriceRange(MAX_PRICE);
    setInStockOnly(false);
    setSearchQuery('');
    setSortBy('featured');
  };

  /* A native <details> only closes from its own summary, and this one is an
     overlay: left open it covers the grid it was used to narrow. Dismiss it
     the way every other popover on the web dismisses. */
  const refineRef = useRef(null);
  useEffect(() => {
    const dismiss = (event) => {
      const panel = refineRef.current;
      if (!panel?.open) return;
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && panel.contains(event.target)) return;
      panel.open = false;
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismiss);
    };
  }, []);

  // The grid answers the filter it was given; nothing here animates on scroll.
  const gridMotionRef = useChangeMotion(
    `${loading}-${selectedDye}-${pageItems.map((p) => p.id).join('|')}`,
    'grid'
  );

  return (
    <div className="w-full bg-matcha-bg min-h-screen py-10 sm:py-14 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        <header className="mb-8">
          <h1 className="text-4xl sm:text-6xl font-black uppercase text-[#0A0A0A] tracking-tight leading-none">
            Artisan Apparel
          </h1>
          {/* The archive described by its own contents, in a sentence, instead
              of a tracked-out label stack above the title. Once a filter is on,
              the sentence describes the result rather than the archive: the dye
              count is taken before the dye filter, so pairing it with a
              narrowed total would be two different numbers in one breath. */}
          <p className="mt-3 font-mono text-xs text-matcha-muted">
            {loading
              ? 'Opening the archive'
              : hasFilters
                ? `${totalItems} of ${products.length} pieces`
                : `${products.length} pieces in ${dyes.length} dyes`}
          </p>
        </header>

        {/* Category is the one axis that is genuinely orthogonal to colour, so
            it stays — as reading matter, not as a row of filled pills. */}
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 pb-4 border-b border-matcha-border">
          {categories.map((name) => {
            const active = selectedCategory === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedCategory(name)}
                /* min-h-11 is 44px: the row is 12px of type, and on a phone a
                   12px-tall target between two other 12px-tall targets is a
                   coin toss. The padding grows the tap area without moving the
                   type or the accent underline. */
                className={`inline-flex items-center min-h-11 font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors ${
                  active
                    ? 'text-[#0A0A0A] font-bold underline underline-offset-[6px] decoration-2 decoration-matcha-accent'
                    : 'text-matcha-muted hover:text-[#0A0A0A]'
                }`}
              >
                {name === 'ALL' ? 'Everything' : name}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-matcha-border mb-8">
          <label className="flex-1 min-w-[12rem] max-w-sm">
            <span className="sr-only">Search the archive</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search the archive"
              className="w-full bg-transparent border-b border-matcha-border focus:border-[#0A0A0A] outline-hidden py-1.5 text-sm text-[#0A0A0A] placeholder:text-[#999999] transition-colors"
            />
          </label>

          <div className="flex items-center gap-5">
            {/* Native disclosure: the secondary axes stay available without a
                permanent second row competing with the dye index. */}
            <details ref={refineRef} className="relative">
              <summary className="font-mono text-xs uppercase tracking-wider text-[#0A0A0A] cursor-pointer list-none marker:hidden outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]">
                Refine{refineCount > 0 ? ` (${refineCount})` : ''}
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-72 bg-white border border-matcha-border p-4 space-y-4 shadow-lg">
                <fieldset>
                  <legend className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-2">Season</legend>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {SEASONS.map((season) => (
                      <label key={season} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="season"
                          checked={selectedSeason === season}
                          onChange={() => setSelectedSeason(season)}
                          className="accent-matcha-accent"
                        />
                        <span>{season === 'ALL' ? 'Any' : season}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-2">Fit</legend>
                  <select
                    value={selectedFit}
                    onChange={(event) => setSelectedFit(event.target.value)}
                    className="w-full border border-matcha-border px-2 py-1.5 text-xs bg-white cursor-pointer"
                  >
                    {FITS.map((fit) => (
                      <option key={fit} value={fit}>{fit === 'ALL' ? 'Any fit' : fit}</option>
                    ))}
                  </select>
                </fieldset>

                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted">
                    Up to ${priceRange}
                  </span>
                  <input
                    type="range"
                    min="20"
                    max={MAX_PRICE}
                    step="5"
                    value={priceRange}
                    onChange={(event) => setPriceRange(Number(event.target.value))}
                    className="w-full mt-1.5 accent-matcha-accent cursor-pointer"
                  />
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={() => setInStockOnly(!inStockOnly)}
                    className="accent-matcha-accent"
                  />
                  <span>In stock only</span>
                </label>
              </div>
            </details>

            <label className="flex items-center gap-2">
              <span className="sr-only">Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="font-mono text-xs uppercase tracking-wider bg-transparent border-0 outline-hidden cursor-pointer text-[#0A0A0A]"
              >
                {SORTS.map((sort) => (
                  <option key={sort.value} value={sort.value}>{sort.label}</option>
                ))}
              </select>
            </label>

            {hasFilters && (
              <button
                type="button"
                onClick={resetAll}
                className="font-mono text-xs uppercase tracking-wider text-matcha-accent hover:underline cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* The strip sits above the row; the rail sits inside it. Neither is
            rendered with nothing to show — an index of no colours is a column
            of empty boxes, and the empty state already explains itself. */}
        {!loading && !error && dyes.length > 0 && (
          <DyeIndex
            variant="strip"
            dyes={dyes}
            selected={selectedDye}
            onSelect={(name) => setSelectedDye((current) => (current === name ? 'ALL' : name))}
            total={matchesEverythingButDye.length}
          />
        )}

        <div className="flex gap-8 items-start">
          {!loading && !error && dyes.length > 0 && (
            <DyeIndex
              variant="rail"
              dyes={dyes}
              selected={selectedDye}
              onSelect={(name) => setSelectedDye((current) => (current === name ? 'ALL' : name))}
              total={matchesEverythingButDye.length}
            />
          )}

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : error ? (
              <p role="alert" className="py-16 text-sm text-matcha-accent">{error}</p>
            ) : pageItems.length === 0 ? (
              <EmptyState
                title="Nothing in the archive matches yet"
                description="No garment carries this combination of dye, season and fit. Clearing the dye usually brings the most back."
                actionLabel="Clear all filters"
                onAction={resetAll}
              />
            ) : (
              <>
                <div
                  ref={gridMotionRef}
                  className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8"
                >
                  {pageItems.map((product) => (
                    <DyeTile
                      key={product.id}
                      product={product}
                      variant={variantForDye(product, selectedDye)}
                      onAddToCart={onAddToCart}
                      onQuickView={onQuickView}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
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
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
