import React from 'react';

export default function PreviewNote({ children, className = '' }) {
  return (
    <div className={`p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono flex items-start gap-2 ${className}`}>
      <span className="text-sm shrink-0">🧪</span>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
