import React from 'react';
import { PieChart, BarChart3 } from 'lucide-react';

const MODES = [
  { id: 'pie', label: 'Pie', icon: PieChart },
  { id: 'bar', label: 'Bars', icon: BarChart3 }
];

/* Pie / bars switch for a panel header. */
export function ChartModeToggle({ mode, onChange, label = 'Chart type' }) {
  return (
    <div role="group" aria-label={label} className="inline-flex p-0.5 rounded-lg bg-matcha-bg border border-matcha-border">
      {MODES.map(({ id, label: text, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={mode === id}
          onClick={() => onChange(id)}
          className={`h-7 px-2.5 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${mode === id ? 'bg-white text-matcha-primary shadow-xs' : 'text-matcha-muted hover:text-matcha-text'}`}
        >
          <Icon size={12} aria-hidden="true" />{text}
        </button>
      ))}
    </div>
  );
}

const point = (cx, cy, r, angle) => [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];

/* A pie drawn from the slices' own values. No chart library: the dashboard
   already draws its bars with plain elements, and one SVG path per slice is
   all a pie needs. */
function Pie({ items, total, format }) {
  const visible = items.filter(item => item.value > 0);
  let angle = 0;
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-52 aspect-square mx-auto" aria-hidden="true">
      {visible.length === 1 ? (
        <circle cx="100" cy="100" r="92" fill={visible[0].color}><title>{`${visible[0].label}: ${format(visible[0].value)} (100%)`}</title></circle>
      ) : visible.map(item => {
        const start = angle;
        angle += (item.value / total) * Math.PI * 2;
        const [x0, y0] = point(100, 100, 92, start);
        const [x1, y1] = point(100, 100, 92, angle);
        const large = angle - start > Math.PI ? 1 : 0;
        return (
          <path
            key={item.label}
            d={`M100 100 L${x0.toFixed(3)} ${y0.toFixed(3)} A92 92 0 ${large} 1 ${x1.toFixed(3)} ${y1.toFixed(3)} Z`}
            fill={item.color}
            stroke="#fff"
            strokeWidth="2"
            className="transition-opacity hover:opacity-80"
          >
            <title>{`${item.label}: ${format(item.value)} (${Math.round((item.value / total) * 100)}%)`}</title>
          </path>
        );
      })}
    </svg>
  );
}

/**
 * One breakdown shown as a pie or as bars. The legend carries every number,
 * so the figures are readable (and announced) whichever form is chosen.
 * items: [{ label, value, color }]
 */
export default function BreakdownChart({ items, mode, format = String, emptyText = 'Nothing to show yet.', summaryLabel }) {
  const total = items.reduce((sum, item) => sum + (item.value > 0 ? item.value : 0), 0);
  const percent = value => (total > 0 ? Math.round((value / total) * 100) : 0);
  if (total <= 0) {
    return <p className="h-48 flex items-center justify-center text-xs font-mono text-matcha-muted border border-dashed border-matcha-border rounded-xl">{emptyText}</p>;
  }
  const summary = `${summaryLabel ? `${summaryLabel}: ` : ''}${items.map(item => `${item.label} ${format(item.value)} (${percent(item.value)}%)`).join(', ')}`;

  if (mode === 'bar') {
    return (
      <div className="space-y-4" role="img" aria-label={summary}>
        {items.map(item => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex justify-between gap-2 text-xs font-mono">
              <span className="text-matcha-text truncate">{item.label}</span>
              <span className="text-matcha-muted tabular-nums shrink-0">{format(item.value)} ({percent(item.value)}%)</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-matcha-bg overflow-hidden">
              <div style={{ width: `${percent(item.value)}%`, backgroundColor: item.color }} className="h-full rounded-full transition-all duration-500" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 min-[420px]:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] gap-5 items-center" role="img" aria-label={summary}>
      <Pie items={items} total={total} format={format} />
      <ul className="space-y-2.5">
        {items.map(item => (
          <li key={item.label} className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} aria-hidden="true" />
            <span className="text-matcha-text flex-1 min-w-0 truncate">{item.label}</span>
            <span className="text-matcha-muted tabular-nums shrink-0">{format(item.value)} · {percent(item.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
