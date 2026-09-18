import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useChangeMotion from '../hooks/useChangeMotion';
import {
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Eye,
  Sun,
  Droplet,
  Layers
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
// Same contrast and edge rules the catalogue's dye bars use, so a colour named
// on itself is legible here exactly as it is there.
import { inkOn, needsEdge } from '../utils/dye';

// 4 Master Personal Color Profiles with Grounded Theory
const SEASON_PROFILES = {
  Spring: {
    season: 'Spring',
    thaiName: 'ฤดูใบไม้ผลิ (Warm & Bright)',
    undertone: 'Warm Undertone (โทนอุ่น)',
    description: 'ผิวโทนสว่างอมเหลือง มีความสดใส มีเลือดฝาด โทนสีที่ช่วยขับผิวให้เปล่งประกายคือเฉดสีสว่าง สดใส อบอุ่น แบบดอกไม้แรกแย้ม',
    characteristics: ['เส้นเลือดที่ข้อมือเห็นเป็นสีเขียว', 'ใส่เครื่องประดับทองขึ้นกว่าเงิน', 'ผิวออกแดดแล้วเปลี่ยนเป็นสีแทนทอง'],
    palette: [
      { name: 'Peach Coral', hex: '#FF7F50' },
      { name: 'Warm Cream', hex: '#FFFDD0' },
      { name: 'Matcha Sage', hex: '#8F9779' },
      { name: 'Honey Mustard', hex: '#E1AD01' },
      { name: 'Soft Turquoise', hex: '#40E0D0' },
      { name: 'Salmon Pink', hex: '#FA8072' }
    ],
    avoidColors: ['ดำสนิท (Pitch Black)', 'เทาหม่นเข้ม (Dark Charcoal)', 'ม่วงเข้ม (Deep Plum)'],
    recommendedFabrics: 'ผ้าลินินธรรมชาติ, ผ้าไหมสัมผัสนุ่ม, คอตตอนเนื้อโปร่งเบา'
  },
  Summer: {
    season: 'Summer',
    thaiName: 'ฤดูร้อน (Cool & Soft/Muted)',
    undertone: 'Cool Undertone (โทนเย็น)',
    description: 'ผิวโทนชมพูหรือขาวซีดที่มีความละมุน โทนสีที่เหมาะคือเฉดสีพาสเทล สีควันบุหรี่ สีหม่นที่มีอันเดอร์โทนฟ้า ช่วยให้หน้าดูขาวผ่อง สุภาพ อ่อนโยน',
    characteristics: ['เส้นเลือดที่ข้อมือเห็นเป็นสีน้ำเงินหรือม่วง', 'ใส่เครื่องประดับเงินหรือไวท์โกลด์ขึ้นมาก', 'ออกแดดแล้วผิวแดงง่าย ไหม้ง่าย'],
    palette: [
      { name: 'Lavender Mist', hex: '#E6E6FA' },
      { name: 'Sky Blue', hex: '#87CEEB' },
      { name: 'Mint Green', hex: '#98FF98' },
      { name: 'Dusty Rose', hex: '#DCAE96' },
      { name: 'Slate Grey', hex: '#708090' },
      { name: 'Powder Blue', hex: '#B0E0E6' }
    ],
    avoidColors: ['ส้มแสด (Bright Orange)', 'เหลืองมัสตาร์ด (Mustard)', 'น้ำตาลทอง (Golden Brown)'],
    recommendedFabrics: 'ผ้าชีฟอง, ผ้าคอตตอนเจอร์ซีย์, ลินินสีพาสเทลบางเบา'
  },
  Autumn: {
    season: 'Autumn',
    thaiName: 'ฤดูใบไม้ร่วง (Warm & Deep/Earth)',
    undertone: 'Warm Undertone (โทนอุ่นลึก)',
    description: 'ผิวโทนสองสี ผิวสีน้ำผึ้ง หรือผิวขาวเหลืองโทนเข้ม ดูสุขุมและอบอุ่น โทนสีที่เสริมความแพงและสง่างามคือ Earth Tone, สีเครื่องเทศ และโทนไม้',
    characteristics: ['เส้นเลือดเห็นเป็นสีเขียวชัดเจน', 'ใส่เครื่องประดับทองโบราณ (Antique Gold) หรือทองเหลืองแล้วดูขับผิวที่สุด', 'ผิวแทนสวยเมื่อโดนแดด'],
    palette: [
      { name: 'Burnt Orange', hex: '#C05C2B' },
      { name: 'Mustard Earth', hex: '#C29B38' },
      { name: 'Deep Olive', hex: '#556B2F' },
      { name: 'Warm Terracotta', hex: '#C91D1D' },
      { name: 'Espresso Brown', hex: '#4B3621' },
      { name: 'Matcha Forest', hex: '#042509' }
    ],
    avoidColors: ['สีนีออน (Vivid Neon)', 'ชมพูบาร์บี้ (Cool Magenta)', 'ขาวโอโม่สะท้อนแสง'],
    recommendedFabrics: 'ผ้าวูลหนานุ่ม (Merino Wool), ผ้าลูกฟูก (Corduroy), หนังกลับ (Suede)'
  },
  Winter: {
    season: 'Winter',
    thaiName: 'ฤดูหนาว (Cool & Vivid/High Contrast)',
    undertone: 'Cool Undertone (โทนเย็นจัดชัดเจน)',
    description: 'ผิวที่มีความคอนทราสต์สูง เช่น ผิวขาวจัดตัดกับผมดำขลับ หรือผิวเข้มโทนเย็น โทนสีที่สร้างความโดดเด่นคือสีสดชัด (Vivid) สีแม่สี และขาว-ดำคลาสสิก',
    characteristics: ['เส้นเลือดเห็นเป็นสีน้ำเงินชัดเจน', 'ใส่เครื่องประดับเงินหรือแพลทินัมแล้วดูคมสง่า', 'ผมและตามักมีสีดำขลับหรือน้ำตาลเข้มจัด'],
    palette: [
      { name: 'Cobalt Royal Blue', hex: '#002366' },
      { name: 'Charcoal Black', hex: '#232B2B' },
      { name: 'Emerald Green', hex: '#50C878' },
      { name: 'True Pure White', hex: '#FFFFFF' },
      { name: 'Ruby Red', hex: '#E0115F' },
      { name: 'Deep Indigo', hex: '#4B0082' }
    ],
    avoidColors: ['ส้มอิฐอมน้ำตาล (Muted Terracotta)', 'เหลืองดิน (Muddy Ochre)', 'เบจอมส้ม (Warm Beige)'],
    recommendedFabrics: 'ผ้าแคชเมียร์, ผ้าไหมซาตินเนื้อเงา, ผ้าสูททอแน่นระดับพรีเมียม'
  }
};

// ข้อ 5 บอก "ความเข้ม/คอนทราสต์" ส่วนข้อ 1-4 บอก "อันเดอร์โทน" — ต้องใช้ทั้งคู่ถึงจะได้ฤดูที่ถูก
const SEASON_DEPTH = { Spring: 'Light', Summer: 'Light', Autumn: 'Deep', Winter: 'Deep' };
const SEASON_BY_TONE = {
  Warm: { Light: 'Spring', Deep: 'Autumn' },
  Cool: { Light: 'Summer', Deep: 'Winter' }
};

const STORAGE_KEY = 'matcha_personal_color';
const READING_KEY = 'matcha_personal_color_reading';

// ค่าที่ค้างใน localStorage อาจเป็นของเวอร์ชันเก่าหรือถูกแก้มา ถ้าไม่ตรวจก่อนหน้าจะพังถาวร
const readStoredSeason = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SEASON_PROFILES[stored] ? stored : null;
  } catch {
    return null;
  }
};

