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

/* Hue, and how much colour there is at all, on 0–1 scales. A dye with almost
   no chroma is a neutral however light it is: Ivory, Silver, Charcoal and
   Black belong together in a column, not scattered through the spectrum. */
function hueOf(hex) {
  const rgb = toRgb(hex);
  if (!rgb) return { hue: 0, chroma: 0, light: 0 };
  const [r, g, b] = rgb.map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;

  let hue = 0;
  if (chroma) {
    if (max === r) hue = ((g - b) / chroma + 6) % 6;
    else if (max === g) hue = (b - r) / chroma + 2;
    else hue = (r - g) / chroma + 4;
    hue *= 60;
  }
  return { hue, chroma, light: (max + min) / 2 };
}

// Below this there is not enough colour left to place a dye on the wheel.
const NEUTRAL = 0.12;

/* Ordering the rail by stock count scatters near-identical dyes down the
   column, which is the one thing a colour index must not do. Ordered by hue
   instead, the rail unrolls the colour wheel and then runs the neutrals from
   white down to black, so neighbouring bands are genuinely neighbouring
   colours and the eye can find a shade by pointing rather than reading. */
export function sortDyes(dyes) {
  const chromatic = [];
  const neutral = [];

  for (const dye of dyes) {
    const geometry = hueOf(dye.hex);
    (geometry.chroma < NEUTRAL ? neutral : chromatic).push({ ...dye, ...geometry });
  }

  chromatic.sort((a, b) => a.hue - b.hue || b.light - a.light);
  neutral.sort((a, b) => b.light - a.light);

  return [...chromatic, ...neutral].map(({ hue, chroma, light, ...dye }) => ({
    ...dye,
    neutral: chroma < NEUTRAL,
  }));
}

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

  return sortDyes([...byName.values()]);
}

/** The variant matching a selected dye, so filtering shows the dye you picked. */
export function variantForDye(product, dye) {
  const variants = product?.variants?.length ? product.variants : [];
  if (!dye || dye === 'ALL') return variants[0] || null;
  return variants.find((v) => v?.color === dye) || variants[0] || null;
}

/* Which of the archive's dyes suit a personal-colour season.

   The colour lab used to answer with a hand-written palette — Peach Coral,
   Soft Turquoise, Matcha Sage — none of which the shop dyes. A page called
   "find your colour" that ends on six colours nobody can buy is a dead end,
   so the answer is drawn from the same 27 dyes the catalogue is built from.

   Two axes decide it, which is what personal-colour theory already uses:

   - Undertone. Whether a dye leans yellow or blue is the red-versus-blue
     channel comparison, the same test as looking at the veins in a wrist.
   - Depth. How light the dye sits, which separates Spring from Autumn on the
     warm side and Summer from Winter on the cool side.

   Neutrals carry almost no undertone, so they belong to whichever depth they
   match rather than to one temperature. */

const DEPTH_MIDPOINT = 0.5;

/* Warmth, decided by two signals rather than one.

   A warm dye falls away evenly from red through green to blue — Brown
   (92, 64, 51), Caramel, Mustard, Coral all share that ramp. Magentas break
   it by carrying more blue than green, which is what makes them read cool:
   Fuchsia is (194, 24, 91).

   That alone would misfile the deep warm reds, which are also red-blue-green
   in order: Crimson is (128, 0, 32). They are separated by how much blue is
   actually present — a quarter of the red in Crimson against nearly half in
   Fuchsia — so a dye off the ramp is still warm while its blue stays low. */
const LOW_BLUE = 0.35;

export function seasonFits(hex, season) {
  const rgb = toRgb(hex);
  if (!rgb) return false;
  const { chroma, light } = hueOf(hex);

  const isLight = light >= DEPTH_MIDPOINT;
  const neutral = chroma < NEUTRAL;
  const [red, green, blue] = rgb;

  /* Warmth is a yellow lean, and yellow is red and green together — so a warm
     dye keeps blue under green, and keeps red above blue so a blue-green does
     not slip through. Olive (85, 107, 47) passes both, Teal (0, 121, 107)
     fails the second, and Peach stays warm where a ratio against the strongest
     channel had called it cool for being pale. */
  const leansYellow = blue < green && red >= blue;

  // Deep reds sit off that pattern — Crimson is (128, 0, 32), its green gone —
  // but stay warm while almost no blue is present.
  const warm = leansYellow || blue <= red * LOW_BLUE;

  if (neutral) return isLight ? season === 'Spring' || season === 'Summer'
                              : season === 'Autumn' || season === 'Winter';

  if (warm) return isLight ? season === 'Spring' : season === 'Autumn';
  return isLight ? season === 'Summer' : season === 'Winter';
}

/** The archive's dyes for one season, hue-ordered, with their real counts. */
export function dyesForSeason(dyes, season) {
  return (dyes || []).filter((dye) => seasonFits(dye.hex, season));
}
