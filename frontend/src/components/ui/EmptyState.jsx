import React from 'react';
import { RotateCcw } from 'lucide-react';

/* The catalogue's no-results state.

   The old version announced itself with a dashed rounded panel and a filled
   icon tile, which made an ordinary dead end look like a system failure and
   carried more visual weight than the garments it replaced. An empty result is
   a normal outcome of narrowing a filter, so it is set as quietly as the rest
   of the page and spends its effort on the way out instead. */

export default function EmptyState({
  title = 'Nothing matches yet',
  description = 'No garment carries this combination. Loosening one filter usually brings the most back.',
  actionLabel = 'Clear all filters',
  onAction,
}) {
  return (
    <div className="w-full py-20 border-t border-[#DCDCDC]">
      <h3 className="text-2xl sm:text-3xl font-black uppercase text-[#0A0A0A] tracking-tight leading-none">
        {title}
      </h3>
      <p className="mt-3 text-sm text-[#666666] max-w-md leading-relaxed">
        {description}
      </p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#C91D1D] hover:underline underline-offset-4 cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
