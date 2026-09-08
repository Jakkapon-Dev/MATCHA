import React from 'react';
import { PackageOpen, RotateCcw } from 'lucide-react';

export default function EmptyState({
  title = 'No items found',
  description = 'We couldn’t find any matches for your current filters. Try loosening your search criteria.',
  actionLabel = 'Reset All Filters',
  onAction,
  icon: Icon = PackageOpen,
}) {
  return (
    <div className="w-full py-16 px-6 text-center rounded-3xl border-2 border-dashed border-[#D9D3C7] bg-[#FAF8F5]/60 flex flex-col items-center justify-center my-6">
      <div className="w-20 h-20 rounded-3xl bg-[#D0DEC6]/50 border border-[#B8CBAE] flex items-center justify-center text-[#2D5A27] shadow-sm mb-5">
        <Icon size={36} />
      </div>
      <h3 className="text-xl font-extrabold uppercase text-[#2D231E] tracking-tight">
        {title}
      </h3>
      <p className="text-xs font-mono text-[#6B5E55] max-w-md mt-2 leading-relaxed">
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-[#2D5A27] hover:bg-[#23471E] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer font-mono"
        >
          <RotateCcw size={14} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
