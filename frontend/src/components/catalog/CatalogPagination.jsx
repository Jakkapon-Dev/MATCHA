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
  if (totalPages <= 1) return null;

  return (
    <div className="mt-14 pt-8 border-t border-[#D9D3C7] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#6B5E55]">
      <div>
        Showing <span className="font-bold text-[#2D231E]">{startIndex}</span>–
        <span className="font-bold text-[#2D231E]">{endIndex}</span> of{' '}
        <span className="font-bold text-[#2D231E]">{totalItems}</span> items
      </div>

      <div className="flex items-center gap-1.5">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-[#D9D3C7] bg-white hover:border-[#2D5A27] text-[#2D231E] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              currentPage === p
                ? 'bg-[#2D5A27] text-white border-[#2D5A27] shadow-xs'
                : 'bg-white text-[#2D231E] border-[#D9D3C7] hover:border-[#2D5A27]'
            }`}
          >
            {p}
          </button>
        ))}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-[#D9D3C7] bg-white hover:border-[#2D5A27] text-[#2D231E] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
