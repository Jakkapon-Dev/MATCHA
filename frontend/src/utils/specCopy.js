/* Product specifications, in the language the visitor is reading.

   The spec records were written in Thai only. They are sample data built from a
   small set of templates, so every string they contain is listed here with its
   English, and an English reader no longer meets Thai in the size guide, the
   care list or the product record.

   Strings written as "Thai (English)" — size-guide headers, care lines — give
   their English part. Anything unlisted is shown as stored rather than hidden.
   Thai readers get the record unchanged. */

const EN = {
  'ข้อมูลตัวอย่าง รอยืนยันจากร้าน': "Sample data, awaiting the studio's confirmation",
  'สเปกสินค้าและตารางวัดขนาดนี้เป็นข้อมูลตัวอย่างเพื่อการทดสอบระบบ อยู่ระหว่างรอยืนยันสเปกจริงอย่างเป็นทางการจากทางร้าน':
    "These specifications and size charts are sample data used to test the shop, awaiting the studio's official confirmation.",
  'ผ้าฝ้ายผสมทอพิเศษ (ข้อมูลตัวอย่าง รอยืนยันจากร้าน)': 'Specially woven cotton blend (sample data, awaiting confirmation)',
  'วัสดุสังเคราะห์และหนังมาตรฐาน (ข้อมูลตัวอย่าง รอยืนยันจากร้าน)': 'Standard synthetics and leather (sample data, awaiting confirmation)',
  'วัสดุธรรมชาติ/โลหะมาตรฐาน (ข้อมูลตัวอย่าง รอยืนยันจากร้าน)': 'Natural materials and standard metal (sample data, awaiting confirmation)',
  'ผ้าฝ้ายทวิล 98% · อีลาสเทน 2% · น้ำหนักผ้า 285 gsm': '98% cotton twill · 2% elastane · 285 gsm',
  'ผ้าฝ้ายคอมบ์ 80% · โพลีเอสเตอร์รีไซเคิล 20% · น้ำหนักผ้า 320 gsm': '80% combed cotton · 20% recycled polyester · 320 gsm',
  'หนังวัวแท้ชั้นบน · พื้นยางธรรมชาติ · ซับในผ้าฝ้าย': 'Top-grain cowhide · natural rubber sole · cotton lining',
  'เปลือกนอกไนลอนรีไซเคิล 100% · ซับในผ้าฝ้าย 100% · เคลือบกันน้ำ DWR ปลอด PFC': '100% recycled nylon shell · 100% cotton lining · PFC-free DWR finish',
  'หนังวัวฟอกฝาด · อะไหล่ทองเหลืองชุบกันสนิม': 'Vegetable-tanned cowhide · rust-proofed brass hardware',
  'โปรตุเกส — เมืองปอร์ตู': 'Portugal — Porto',
  'ไทย — กรุงเทพมหานคร': 'Thailand — Bangkok',
  'ญี่ปุ่น — จังหวัดวากายามะ': 'Japan — Wakayama',
  'ญี่ปุ่น — จังหวัดโอกายามะ': 'Japan — Okayama',
  'เวียดนาม — นครโฮจิมินห์': 'Vietnam — Ho Chi Minh City',
  'นายแบบสูง 183 cm · รอบเอว 79 cm · ความยาวขา 81 cm — สวมไซซ์ L': 'Model is 183 cm · waist 79 cm · inseam 81 cm — wears size L',
  'นายแบบสูง 183 cm · รอบอก 94 cm · รอบเอว 78 cm — สวมไซซ์ L': 'Model is 183 cm · chest 94 cm · waist 78 cm — wears size L',
  'นายแบบสูง 183 cm · รอบอก 94 cm — สวมไซซ์ L ทับเสื้อชั้นใน': 'Model is 183 cm · chest 94 cm — wears size L over a base layer',
  'นายแบบสวมไซซ์ EU 42 — ความยาวเท้า 26.5 cm': 'Model wears EU 42 — foot length 26.5 cm',
  'ไซซ์เดียว (One Size) — ไม่อ้างอิงสัดส่วนนายแบบ': 'One size — no model measurements apply',
  'ทรงเฉพาะตามดีไซน์คอลเลกชัน สวมใส่สบายคล่องตัว': "Cut to the collection's own shape; comfortable and easy to move in",
  'ความกว้างมาตรฐาน (D/B) รองรับรูปเท้าคนเอเชีย แนะนำเลือกตรงไซซ์ปกติ': 'Standard width (D/B), suited to Asian foot shapes. Take your usual size.',
  'ขนาดมาตรฐาน (One Size) ออกแบบให้ใช้งานและปรับระดับได้สะดวก': 'One size, designed to be easy to use and adjust',
  'ใช้แปรงขนนุ่มปัดฝุ่นและสิ่งสกปรกออกเป็นประจำ': 'Brush off dust and dirt regularly with a soft brush',
  'เช็ดทำความสะอาดด้วยผ้าชุบน้ำหมาดและสบู่อ่อน': 'Wipe clean with a damp cloth and mild soap',
  'ห้ามซักด้วยเครื่องซักผ้าหรือแช่น้ำ': 'Do not machine wash or soak',
  'ผึ่งลมในที่ร่มจนแห้งสนิท หลีกเลี่ยงความร้อนสูง': 'Air dry fully in the shade; keep away from high heat',
  'เช็ดทำความสะอาดด้วยผ้านุ่มแห้ง': 'Wipe clean with a soft dry cloth',
  'หลีกเลี่ยงการสัมผัสสารเคมี น้ำหอม หรือสเปรย์โดยตรง': 'Keep away from chemicals, perfume and sprays',
  'เก็บในถุงผ้ากันฝุ่นในที่แห้งและถ่ายเทสะดวก': 'Store in a dust bag somewhere dry and well ventilated',
  'ความยาวเท้า (cm)': 'Foot length (cm)',
  'วัดรอบเอวบริเวณที่สวมกางเกงปกติ และวัดสะโพกบริเวณจุดที่กว้างที่สุด แนบสายวัดแต่ไม่รัดแน่น':
    'Measure the waist where you normally wear trousers and the hips at their widest point, keeping the tape snug but not tight.',
  'วัดรอบอกบริเวณจุดที่กว้างที่สุดใต้รักแร้ และวัดความยาวจากจุดสูงสุดของไหล่ลงมาถึงชายเสื้อ':
    'Measure the chest at its widest point under the arms, and the length from the highest point of the shoulder down to the hem.',
  'วางฝ่าเท้าบนกระดาษ ยืนลงน้ำหนักเต็มที่ ขีดเส้นจุดปลายนิ้วที่ยาวที่สุดและส้นเท้า วัดความยาวเป็นเซนติเมตร':
    'Stand on a sheet of paper with your full weight, mark the tip of your longest toe and your heel, and measure the length in centimetres.',
  'ขนาดมาตรฐานสากล': 'Standard international sizing',
  'สินค้าหมวด Accessories & Bags เป็นขนาด One Size ออกแบบให้เข้ากับสรีระทั่วไป': 'Accessories and bags are one size, designed to suit most builds.',
  'รอบศีรษะ 55-60 cm (ยืดหยุ่นตามรูปศีรษะ)': 'Head circumference 55–60 cm (stretches to fit)',
  'ความกว้างเลนส์ 52 mm • สะพานแว่น 19 mm • ขาแว่น 145 mm': 'Lens width 52 mm • bridge 19 mm • temple 145 mm',
  'กว้าง 36 cm × สูง 28 cm × ลึก 12 cm (สายสะพายปรับได้ 85-130 cm)': '36 cm wide × 28 cm high × 12 cm deep (adjustable strap 85–130 cm)',
  'ความยาวสร้อย 45 cm (+ โซ่ปรับระดับ 5 cm)': 'Chain length 45 cm (+ 5 cm extender)',
  'ความยาวฝ่ามือ 19-22 cm (Free Size ยืดหยุ่น)': 'Hand length 19–22 cm (stretch, free size)'
};

const THAI = /[฀-๿]/;
// "ซักเครื่องด้วยน้ำเย็น โหมดถนอมผ้า (Cold gentle wash)" -> "Cold gentle wash"
const TRAILING_ENGLISH = /^[^()]*[฀-๿][^()]*\(([A-Za-z][^()฀-๿]*)\)\s*$/;

export function specText(value, lang) {
  if (lang !== 'en' || typeof value !== 'string' || !THAI.test(value)) return value;
  if (EN[value]) return EN[value];
  const trailing = value.match(TRAILING_ENGLISH);
  return trailing ? trailing[1].trim() : value;
}

function localize(value, lang) {
  if (typeof value === 'string') return specText(value, lang);
  if (Array.isArray(value)) return value.map((v) => localize(v, lang));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localize(v, lang)]));
  }
  return value;
}

export function localizeSpecs(specs, lang) {
  if (!specs || lang !== 'en') return specs;
  const out = localize(specs, lang);
  if (specs.statusLabelEn) out.statusLabel = specs.statusLabelEn;
  return out;
}

// Exposed for the test that keeps this list complete.
export const SPEC_TRANSLATIONS = EN;