/* The undertone axis, and what it can honestly resolve.

   Questions 1–4 each contribute +2 warm, +2 cool or nothing, so the difference
   between the two totals lands on one of nine steps from −8 to +8. That is a
   real axis and it is drawn as one.

   Depth is a different matter: only question 5 speaks to it, and only through
   SEASON_DEPTH, so it resolves to Light or Deep and nothing in between. It is
   drawn as two bands rather than a second continuous axis — a dot floating in
   a smooth 2D field would claim a precision this quiz never measured. */
const UNDERTONE_MAX = 8;
const UNDERTONE_STEPS = UNDERTONE_MAX + 1; // −8, −6 … +6, +8

// Where each season sits on the board, so the reading can be placed in it.
const SEASON_AXIS = {
  Spring: { tone: 'Warm', depth: 'Light' },
  Summer: { tone: 'Cool', depth: 'Light' },
  Autumn: { tone: 'Warm', depth: 'Deep' },
  Winter: { tone: 'Cool', depth: 'Deep' },
};

const readStoredReading = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(READING_KEY) || 'null');
    if (!raw || typeof raw.warm !== 'number' || typeof raw.cool !== 'number') return null;
    if (raw.depth !== 'Light' && raw.depth !== 'Deep') return null;
    return raw;
  } catch {
    return null;
  }
};

