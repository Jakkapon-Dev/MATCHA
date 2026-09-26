import React from 'react';
import { Link } from 'react-router-dom';
import { inkOn, needsEdge } from '../../utils/dye';

/* The palette, at the size the subject deserves.
   Solid blocks carrying their own name and value, using the ink rule
   the catalogue's dye bars and the lookbook's palettes use. */
export default function PaletteBand({ palette = [], innerRef, emptyLabel }) {
  if (!palette.length) {
    return (
      <p ref={innerRef} className="max-w-[54ch] text-sm text-[#0A0A0A]/75">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div ref={innerRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {palette.map((colour) => (
        <Link
          key={colour.name}
          to={`/catalog?dye=${encodeURIComponent(colour.name)}`}
          aria-label={`${colour.name}, ${colour.count} ${colour.count === 1 ? 'garment' : 'garments'}`}
          className="group aspect-square sm:aspect-3/4 flex flex-col justify-end p-3 sm:p-4 outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-inset"
          style={{
            backgroundColor: colour.hex,
            color: inkOn(colour.hex),
            boxShadow: needsEdge(colour.hex) ? 'inset 0 0 0 1px #DCDCDC' : undefined,
          }}
        >
          <span className="font-mono text-[11px] uppercase tracking-wider leading-tight group-hover:underline underline-offset-4">
            {colour.name}
          </span>
          <span className="font-mono text-[10px] opacity-70 mt-0.5 tabular-nums">
            {colour.count}
          </span>
        </Link>
      ))}
    </div>
  );
}
