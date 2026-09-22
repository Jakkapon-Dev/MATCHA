import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white border border-matcha-border overflow-hidden p-4 shadow-sm animate-pulse flex flex-col justify-between">
      {/* Image Skeleton */}
      <div className="w-full aspect-4/5 rounded-2xl bg-matcha-secondary/40 relative overflow-hidden">
        <div className="absolute top-3 left-3 w-16 h-5 rounded-md bg-matcha-border/60" />
      </div>

      {/* Details Skeleton */}
      <div className="pt-4 space-y-3">
        {/* Category & Fit */}
        <div className="flex justify-between items-center">
          <div className="w-20 h-3 rounded bg-matcha-border/60" />
          <div className="w-12 h-3 rounded bg-matcha-border/40" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="w-full h-4 rounded bg-matcha-border/70" />
          <div className="w-2/3 h-4 rounded bg-matcha-border/50" />
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-matcha-border/40">
          <div className="w-16 h-6 rounded-md bg-matcha-border/70" />
          <div className="w-24 h-9 rounded-xl bg-matcha-border/60" />
        </div>
      </div>
    </div>
  );
}
