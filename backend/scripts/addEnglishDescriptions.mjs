/* Give every garment an English description alongside its Thai one.

   `description` is Thai on all 76 products, so an English-speaking visitor
   switching language still met a Thai paragraph on every product. The field
   stays as it is — it is the Thai copy — and `descriptionEn` is added beside
   it, which leaves every existing reader working and makes the addition
   reversible by dropping one field.

   These are written rather than translated: the Thai copy leans on phrases
   that read as filler in English ("เสริมเสน่ห์", "ทุกโอกาส"), so each line
   says what the garment is, what it is made of and when it earns its place,
   and stops. They are a first draft of brand voice and should be read by
   someone who owns that voice before they ship.

   Usage:
     node scripts/addEnglishDescriptions.mjs           # dry run, writes a backup
     node scripts/addEnglishDescriptions.mjs --apply   # writes the changes
*/

import 'dotenv/config';
import dns from 'node:dns';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const EN = {
  // Autumn
  'AUT-BOT-004': 'Straight-leg denim in a deep stonewash. Heavy enough to hold its shape, soft enough to wear all day.',
  'AUT-BOT-003': 'Relaxed chinos in a natural tone, cut straight through the leg. The pair you reach for when nothing else is decided.',
  'AUT-BOT-005': 'Tailored trousers in a premium weave. Formal in line, easy in wear, and built for layering.',
  'AUT-BOT-006': 'A softly falling skirt in the season\'s warm tones. Quiet cut, no ornament.',
  'AUT-TOP-009': 'An oversized hood in heavy brushed cotton, with a kangaroo pocket and drawcord. Japanese street cut.',
  'AUT-TOP-011': 'A long-sleeved shirt in a fine weave, cut relaxed. Wears alone or open over a tee.',
  'AUT-TOP-012': 'A soft knit crew with visible texture in the yarn. Warm without weight.',
  'AUT-OUT-010': 'A loose jacket with a sharp shoulder, twin zips and pockets that hold what you carry.',
  'AUT-ACC-001': 'A shoulder bag in earth tones with compartments that separate. Made for a day of moving around.',
  'AUT-ACC-002': 'A soft woven scarf with a quiet pattern. A layer of warmth that does not shout.',
  'AUT-ACC-007': 'An ankle boot with a round toe and a sole built for pavement. Contemporary, not rugged.',
  'AUT-ACC-008': 'A classic leather loafer with a cushioned bed. Slips on, goes with everything.',

  // Spring
  'SPR-BOT-015': 'Light-wash denim with a little give. Bright enough for the first warm week.',
  'SPR-BOT-016': 'Light woven trousers cut straight, breathable enough for a full day on your feet.',
  'SPR-BOT-017': 'Casual shorts in a pastel tone, cut close but not tight. For outdoors and days off.',
  'SPR-BOT-018': 'An A-line skirt in a bright tone, cut to move. Finished with care at the seams.',
  'SPR-TOP-021': 'A band-collar shirt with nothing on it. Clean lines, right for spring air.',
  'SPR-TOP-022': 'A fine-knit cardigan with wooden buttons. Just enough warmth for a cool morning.',
  'SPR-TOP-023': 'A soft piqué polo with a crisp collar. Smart enough for work, easy enough for after.',
  'SPR-TOP-024': 'A light cotton shirt that breathes, in colours that stay easy on the eye.',
  'SPR-ACC-013': 'A canvas and leather shoulder bag in pastel tones. Light to carry, holds more than it looks.',
  'SPR-ACC-014': 'A light scarf in soft colours, for the days that are warm but not yet hot.',
  'SPR-ACC-019': 'A casual loafer in a pale tone. Light, breathable, easy to put on.',
  'SPR-ACC-020': 'A low-top sneaker in a bright tone, on a rubber sole with real grip. Built for city walking.',

  // Summer
  'SUM-BOT-039': 'Lightly washed denim, thin enough for heat and still denim.',
  'SUM-BOT-040': 'Trousers in 100% linen, cut loose. Breathes, dries fast, creases honestly.',
  'SUM-BOT-041': 'Light shorts with an adjustable elastic waist. Beach and city both.',
  'SUM-BOT-042': 'A light skirt that catches the sea breeze. Made to feel cool.',
  'SUM-TOP-045': 'A soft cotton crop in a bright tone. Sits well with a high waist.',
  'SUM-TOP-046': 'An open-collar shirt for hot air, in a resort print that stays calm.',
  'SUM-TOP-047': 'A cotton crew tee that breathes. Nothing on it but the cut.',
  'SUM-TOP-048': 'A wide-neck tank that moves sweat. For heat and for moving in it.',
  'SUM-ACC-037': 'A wide-brimmed woven hat that keeps the sun off. Natural fibre, no logo.',
  'SUM-ACC-038': 'Classic sunglasses with UV400 lenses in a light frame. Wearable all day.',
  'SUM-ACC-043': 'A street sandal with adjustable straps on a soft, non-slip sole.',
  'SUM-ACC-044': 'A mesh sneaker that breathes and stays light. Made for hot weather.',

  // Winter
  'WIN-BOT-051': 'Heavy denim that holds warmth and takes wear. For the coldest weeks.',
  'WIN-BOT-052': 'Fleece-lined joggers. Warm, soft, and easy to move in on a slow day.',
  'WIN-BOT-053': 'Slacks in a thick wind-resistant weave. Smart enough for the office, easy enough for after.',
  'WIN-BOT-054': 'A straight wool-blend skirt, cut to fit. Warm and composed.',
  'WIN-TOP-058': 'An oversized hood in heavy brushed cotton with a warm lining. Made for travelling in.',
  'WIN-TOP-060': 'A thick crew knit with a classic cable. Soft against the skin.',
  'WIN-OUT-057': 'A long wool coat with a high collar against the wind. Sharply cut.',
  'WIN-OUT-059': 'A light down jacket that holds heat and packs down small.',
  'WIN-ACC-049': 'A thick knit beanie that sits close and keeps the wind out.',
  'WIN-ACC-050': 'Tightly knitted gloves with touchscreen fingertips, so you can keep them on.',
  'WIN-ACC-055': 'A lined winter boot on a deep-tread sole that grips wet ground.',
  'WIN-ACC-056': 'A water-resistant high-top that supports the ankle. High-street cut, winter build.',

  // Artisan
  'ART-TOP-026': 'A hand-stitched boot in cognac leather. A classic shape that softens to your foot.',
  'ART-TOP-027': 'A minimal coral handbag with a visible hand in the making. Adjustable strap.',
  'ART-TOP-028': 'A hand-woven blouse in coral, with a collar of its own shape. Drapes rather than hangs.',
  'ART-TOP-029': 'A coral sneaker made by hand, stitched close, on a sole that supports the arch.',
  'ART-TOP-030': 'A cream shoulder bag, plainly cut, with compartments inside. Goes with everything.',
  'ART-TOP-031': 'A brass necklace plated in gold. One clean line, nothing added.',
  'ART-TOP-032': 'A thick hand-woven sweater in mustard. The warm tone carries the piece.',
  'ART-TOP-033': 'A hand-woven skirt in peach with a high waist. Moves softly.',
  'ART-TOP-034': 'A natural silk scarf with a Japanese print. Smooth against the skin.',
  'ART-TOP-035': 'Sterling silver earrings in a geometric cut. Light enough to forget you have them on.',
  'ART-TOP-036': 'Tailored trousers in teal, cleanly cut and confidently shaped.',
  'ART-OUT-025': 'A long cobalt coat cut with an architect\'s eye. It holds its line from every angle.',

  // Lookbook pieces
  'LOOK-01-CARGO': 'Technical cargo trousers with strapping and utility pockets, cut from a hard-wearing fabric.',
  'LOOK-01-CROP': 'A metallic silver bustier with a sharp line. Cyber-street, deliberately loud.',
  'LOOK-01-JACKET': 'A longline holographic jacket built on high-end streetwear structure, in a fabric that shifts with the light.',
  'LOOK-02-BLAZER': 'An ivory linen blazer, sharply cut. Minimal, modern, and it breathes.',
  'LOOK-02-SHIRT': 'A relaxed linen shirt, soft and light. Casual with enough structure to dress up.',
  'LOOK-02-TROUSERS': 'Straight linen slacks in ivory. Plain, easy to match, cool to wear.',
  'LOOK-03-CAMISOLE': 'A white V-neck camisole, finely finished. Modern and easy to place.',
  'LOOK-03-CAPE': 'A white cape blazer with a draped fall. Minimal shape on contemporary structure.',
  'LOOK-03-TROUSERS': 'Ivory ankle trousers, cut straight and modern. Comfortable, well proportioned.',
  'LOOK-04-BLAZER': 'A tailored blazer in copper sequins that catch every light. Made for an evening.',
  'LOOK-04-TROUSERS': 'Wide-leg trousers in copper sequins, weighted so they fall well.',
  'LOOK-05-CARGO': 'Washed cargo trousers, tapered, with workwear side pockets. Hard-wearing and urban.',
  'LOOK-05-SWEATER': 'A charcoal cable knit in a heavy yarn. Warm, and a street classic that keeps.',
  'LOOK-06-SHIRT': 'A black crew tee in premium cotton. Minimal, durable, goes with anything.',
  'LOOK-06-SHORTS': 'Technical cargo shorts, light and active, cut for moving around a city.',
  'LOOK-06-VEST': 'An orange utility vest with pockets that work. Outdoor-street, ready for the day.',
};

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL;
if (!uri) {
  console.error('No MongoDB connection string in the environment.');
  process.exit(1);
}

