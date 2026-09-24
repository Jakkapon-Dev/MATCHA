import React from 'react';

/**
 * ReactVibe-inspired BorderBeam:
 * Renders an animated luminous light ray that orbits around the border of any container.
 */
export default function BorderBeam({
  size = 200,
  duration = 12,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = '#C91D1D', // Terracotta
  colorTo = '#042509',   // Matcha Green
  delay = 0,
  className = '',
}) {
  const durationValue = typeof duration === 'number' ? `${duration}s` : duration;
  const delayValue = typeof delay === 'number' ? (delay !== 0 ? `-${delay}s` : '0s') : delay;

  return (
    <div
      style={{
        '--size': `${size}px`,
        '--duration': durationValue,
        '--anchor': `${anchor}%`,
        '--border-width': `${borderWidth}px`,
        '--color-from': colorFrom,
        '--color-to': colorTo,
        '--delay': delayValue,
      }}
      className={`pointer-events-none absolute inset-0 rounded-[inherit] border-[calc(var(--border-width))] border-transparent [mask-clip:padding-box,border-box] mask-intersect mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] ${className}`}
    >
      <div
        className="absolute aspect-square w-[calc(var(--size))] bg-linear-to-l from-(--color-from) via-(--color-to) to-transparent animate-border-beam"
        style={{
          offsetAnchor: 'calc(var(--anchor)) 50%',
          offsetPath: 'rect(0 auto auto 0 round calc(var(--size)))',
        }}
      />
    </div>
  );
}

export { BorderBeam };
