import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* Page navigation for the catalogue.

   Set as quietly as the category nav above the grid, and for the same reason:
   on a page whose whole job is to let garment colour carry, chrome that fills
   itself in with brand colour competes with the thing being sold. The current
   page is marked the way the current category is — a red rule under the
   numeral — so the two navigations read as one system. */

export default function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  startIndex,
  endIndex,
}) {
  // A single-page result set needs no navigation or range summary.
  if (totalPages <= 1) return null;

  const step = (delta) => onPageChange(currentPage + delta);

  const arrow = 'p-1 text-[#0A0A0A] disabled:opacity-30 disabled:pointer-events-none cursor-pointer hover:text-matcha-accent transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]';

  return (
    <nav
      aria-label="Catalogue pages"
      className="mt-16 pt-6 border-t border-matcha-border flex flex-col sm:flex-row items-baseline justify-between gap-4 font-mono text-xs text-matcha-muted"
    >
      <p>
        Showing <span className="text-[#0A0A0A]">{startIndex}</span>–
        <span className="text-[#0A0A0A]">{endIndex}</span> of{' '}
        <span className="text-[#0A0A0A]">{totalItems}</span>
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className={arrow}
        >
          <ChevronLeft size={15} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const active = currentPage === page;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={active ? 'page' : undefined}
              className={`tabular-nums cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                active
                  ? 'text-[#0A0A0A] font-bold underline underline-offset-[6px] decoration-2 decoration-matcha-accent'
                  : 'text-matcha-muted hover:text-[#0A0A0A]'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => step(1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className={arrow}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </nav>
  );
}
