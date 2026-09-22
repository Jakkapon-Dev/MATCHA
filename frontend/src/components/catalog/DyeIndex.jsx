import React from 'react';
import { wash, needsEdge } from '../../utils/dye';

/* The dye index: the catalogue's primary filter, and the only place on the
   page allowed to carry saturated colour.

   It replaces a pill row and a dropdown row with the thing those rows were
   describing. Every band is the dye itself at full strength, so choosing a
   colour means pointing at it rather than reading its name and trusting the
   label — which is the whole promise of a shop whose tagline is "find your
   match". The list is built from the products actually in the archive, so a
   dye with nothing behind it can never appear. */

function DyeBand({ dye, active, onSelect, total }) {
  const solid = dye.hex;
  const swatch = dye.name === 'ALL'
    ? null
    : { backgroundColor: solid, boxShadow: needsEdge(solid) ? 'inset 0 0 0 1px #DCDCDC' : undefined };

  return (
    <button
      type="button"
      onClick={() => onSelect(dye.name)}
      aria-pressed={active}
      className={`group block w-full text-left cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-inset ${
        active ? '' : 'hover:bg-white/70'
      }`}
      style={active ? { backgroundColor: wash(solid, 0.18) } : undefined}
    >
      <span className="flex items-baseline justify-between gap-3 px-3 pt-2">
        <span
          className={`font-mono text-[11px] tracking-wide uppercase truncate ${
            active ? 'text-[#0A0A0A] font-bold' : 'text-[#0A0A0A]'
          }`}
        >
          {dye.name === 'ALL' ? 'Every dye' : dye.name}
        </span>
        <span className="font-mono text-[11px] text-matcha-muted tabular-nums shrink-0">
          {dye.name === 'ALL' ? total : dye.count}
        </span>
      </span>

      {/* The band is the dye. It thickens when chosen, so the rail reads as a
          column of colour with one stripe pulled forward. */}
      <span
        className={`mt-1.5 block w-full transition-all duration-200 ${
          active ? 'h-5' : 'h-2.5 group-hover:h-3.5'
        }`}
        style={
          swatch || {
            // "Every dye" is drawn as the archive itself, in stock order.
            backgroundImage: dye.stripes,
          }
        }
      />
    </button>
  );
}

/* `variant` picks which of the two forms to render, and the caller places each
   one itself. They cannot ship together from a single element: the horizontal
   strip is a scroller whose content is wider than any screen, so as a sibling
   of the grid inside the page's flex row it claims its full content width and
   pushes the grid off the side. The strip belongs above the row, the rail
   inside it. */
export default function DyeIndex({ dyes, selected, onSelect, total, variant = 'rail' }) {
  // A hard-stop gradient across the real archive: no blending, just the dyes
  // laid end to end, so the "everything" band is a picture of the inventory.
  const stripes = React.useMemo(() => {
    if (!dyes.length) return 'linear-gradient(90deg, #DCDCDC, #DCDCDC)';
    const step = 100 / dyes.length;
    const stops = dyes.map((d, i) => `${d.hex} ${i * step}%, ${d.hex} ${(i + 1) * step}%`);
    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }, [dyes]);

  const all = { name: 'ALL', hex: '', count: total, stripes };

  if (variant === 'rail') {
    return (
      /* Desktop: a column the eye can run down, held in place while the grid
         scrolls past it. */
      <nav
        aria-label="Filter by dye"
        className="hidden lg:block sticky top-24 self-start w-48 shrink-0 border-t border-matcha-border"
      >
        <h2 className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted border-b border-matcha-border">
          Dye index
        </h2>
        <div className="divide-y divide-matcha-border max-h-[calc(100vh-11rem)] overflow-y-auto scrollbar-none">
          <DyeBand dye={all} active={selected === 'ALL'} onSelect={onSelect} total={total} />
          {dyes.map((dye, i) => (
            <React.Fragment key={dye.name}>
              {/* The spectrum ends and the undyed shades begin. Naming the
                  break stops the jump from violet to white reading as a
                  mistake in the ordering. */}
              {dye.neutral && !dyes[i - 1]?.neutral && (
                <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted">
                  Undyed
                </p>
              )}
              <DyeBand
                dye={dye}
                active={selected === dye.name}
                onSelect={onSelect}
                total={total}
              />
            </React.Fragment>
          ))}
        </div>
      </nav>
    );
  }

  return (
    /* On compact screens the index becomes a quiet horizontal ledger. */
    <nav aria-label="Filter by dye" className="lg:hidden -mx-4 px-4 mb-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-none border-y border-matcha-border py-2">
          {[all, ...dyes].map((dye) => {
            const active = selected === dye.name;
            const solid = dye.hex;
            return (
              <button
                key={dye.name}
                type="button"
                onClick={() => onSelect(dye.name)}
                aria-pressed={active}
                className={`flex shrink-0 items-center gap-2 px-2.5 py-2 cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-inset ${
                  active ? 'bg-[#0A0A0A] text-white' : 'text-[#0A0A0A] hover:bg-white/70'
                }`}
              >
                <span
                  className="block h-3 w-3 shrink-0 rounded-full"
                  style={
                    dye.name === 'ALL'
                      ? { backgroundImage: dye.stripes }
                      : {
                          backgroundColor: solid,
                          boxShadow: needsEdge(solid) ? 'inset 0 0 0 1px #DCDCDC' : undefined,
                        }
                  }
                />
                <span className="block max-w-20 truncate font-mono text-[10px] uppercase">
                  {dye.name === 'ALL' ? 'All' : dye.name}
                </span>
                <span className={`font-mono text-[9px] tabular-nums ${active ? 'text-white/60' : 'text-matcha-muted'}`}>
                  {dye.name === 'ALL' ? total : dye.count}
                </span>
              </button>
            );
          })}
      </div>
    </nav>
  );
}