/* Same SRV fallback as fixProductColors.mjs: this machine's resolver refuses
   the lookup that nslookup answers, so a public resolver is tried second. */
async function connect() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  } catch (err) {
    if (!/querySrv|ECONNREFUSED|ETIMEOUT|EAI_AGAIN/.test(String(err))) throw err;
    console.log('SRV lookup failed on the system resolver; retrying via 1.1.1.1 / 8.8.8.8');
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  }
}

await connect();
const products = mongoose.connection.collection('products');
const docs = await products.find({}).toArray();
console.log(`connected · ${docs.length} documents\n`);

const backupDir = path.resolve('storage');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `products-backup-${stamp}.json`);
fs.writeFileSync(backupPath, JSON.stringify(docs, null, 2));
console.log(`backup written: ${backupPath}\n`);

const ops = [];
const missing = [];

for (const doc of docs) {
  const english = EN[doc.id];
  if (!english) {
    missing.push(`${doc.id} · ${doc.name}`);
    continue;
  }
  if (doc.descriptionEn === english) continue;
  ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { descriptionEn: english } } } });
}

console.log(`to write : ${ops.length}`);
console.log(`unmatched: ${missing.length}`);
missing.forEach((m) => console.log('   ', m));

// A product left without English copy would silently fall back to Thai, which
// is the very thing this script exists to remove — so say so loudly.
const extra = Object.keys(EN).filter((id) => !docs.some((d) => d.id === id));
if (extra.length) {
  console.log(`\nids in this script with no product: ${extra.length}`);
  extra.forEach((e) => console.log('   ', e));
}

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write.');
} else if (ops.length) {
  const res = await products.bulkWrite(ops);
  console.log(`\napplied · ${res.modifiedCount} documents modified`);
} else {
  console.log('\nNothing to write.');
}

await mongoose.disconnect();
