import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white border border-[#D9D3C7] overflow-hidden p-4 shadow-sm animate-pulse flex flex-col justify-between">
      {/* Image Skeleton */}
      <div className="w-full aspect-4/5 rounded-2xl bg-[#D0DEC6]/40 relative overflow-hidden">
        <div className="absolute top-3 left-3 w-16 h-5 rounded-md bg-[#D9D3C7]/60" />
      </div>

      {/* Details Skeleton */}
      <div className="pt-4 space-y-3">
        {/* Category & Fit */}
        <div className="flex justify-between items-center">
          <div className="w-20 h-3 rounded bg-[#D9D3C7]/60" />
          <div className="w-12 h-3 rounded bg-[#D9D3C7]/40" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="w-full h-4 rounded bg-[#D9D3C7]/70" />
          <div className="w-2/3 h-4 rounded bg-[#D9D3C7]/50" />
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-[#D9D3C7]/40">
          <div className="w-16 h-6 rounded-md bg-[#D9D3C7]/70" />
          <div className="w-24 h-9 rounded-xl bg-[#D9D3C7]/60" />
        </div>
      </div>
    </div>
  );
}
