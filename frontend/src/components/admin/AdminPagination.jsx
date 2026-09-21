import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function AdminPagination({
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  loading = false,
  disabled = false,
}) {
  if (total === 0 && totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-matcha-border font-mono text-xs text-matcha-muted">
      <div className="flex items-center gap-2">
        <span>
          Showing page <span className="font-bold text-matcha-text">{page}</span> of <span className="font-bold text-matcha-text">{totalPages}</span>
        </span>
        <span className="text-matcha-border">|</span>
        <span>Total <span className="font-bold text-matcha-text">{total}</span> items</span>
        {loading && (
          <span className="flex items-center gap-1 text-matcha-primary ml-2 font-bold animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            <span>Loading…</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-xl border border-matcha-border bg-matcha-bg hover:bg-white text-matcha-text disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft size={13} />
          <span>Previous</span>
        </button>

        <span className="px-3 py-1.5 rounded-xl bg-matcha-primary text-white font-bold">
          {page}
        </span>

        <button
          type="button"
          disabled={disabled || loading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-xl border border-matcha-border bg-matcha-bg hover:bg-white text-matcha-text disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold flex items-center gap-1 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
