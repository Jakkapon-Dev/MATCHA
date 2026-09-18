/* Colour maths for the catalogue's dye index.

   The catalogue is organised by dye rather than by category, so a garment's
   colour has to be shown at full strength somewhere and used as a ground
   everywhere else. Full strength behind a photograph would swamp it, and a
   wash on its own would lie about the dye, so every tile carries both: a wash
   for the field and a solid bar for the truth. */

const PAPER = [241, 241, 241]; // #F1F1F1, the page ground

function toRgb(hex) {
  const clean = String(hex || '').replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (full.length !== 6 || /[^0-9a-f]/i.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

const toHex = (rgb) => '#' + rgb.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');

/** The dye mixed into the page ground. `amount` is how much dye survives. */
export function wash(hex, amount = 0.14) {
  const rgb = toRgb(hex);
  if (!rgb) return '#F1F1F1';
  return toHex(rgb.map((c, i) => PAPER[i] + (c - PAPER[i]) * amount));
}

/* Relative luminance, so a label sitting on a solid dye bar picks the side of
   the contrast it can actually be read against — Cream and Charcoal are both
   in this archive and they cannot share one text colour. */
export function isDark(hex) {
  const rgb = toRgb(hex);
  if (!rgb) return false;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.42;
}

/** Ink for text placed directly on a solid dye. */
export const inkOn = (hex) => (isDark(hex) ? '#F1F1F1' : '#0A0A0A');

/* Near-white dyes (White, Cream) vanish against the page and would read as a
   missing swatch rather than a pale one, so they get a hairline. */
export const needsEdge = (hex) => {
  const rgb = toRgb(hex);
  return rgb ? rgb.every((c) => c > 228) : false;
};

/** Every dye in a product set, with how many garments carry it. */
export function buildDyeIndex(products) {
  const byName = new Map();

  for (const product of products || []) {
    const variants = product?.variants?.length
      ? product.variants
      : [{ color: product?.color, colorHex: product?.colorHex }];

    // A garment offered in one dye across several variants is still one
    // garment: the rail counts pieces you can buy, not rows in the data.
    const counted = new Set();

    for (const variant of variants) {
      if (!variant?.color || !variant?.colorHex) continue;
      if (counted.has(variant.color)) continue;
      counted.add(variant.color);

      const entry = byName.get(variant.color)
        || { name: variant.color, hex: variant.colorHex, count: 0 };
      entry.count += 1;
      byName.set(variant.color, entry);
    }
  }

  return [...byName.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}

/** The variant matching a selected dye, so filtering shows the dye you picked. */
export function variantForDye(product, dye) {
  const variants = product?.variants?.length ? product.variants : [];
  if (!dye || dye === 'ALL') return variants[0] || null;
  return variants.find((v) => v?.color === dye) || variants[0] || null;
}