const QUIZ_QUESTIONS = [
  {
    id: 1,
    category: 'Undertone Test',
    question: 'ดูเส้นเลือดที่ข้อมือใต้แสงธรรมชาติ คุณเห็นเป็นสีอะไร?',
    subtitle: 'เลือกคำตอบที่ใกล้เคียงกับคุณที่สุด',
    image: '/images/personal_test/undertone.jpg',
    icon: <Droplet size={18} className="text-[#042509]" />,
    options: [
      { 
        letter: 'A',
        label: 'สีเขียวหรือเขียวขี้ม้า (Green / Olive)', 
        score: 'Warm', 
        weight: 2,
        image: '/images/personal_test/warm-skin.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B',
        label: 'น้ำเงินหรือม่วงชัดเจน (Blue / Purple)', 
        score: 'Cool', 
        weight: 2,
        image: '/images/personal_test/cool-skin.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'C',
        label: 'ผสมกันทั้งเขียวและน้ำเงิน (Blue-Green Neutral)', 
        score: 'Neutral', 
        weight: 2,
        image: '/images/personal_test/neutral-skin.jpg',
        imagePosition: '0% center'
      }
    ]
  },
  {
    id: 2,
    category: 'Jewelry Reflection Test',
    question: 'เมื่อสวมใส่เครื่องประดับ โลหะชนิดใดทำให้ผิวของคุณดูสว่างและเปล่งปลั่งที่สุด?',
    subtitle: 'สังเกตความเปล่งประกายของใบหน้าและผิวเมื่อทาบเครื่องประดับ',
    image: '/images/personal_test/acc.jpg',
    icon: <Sun size={18} className="text-[#C91D1D]" />,
    options: [
      { 
        letter: 'A', 
        label: 'ทองคำ / ทองเหลือง / Yellow Gold (ช่วยขับผิวให้ดูสดใส ไม่หมอง)', 
        score: 'Warm', 
        weight: 2,
        image: '/images/personal_test/acc-gold.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B', 
        label: 'เงิน / แพลทินัม / Silver / White Gold (ช่วยให้ผิวดูขาวผ่อง ดูคมชัด)', 
        score: 'Cool', 
        weight: 2,
        image: '/images/personal_test/acc-silver.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'C', 
        label: 'ใส่ได้ทั้งสองสี ดูดีพอๆ กัน', 
        score: 'Neutral', 
        weight: 1,
        image: '/images/personal_test/acc-gold-silver.jpg',
        imagePosition: '0% center'
      }
    ]
  },
  {
    id: 3,
    category: 'Sun & Tanning Reaction',
    question: 'เมื่อต้องอยู่กลางแดดจัดเป็นเวลานาน ผิวของคุณตอบสนองอย่างไร?',
    subtitle: 'สังเกตปฏิกิริยาของผิวหลังสัมผัสแสงแดดเป็นเวลาต่อเนื่อง',
    image: '/images/personal_test/skin.jpg',
    icon: <Sun size={18} className="text-amber-600" />,
    options: [
      { 
        letter: 'A', 
        label: 'ผิวเปลี่ยนเป็นสีแทนได้ง่าย ไม่ค่อยไหม้แดด (Tans Easily)', 
        score: 'Warm', 
        weight: 2,
        image: '/images/personal_test/tans-easily.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B', 
        label: 'ผิวไหม้แดง แสบง่าย และไม่ค่อยเปลี่ยนเป็นสีแทน (Burns Easily)', 
        score: 'Cool', 
        weight: 2,
        image: '/images/personal_test/burn-easily.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'C', 
        label: 'ผิวแดงเล็กน้อยในวันแรก แล้วค่อยๆ เปลี่ยนเป็นสีแทนในเวลาต่อมา', 
        score: 'Neutral', 
        weight: 1,
        image: '/images/personal_test/skin-neutral.jpg',
        imagePosition: '0% center'
      }
    ]
  },
  {
    id: 4,
    category: 'Fabric Color Contrast',
    question: 'ระหว่างเสื้อสีขาวนวล (Off-White/Ivory) กับ เสื้อสีขาวโอโม่สว่าง (Pure White) ตัวไหนใส่แล้วหน้าไม่ดูโทรม?',
    subtitle: 'เลือกสีเสื้อเชิ้ตหรือผ้าทาบที่ทำให้ใบหน้าดูสดใสที่สุด',
    image: '/images/personal_test/fabric.jpg',
    icon: <Layers size={18} className="text-[#042509]" />,
    options: [
      { 
        letter: 'A', 
        label: 'สีขาวนวล (Off-White / Cream) ทำให้ใบหน้าดูนวล อบอุ่น', 
        score: 'Warm', 
        weight: 2,
        image: '/images/personal_test/fabric-warm.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B', 
        label: 'สีขาวสว่างจัด (Pure Bright White) ทำให้ใบหน้าดูสว่าง คมชัด ไม่กลืน', 
        score: 'Cool', 
        weight: 2,
        image: '/images/personal_test/fabric-cool.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'C', 
        label: 'ดูเข้ากับใบหน้าได้ทั้งสองสี', 
        score: 'Neutral', 
        weight: 1,
        image: '/images/personal_test/fabric-neutral.jpg',
        imagePosition: '0% center'
      }
    ]
  },
  {
    id: 5,
    category: 'Contrast & Intensity',
    question: 'สีผมตามธรรมชาติ สีตา และริมฝีปากของคุณมีลักษณะอย่างไร?',
    subtitle: 'พิจารณาความเข้มอ่อนและความคมชัดตามธรรมชาติขององค์ประกอบใบหน้า',
    image: '/images/personal_test/intensity-tone.jpg',
    icon: <Eye size={18} className="text-[#000000]" />,
    options: [
      { 
        letter: 'A', 
        label: 'ผมน้ำตาลประกายทอง หรือตาสีน้ำตาลสว่าง มีความสดใส (Light & Bright)', 
        score: 'Spring', 
        weight: 3,
        image: '/images/personal_test/intensity-spring.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B', 
        label: 'ผมน้ำตาลหม่น ผิวอมชมพู ริมฝีปากสีชมพูระเรื่อ นุ่มนวล (Soft & Muted)', 
        score: 'Summer', 
        weight: 3,
        image: '/images/personal_test/intensity-summer.jpg',
        imagePosition: '0% center' 
      },
      { 
        letter: 'C', 
        label: 'ผมน้ำตาลเข้ม ตาสีน้ำตาลเข้มลึก ผิวสองสีอบอุ่น (Deep & Warm)', 
        score: 'Autumn', 
        weight: 3,
        image: '/images/personal_test/intensity-autumnn.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'D', 
        label: 'ผมดำสนิท ตาดำขลับ คอนทราสต์ตัดกับสีผิวชัดเจน (Vivid & Contrast)', 
        score: 'Winter', 
        weight: 3,
        image: '/images/personal_test/intensity-winter.jpg',
        imagePosition: '0% center' 
      }
    ]
  }
];

