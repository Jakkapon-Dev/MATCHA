import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  startIndex,
  endIndex
}) {
  // A single-page result set needs no navigation or range summary.
  if (totalPages <= 1) return null;

  return (
    <div className="mt-14 pt-8 border-t border-[#DCDCDC] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#666666]">
      <div>
        Showing <span className="font-bold text-[#000000]">{startIndex}</span>–
        <span className="font-bold text-[#000000]">{endIndex}</span> of{' '}
        <span className="font-bold text-[#000000]">{totalItems}</span> items
      </div>

      <div className="flex items-center gap-1.5">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-[#DCDCDC] bg-white hover:border-[#042509] text-[#000000] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Generate one controlled page button for every page in the filtered result. */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              currentPage === p
                ? 'bg-[#042509] text-white border-[#042509] shadow-xs'
                : 'bg-white text-[#000000] border-[#DCDCDC] hover:border-[#042509]'
            }`}
          >
            {p}
          </button>
        ))}

        {/* Next */}
        {/* Boundary buttons are disabled so the parent never receives an invalid page. */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-[#DCDCDC] bg-white hover:border-[#042509] text-[#000000] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
