import React from 'react';

export default function PreviewBadge({ label = 'COMING SOON', className = '' }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 ${className}`}>
      {label}
    </span>
  );
}