/* The palette, at the size the subject deserves.

   This page is called the Colour Lab and it used to show colour as six 20px
   dots parked in a panel in the corner — measured, 0.19% of the page was
   actually coloured, against twenty-five rounded chrome containers. The answer
   to "which colours are you" is the whole point of the quiz, so here it is the
   largest thing on the page: solid blocks carrying their own name and value,
   using the ink rule the catalogue's dye bars and the lookbook's palettes use,
   so all three pages describe colour the same way. */
function PaletteBand({ palette, innerRef }) {
  return (
    <div ref={innerRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {palette.map((colour, i) => (
        <div
          key={i}
          className="aspect-square sm:aspect-3/4 flex flex-col justify-end p-3 sm:p-4"
          style={{
            backgroundColor: colour.hex,
            color: inkOn(colour.hex),
            // Pure white and the palest creams would otherwise dissolve into
            // the page and read as a missing swatch rather than a pale one.
            boxShadow: needsEdge(colour.hex) ? 'inset 0 0 0 1px #DCDCDC' : undefined,
          }}
        >
          <span className="font-mono text-[11px] uppercase tracking-wider leading-tight">
            {colour.name}
          </span>
          <span className="font-mono text-[10px] opacity-60 mt-0.5">{colour.hex}</span>
        </div>
      ))}
    </div>
  );
}

/* The reading, drawn at the resolution the quiz actually has.

   Across: questions 1–4 each push +2 warm, +2 cool or nothing, so the result
   lands on one of nine ticks. Those ticks are drawn, and the marker sits on
   one of them — not between them, because nothing between them can be
   measured.

   Down: only question 5 speaks to depth, and only as Light or Deep. So depth
   is two bands, and the visitor's band is the one filled in. Drawing this as a
   second smooth axis with a dot floating in a field would look more scientific
   and would be a lie about the instrument. */
function ColorAxis({ season, reading }) {
  const axis = SEASON_AXIS[season];
  const depth = reading?.depth || axis.depth;

  // −8 … +8 in steps of 2. Negative is cool, positive is warm.
  const diff = reading ? reading.warm - reading.cool : null;
  const tickIndex = diff === null ? null : (diff + UNDERTONE_MAX) / 2;

  const rows = ['Light', 'Deep'];
  const columns = ['Cool', 'Warm'];

  // Which of the four seasons owns a given cell of the board.
  const seasonAt = (tone, band) =>
    Object.keys(SEASON_AXIS).find(
      (key) => SEASON_AXIS[key].tone === tone && SEASON_AXIS[key].depth === band
    );

  return (
    <div className="space-y-4">
      <div className="border border-[#DCDCDC]">
        {rows.map((band) => (
          <div key={band} className="grid grid-cols-2 border-b border-[#DCDCDC] last:border-b-0">
            {columns.map((tone) => {
              const cellSeason = seasonAt(tone, band);
              const isYours = cellSeason === season;
              const inBand = band === depth;
              return (
                <div
                  key={tone}
                  className={`relative p-4 sm:p-5 border-r border-[#DCDCDC] last:border-r-0 transition-colors ${
                    isYours ? 'bg-[#0A0A0A] text-[#F1F1F1]' : inBand ? 'bg-white' : ''
                  }`}
                >
                  <span className={`font-mono text-[10px] uppercase tracking-[0.18em] block ${
                    isYours ? 'text-[#F1F1F1]/60' : 'text-[#999999]'
                  }`}>
                    {tone} · {band}
                  </span>
                  <span className={`font-bold text-lg sm:text-xl block mt-1 ${
                    isYours ? 'text-[#F1F1F1]' : 'text-[#666666]'
                  }`}>
                    {cellSeason}
                  </span>

                  {/* Every season's own colours, so the board is itself a
                      comparison rather than four labelled boxes. */}
                  <span className="flex mt-3 h-2">
                    {SEASON_PROFILES[cellSeason].palette.map((c, i) => (
                      <span key={i} className="flex-1" style={{ backgroundColor: c.hex }} />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* The undertone scale, with the answer standing on its tick. */}
      <div>
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] mb-2">
          <span>Cool</span>
          <span className="text-[#0A0A0A]">Undertone</span>
          <span>Warm</span>
        </div>

        <div className="flex items-end gap-1" role="img" aria-label={
          diff === null
            ? `อันเดอร์โทน: ${axis.tone}`
            : `อันเดอร์โทน ${diff > 0 ? 'อุ่น' : diff < 0 ? 'เย็น' : 'ก้ำกึ่ง'} ที่ระดับ ${Math.abs(diff)} จาก ${UNDERTONE_MAX}`
        }>
          {Array.from({ length: UNDERTONE_STEPS }).map((_, i) => {
            const isMark = i === tickIndex;
            const isMiddle = i === (UNDERTONE_STEPS - 1) / 2;
            return (
              <span
                key={i}
                className={`flex-1 transition-all ${
                  isMark ? 'h-10 bg-[#C91D1D]' : isMiddle ? 'h-5 bg-[#999999]' : 'h-3 bg-[#DCDCDC]'
                }`}
              />
            );
          })}
        </div>

        {diff === null ? (
          <p className="mt-3 font-mono text-[11px] text-[#666666]">
            ผลนี้ถูกบันทึกไว้ก่อนหน้า จึงเหลือแต่ฤดู — ทำแบบทดสอบใหม่เพื่อดูคะแนนแต่ละแกน
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-[11px] text-[#666666]">
            <span>
              อุ่น <span className="text-[#0A0A0A] tabular-nums">{reading.warm}</span>
              <span className="mx-1.5">·</span>
              เย็น <span className="text-[#0A0A0A] tabular-nums">{reading.cool}</span>
              <span className="mx-1.5">·</span>
              เต็ม <span className="text-[#0A0A0A] tabular-nums">{UNDERTONE_MAX}</span>
            </span>
            <span>
              ความเข้มจากข้อ 5: <span className="text-[#0A0A0A]">{depth}</span>
            </span>
          </div>
        )}

        {/* A tie is the one result worth saying out loud: it means the
            undertone questions did not decide this, question 5 did. */}
        {diff === 0 && (
          <p className="mt-2 text-sm text-[#0A0A0A] leading-relaxed max-w-prose">
            คะแนนอุ่นกับเย็นเท่ากันพอดี — ฤดูนี้ตัดสินจากข้อ 5 เป็นหลัก คุณอยู่ก้ำกึ่งกับ{' '}
            <strong>{seasonAt(axis.tone === 'Warm' ? 'Cool' : 'Warm', depth)}</strong> ลองดูพาเลตต์ของทั้งสองฤดูเทียบกัน
          </p>
        )}
      </div>
    </div>
  );
}

export default function PersonalColorPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'theory' | 'palette'
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [diagnosedSeason, setDiagnosedSeason] = useState(readStoredSeason);
  // The scores behind the verdict, kept so the result can show where the answer
  // landed rather than only what it was called.
  const [reading, setReading] = useState(readStoredReading);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedSeasonTab, setSelectedSeasonTab] = useState(() => readStoredSeason() || 'Autumn');
  const quizAnchorRef = useRef(null);
  const questionMotionRef = useChangeMotion(`${activeTab}-${currentStep}-${diagnosedSeason}-${isScanning}`);
  const resultMotionRef = useChangeMotion(`${activeTab}-${diagnosedSeason}-${isScanning}`);
  const paletteMotionRef = useChangeMotion(`${activeTab}-${selectedSeasonTab}-${diagnosedSeason}-${isScanning}`, 'grid');
  const seasonMotionRef = useChangeMotion(`${activeTab}-${selectedSeasonTab}`);

  // Handle Option Click
  const handleSelectOption = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
    
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      calculateResult({ ...answers, [questionId]: option });
    }
  };

  // Calculate Result Algorithm
  // ข้อ 1-4 = อันเดอร์โทน (Warm/Cool/Neutral), ข้อ 5 = ความเข้ม/คอนทราสต์
  // ทั้งสองแกนต้องมาประกอบกันตามทฤษฎี 4 ฤดู ไม่ใช่ให้ข้อ 5 ตัดสินคนเดียว
  const calculateResult = (finalAnswers) => {
    setIsScanning(true);

    setTimeout(() => {
      let warmScore = 0;
      let coolScore = 0;
      let intensitySeason = null;

      Object.values(finalAnswers).forEach(ans => {
        const weight = ans.weight || 1;
        if (ans.score === 'Warm') warmScore += weight;
        else if (ans.score === 'Cool') coolScore += weight;
        else if (SEASON_DEPTH[ans.score]) intensitySeason = ans.score;
        // 'Neutral' ไม่เทน้ำหนักไปฝั่งไหน แต่ทำให้โอกาสเสมอสูงขึ้น = ให้ข้อ 5 ตัดสิน
      });

      const undertone =
        warmScore > coolScore ? 'Warm' :
        coolScore > warmScore ? 'Cool' : 'Neutral';

      let finalSeason;
      if (!intensitySeason) {
        // ไม่ควรเกิด (ข้อ 5 บังคับตอบ) แต่กันไว้ไม่ให้ผลลัพธ์หลุดเป็น undefined
        finalSeason = undertone === 'Cool' ? 'Winter' : 'Autumn';
      } else if (undertone === 'Neutral') {
        // อันเดอร์โทนก้ำกึ่ง — ข้อ 5 คือสัญญาณที่เจาะจงที่สุดที่มี
        finalSeason = intensitySeason;
      } else {
        finalSeason = SEASON_BY_TONE[undertone][SEASON_DEPTH[intensitySeason]];
      }

      /* The scores were being discarded the moment the verdict was named. They
         are the only record of how close the call was — a tie on the undertone
         axis decided by question 5 alone is a very different reading from a
         clean 8–0, and the visitor was told neither. Nothing here changes what
         finalSeason is; it only keeps the working. */
      const nextReading = {
        warm: warmScore,
        cool: coolScore,
        depth: SEASON_DEPTH[intensitySeason] || SEASON_AXIS[finalSeason].depth,
      };

      setDiagnosedSeason(finalSeason);
      setSelectedSeasonTab(finalSeason);
      setReading(nextReading);
      setIsScanning(false);
      try {
        localStorage.setItem(STORAGE_KEY, finalSeason);
        localStorage.setItem(READING_KEY, JSON.stringify(nextReading));
      } catch {
        // โหมดส่วนตัว/ปิด storage — ผลยังแสดงได้ แค่ไม่ถูกจำข้ามหน้า
      }
      showToast(`วิเคราะห์ผลสำเร็จ: โทนสีผิวของคุณคือ ${SEASON_PROFILES[finalSeason].thaiName} ✨`);
    }, 1200);
  };

  const handleResetQuiz = () => {
    setAnswers({});
    setCurrentStep(0);
    setDiagnosedSeason(null);
    setReading(null);
    // เลื่อนลงไปที่คำถามข้อแรก ไม่งั้นผู้ใช้ค้างอยู่หัวหน้าโดยไม่รู้ว่าแบบทดสอบเริ่มแล้ว
    requestAnimationFrame(() => {
      quizAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // ปุ่ม Diagnostic Quiz: ถ้ากำลังดูผลอยู่แล้วให้เริ่มทำใหม่ ไม่ใช่กดแล้วเงียบ
  const handleQuizTabClick = () => {
    if (activeTab === 'quiz' && diagnosedSeason) {
      handleResetQuiz();
      return;
    }
    setActiveTab('quiz');
  };


  const profile = diagnosedSeason ? SEASON_PROFILES[diagnosedSeason] : null;
  const theory = SEASON_PROFILES[selectedSeasonTab];

  return (
    <div className="w-full bg-[#F1F1F1] min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14">

        {/* 1. HEADER. Left-aligned under a masthead rule, matching the
            catalogue and the lookbook. The centred pill that used to sit above
            the title — an icon, a border and a tracked-out line of capitals —
            said nothing the title does not, and centring it was the one layout
            every page of this kind arrives at by default. */}
        <header className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[#0A0A0A] font-mono text-[11px] uppercase tracking-[0.18em] text-[#666666]">
            <span className="text-[#0A0A0A] font-bold">Artisan Personal Color Lab &amp; Styling Science</span>
            <span>{Object.keys(SEASON_PROFILES).length} seasons</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0A0A0A] tracking-tight leading-[1.05]">
              ค้นหาโทนสีผิวประจำตัว 4 ฤดูกาล
            </h1>
            <p className="text-[#666666] text-sm sm:text-base leading-relaxed">
              เลือกใส่เสื้อผ้าที่ขับออร่าของคุณด้วย <strong className="text-[#0A0A0A]">ทฤษฎี Personal Color สากล</strong> จำแนกตาม 4 ฤดู ช่วยให้ทุกชุดที่คุณสวมใส่เสริมบุคลิกและสะท้อนเสน่ห์ที่เป็นเอกลักษณ์
            </p>
          </div>

          {/* Mode switch, set as reading matter like every other navigation on
              the site rather than as two filled pills. */}
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2" role="tablist" aria-label="โหมดของ Personal Color Lab">
            <button
              role="tab"
              type="button"
              aria-selected={activeTab === 'quiz'}
              onClick={handleQuizTabClick}
              className={`font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                activeTab === 'quiz'
                  ? 'text-[#0A0A0A] font-bold underline underline-offset-[6px] decoration-2 decoration-[#C91D1D]'
                  : 'text-[#666666] hover:text-[#0A0A0A]'
              }`}
            >
              Diagnostic Quiz (แบบทดสอบสีผิว)
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={activeTab === 'theory'}
              onClick={() => setActiveTab('theory')}
              className={`font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                activeTab === 'theory'
                  ? 'text-[#0A0A0A] font-bold underline underline-offset-[6px] decoration-2 decoration-[#C91D1D]'
                  : 'text-[#666666] hover:text-[#0A0A0A]'
              }`}
            >
              Color Theory (ทฤษฎี 4 ฤดู)
            </button>
          </div>
        </header>

        {/* 2. TAB CONTENT */}
        {activeTab === 'quiz' ? (
          <div>
            {!diagnosedSeason && !isScanning ? (
              <div ref={quizAnchorRef} className="max-w-4xl space-y-8 animate-fade-in">

                {/* Progress as five rules rather than a bar inside a panel:
                    the questions are countable, so show the count. */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] mb-2">
                    <span>คำถามที่ {currentStep + 1} จาก {QUIZ_QUESTIONS.length}</span>
                    <span>{Math.round(((currentStep + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
                  </div>
                  <div
                    className="flex gap-1.5"
                    role="progressbar"
                    aria-valuemin={1}
                    aria-valuemax={QUIZ_QUESTIONS.length}
                    aria-valuenow={currentStep + 1}
                    aria-valuetext={`คำถามที่ ${currentStep + 1} จาก ${QUIZ_QUESTIONS.length}`}
                  >
                    {QUIZ_QUESTIONS.map((q, i) => (
                      <span
                        key={q.id}
                        className={`h-0.5 flex-1 transition-colors duration-300 ${
                          i <= currentStep ? 'bg-[#0A0A0A]' : 'bg-[#DCDCDC]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div ref={questionMotionRef} className="space-y-6" aria-live="polite">
                  {/* The question and its reference photograph, flat on the
                      page. */}
                  <div className={`flex flex-col md:flex-row items-stretch gap-6 ${QUIZ_QUESTIONS[currentStep].image ? '' : 'md:flex-col'}`}>
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="font-mono text-[10px] font-bold uppercase text-[#C91D1D] tracking-[0.18em] flex items-center gap-1.5 mb-3">
                        {QUIZ_QUESTIONS[currentStep].icon}
                        <span>{QUIZ_QUESTIONS[currentStep].category}</span>
                      </span>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0A0A0A] leading-snug">
                        {QUIZ_QUESTIONS[currentStep].question}
                      </h2>
                      {QUIZ_QUESTIONS[currentStep].subtitle && (
                        <p className="text-xs sm:text-sm text-[#666666] mt-3">
                          {QUIZ_QUESTIONS[currentStep].subtitle}
                        </p>
                      )}
                    </div>

                    {/* The setup illustration, at a ratio of its own rather
                        than stretched to whatever height the question text
                        happens to be — and smaller than the options below,
                        which are the images that actually have to be
                        compared. */}
                    {QUIZ_QUESTIONS[currentStep].image && (
                      <div className="w-full md:w-[260px] aspect-4/3 shrink-0 overflow-hidden bg-[#E4E4E4] self-start">
                        {/* `fetchpriority` is spelled lowercase here: React 18
                            does not map the camelCase form and passes it to the
                            DOM with a warning instead. */}
                        <img
                          src={QUIZ_QUESTIONS[currentStep].image}
                          alt={QUIZ_QUESTIONS[currentStep].question}
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                          loading={currentStep === 0 ? 'eager' : 'lazy'}
                          fetchpriority={currentStep === 0 ? 'high' : 'auto'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Every one of these questions asks the visitor to compare
                      photographs — wrists, gold against silver, warm cloth
                      against cool — so the photographs have to be side by side
                      and large enough to judge. As a vertical list the row
                      height followed the text, and a one-line answer squeezed
                      a portrait photograph into a 160x62 letterbox: the wrong
                      crop, the wrong axis, and far too small to compare. They
                      are all portrait originals, between 0.44 and 1.0, so the
                      tiles are portrait too. */}
                  <ul className={`grid grid-cols-2 gap-3 sm:gap-4 ${
                    QUIZ_QUESTIONS[currentStep].options.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
                  }`}>
                    {QUIZ_QUESTIONS[currentStep].options.map((option, idx) => {
                      const letter = option.letter || String.fromCharCode(65 + idx);
                      return (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleSelectOption(QUIZ_QUESTIONS[currentStep].id, option)}
                            className="group w-full h-full text-left cursor-pointer flex flex-col outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F1F1]"
                          >
                            {option.image ? (
                              <span className="block w-full aspect-3/4 overflow-hidden bg-[#E4E4E4]">
                                <img
                                  src={option.image}
                                  alt=""
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                  style={{ objectPosition: option.imagePosition || 'center' }}
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                />
                              </span>
                            ) : (
                              <span className="block w-full aspect-3/4 bg-[#E4E4E4]" />
                            )}

                            <span className="flex gap-2.5 pt-3 flex-1">
                              <span className="font-mono text-xs text-[#999999] group-hover:text-[#C91D1D] transition-colors shrink-0">
                                {letter}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-[#0A0A0A] leading-snug group-hover:underline underline-offset-4 decoration-[#C91D1D] decoration-2">
                                {option.label}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {currentStep > 0 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="font-mono text-xs uppercase tracking-wider text-[#666666] hover:text-[#0A0A0A] cursor-pointer inline-flex items-center gap-1.5 outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                    >
                      ← ย้อนกลับข้อก่อนหน้า
                    </button>
                  )}
                </div>

              </div>
            ) : isScanning ? (
              /* A compass spinning on its axis illustrated nothing about
                 matching a skin tone. The wait says what it is doing. */
              <div className="max-w-xl py-24 space-y-3" role="status" aria-live="polite">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C91D1D]">
                  กำลังวิเคราะห์
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0A0A0A] leading-tight">
                  กำลังวิเคราะห์ข้อมูล Personal Color...
                </h2>
                <p className="text-xs font-mono text-[#666666]">
                  ประมวลผลความสอดคล้องของ Undertone, Contrast และเฉดสีผ้า
                </p>
                <div className="flex gap-1.5 pt-3 max-w-xs">
                  {QUIZ_QUESTIONS.map((q) => (
                    <span key={q.id} className="h-0.5 flex-1 bg-[#0A0A0A]" />
                  ))}
                </div>
              </div>
            ) : (
              <div ref={resultMotionRef} className="space-y-10" aria-live="polite">

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-5 border-b border-[#0A0A0A]">
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C91D1D] flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      <span>ผลการวิเคราะห์สีผิวของคุณ</span>
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-[#0A0A0A] tracking-tight leading-[1.05]">
                      {profile.season} — {profile.thaiName}
                    </h2>
                    <p className="font-mono text-xs text-[#666666]">
                      {profile.undertone}
                    </p>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetQuiz}
                      className="font-mono text-xs uppercase tracking-wider text-[#666666] hover:text-[#0A0A0A] cursor-pointer flex items-center gap-1.5 transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                    >
                      <RotateCcw size={12} />
                      <span>ทำแบบทดสอบใหม่</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/mix-match')}
                      className="px-5 py-3 bg-[#C91D1D] hover:bg-[#A81515] text-white font-mono text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                    >
                      <span>ไปที่ Mix &amp; Match Studio</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* The answer, at the size of an answer. */}
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] mb-3">
                    Signature palette (สีที่ขับผิวที่สุด)
                  </h3>
                  <PaletteBand palette={profile.palette} innerRef={paletteMotionRef} />
                </div>

                {/* The working behind the verdict. The palette stays the
                    answer; this is the evidence for it. */}
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] mb-3">
                    ตำแหน่งของคุณบนสองแกน
                  </h3>
                  <ColorAxis season={diagnosedSeason} reading={reading} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
                  <div className="lg:col-span-7 space-y-6">
                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] mb-2">
                        ลักษณะเด่นของสีผิวคุณ
                      </h4>
                      <p className="text-sm text-[#0A0A0A] leading-relaxed max-w-prose">
                        {profile.description}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] mb-2">
                        จุดสังเกตตามธรรมชาติ
                      </h4>
                      <ul className="divide-y divide-[#DCDCDC] border-t border-[#DCDCDC]">
                        {profile.characteristics.map((c, i) => (
                          <li key={i} className="py-2.5 text-sm text-[#666666]">{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-6">
                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] mb-2">
                        เนื้อผ้าที่แนะนำ (Recommended Fabrics)
                      </h4>
                      <p className="text-sm text-[#0A0A0A] leading-relaxed">
                        {profile.recommendedFabrics}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C91D1D] mb-2">
                        สีที่ควรหลีกเลี่ยง (Avoid)
                      </h4>
                      <ul className="divide-y divide-[#DCDCDC] border-t border-[#DCDCDC]">
                        {profile.avoidColors.map((c, i) => (
                          <li key={i} className="py-2.5 text-sm text-[#666666]">{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        ) : (
          /* Theory: the same four palettes, read rather than diagnosed. */
          <div className="space-y-8 animate-fade-in">
            <nav aria-label="เลือกฤดูกาล" className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pb-3 border-b border-[#DCDCDC]">
              {Object.keys(SEASON_PROFILES).map((seasonKey) => (
                <button
                  key={seasonKey}
                  type="button"
                  aria-pressed={selectedSeasonTab === seasonKey}
                  onClick={() => setSelectedSeasonTab(seasonKey)}
                  className={`font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                    selectedSeasonTab === seasonKey
                      ? 'text-[#0A0A0A] font-bold underline underline-offset-[6px] decoration-2 decoration-[#C91D1D]'
                      : 'text-[#666666] hover:text-[#0A0A0A]'
                  }`}
                >
                  {seasonKey}
                </button>
              ))}
            </nav>

            <div ref={seasonMotionRef} className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666]">
                    The 12-Season Architecture
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-[#0A0A0A] tracking-tight leading-[1.05] mt-1">
                    {theory.season} — {theory.thaiName}
                  </h3>
                </div>
                <span className="font-mono text-xs text-[#666666] shrink-0">
                  {theory.undertone}
                </span>
              </div>

              <p className="text-sm text-[#0A0A0A] leading-relaxed max-w-prose">
                {theory.description}
              </p>

              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] mb-3">
                  เฉดสีประจำฤดูกาล {selectedSeasonTab} ({theory.palette.length} Colors)
                </h4>
                <PaletteBand palette={theory.palette} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666] mb-2">
                    จุดสังเกตตามธรรมชาติ
                  </h4>
                  <ul className="divide-y divide-[#DCDCDC] border-t border-[#DCDCDC]">
                    {theory.characteristics.map((c, i) => (
                      <li key={i} className="py-2.5 text-sm text-[#666666]">{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C91D1D] mb-2">
                    สีที่ควรหลีกเลี่ยง (Avoid)
                  </h4>
                  <ul className="divide-y divide-[#DCDCDC] border-t border-[#DCDCDC]">
                    {theory.avoidColors.map((c, i) => (
                      <li key={i} className="py-2.5 text-sm text-[#666666]">{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
