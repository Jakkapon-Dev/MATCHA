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
    <div className="w-full py-16 px-6 text-center rounded-3xl border-2 border-dashed border-[#DCDCDC] bg-[#F1F1F1]/60 flex flex-col items-center justify-center my-6">
      <div className="w-20 h-20 rounded-3xl bg-[#518F5C]/50 border border-[#3E7047] flex items-center justify-center text-[#042509] shadow-sm mb-5">
        <Icon size={36} />
      </div>
      <h3 className="text-xl font-extrabold uppercase text-[#000000] tracking-tight">
        {title}
      </h3>
      <p className="text-xs font-mono text-[#666666] max-w-md mt-2 leading-relaxed">
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-[#042509] hover:bg-[#021505] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer font-mono"
        >
          <RotateCcw size={14} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
