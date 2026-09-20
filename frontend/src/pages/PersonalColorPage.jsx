import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useChangeMotion from '../hooks/useChangeMotion';
import { handleImageError, webpSrc } from '../utils/imageFallback';
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
import { useLanguage } from '../context/LanguageContext.jsx';
// Same contrast and edge rules the catalogue's dye bars use, so a colour named
// on itself is legible here exactly as it is there.
import { inkOn, needsEdge, dyesForSeason } from '../utils/dye';
import { useDyeArchive } from '../features/catalog/useDyeArchive';

// 4 Master Personal Color Profiles with Grounded Theory
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];


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
    return SEASONS.includes(stored) ? stored : null;
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
    image: '/images/personal_test/undertone.jpg',
    icon: <Droplet size={18} className="text-matcha-primary" />,
    options: [
      { 
        letter: 'A',
        score: 'Warm', 
        weight: 2,
        image: '/images/personal_test/warm-skin.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B',
        score: 'Cool', 
        weight: 2,
        image: '/images/personal_test/cool-skin.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'C',
        score: 'Neutral', 
        weight: 2,
        image: '/images/personal_test/neutral-skin.jpg',
        imagePosition: '0% center'
      }
    ]
  },
  {
    id: 2,
    image: '/images/personal_test/acc.jpg',
    icon: <Sun size={18} className="text-matcha-accent" />,
    options: [
      { 
        letter: 'A', 
        score: 'Warm', 
        weight: 2,
        image: '/images/personal_test/acc-gold.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B', 
        score: 'Cool', 
        weight: 2,
        image: '/images/personal_test/acc-silver.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'C', 
        score: 'Neutral', 
        weight: 1,
        image: '/images/personal_test/acc-gold-silver.jpg',
        imagePosition: '0% center'
      }
    ]
  },
  {
    id: 3,
    image: '/images/personal_test/skin.jpg',
    icon: <Sun size={18} className="text-amber-600" />,
    options: [
      { 
        letter: 'A', 
        score: 'Warm', 
        weight: 2,
        image: '/images/personal_test/tans-easily.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B', 
        score: 'Cool', 
        weight: 2,
        image: '/images/personal_test/burn-easily.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'C', 
        score: 'Neutral', 
        weight: 1,
        image: '/images/personal_test/skin-neutral.jpg',
        imagePosition: '0% center'
      }
    ]
  },
  {
    id: 4,
    image: '/images/personal_test/fabric.jpg',
    icon: <Layers size={18} className="text-matcha-primary" />,
    options: [
      { 
        letter: 'A', 
        score: 'Warm', 
        weight: 2,
        image: '/images/personal_test/fabric-warm.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B', 
        score: 'Cool', 
        weight: 2,
        image: '/images/personal_test/fabric-cool.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'C', 
        score: 'Neutral', 
        weight: 1,
        image: '/images/personal_test/fabric-neutral.jpg',
        imagePosition: '0% center'
      }
    ]
  },
  {
    id: 5,
    image: '/images/personal_test/intensity-tone.jpg',
    icon: <Eye size={18} className="text-matcha-text" />,
    options: [
      { 
        letter: 'A', 
        score: 'Spring', 
        weight: 3,
        image: '/images/personal_test/intensity-spring.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'B', 
        score: 'Summer', 
        weight: 3,
        image: '/images/personal_test/intensity-summer.jpg',
        imagePosition: '0% center' 
      },
      { 
        letter: 'C', 
        score: 'Autumn', 
        weight: 3,
        image: '/images/personal_test/intensity-autumnn.jpg',
        imagePosition: '0% center'
      },
      { 
        letter: 'D', 
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
function PaletteBand({ palette, innerRef, emptyLabel }) {
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
            // Pure white and the palest creams would otherwise dissolve into
            // the page and read as a missing swatch rather than a pale one.
            boxShadow: needsEdge(colour.hex) ? 'inset 0 0 0 1px #DCDCDC' : undefined,
          }}
        >
          <span className="font-mono text-[11px] uppercase tracking-wider leading-tight group-hover:underline underline-offset-4">
            {colour.name}
          </span>
          {/* How many garments carry it, rather than the hex — a number the
              visitor can act on instead of one only a screen can use. */}
          <span className="font-mono text-[10px] opacity-70 mt-0.5 tabular-nums">
            {colour.count}
          </span>
        </Link>
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
function ColorAxis({ season, reading, dyes }) {
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
      <div className="border border-matcha-border">
        {rows.map((band) => (
          <div key={band} className="grid grid-cols-2 border-b border-matcha-border last:border-b-0">
            {columns.map((tone) => {
              const cellSeason = seasonAt(tone, band);
              const isYours = cellSeason === season;
              const inBand = band === depth;
              return (
                <div
                  key={tone}
                  className={`relative p-4 sm:p-5 border-r border-matcha-border last:border-r-0 transition-colors ${
                    isYours ? 'bg-[#0A0A0A] text-matcha-bg' : inBand ? 'bg-white' : ''
                  }`}
                >
                  <span className={`font-mono text-[10px] uppercase tracking-[0.18em] block ${
                    isYours ? 'text-matcha-bg/60' : 'text-[#999999]'
                  }`}>
                    {tone} · {band}
                  </span>
                  <span className={`font-bold text-lg sm:text-xl block mt-1 ${
                    isYours ? 'text-matcha-bg' : 'text-matcha-muted'
                  }`}>
                    {cellSeason}
                  </span>

                  {/* Every season's own colours, so the board is itself a
                      comparison rather than four labelled boxes. */}
                  <span className="flex mt-3 h-2">
                    {dyesForSeason(dyes, cellSeason).map((c) => (
                      <span key={c.name} className="flex-1" style={{ backgroundColor: c.hex }} />
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
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-2">
          <span>Cool</span>
          <span className="text-[#0A0A0A]">Undertone</span>
          <span>Warm</span>
        </div>

        <div className="flex items-end gap-1" role="img" aria-label={
          diff === null
            ? t('quiz.undertoneAria', { tone: axis.tone })
            : t('quiz.undertoneLevelAria', {
                tone: t(diff > 0 ? 'quiz.warm' : diff < 0 ? 'quiz.cool' : 'quiz.balanced'),
                score: Math.abs(diff),
                max: UNDERTONE_MAX,
              })
        }>
          {Array.from({ length: UNDERTONE_STEPS }).map((_, i) => {
            const isMark = i === tickIndex;
            const isMiddle = i === (UNDERTONE_STEPS - 1) / 2;
            return (
              <span
                key={i}
                className={`flex-1 transition-all ${
                  isMark ? 'h-10 bg-matcha-accent' : isMiddle ? 'h-5 bg-[#999999]' : 'h-3 bg-matcha-border'
                }`}
              />
            );
          })}
        </div>

        {diff === null ? (
          <p className="mt-3 font-mono text-[11px] text-matcha-muted">
            {t('quiz.savedNote')}
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-[11px] text-matcha-muted">
            <span>
              {t('quiz.warm')} <span className="text-[#0A0A0A] tabular-nums">{reading.warm}</span>
              <span className="mx-1.5">·</span>
              {t('quiz.cool')} <span className="text-[#0A0A0A] tabular-nums">{reading.cool}</span>
              <span className="mx-1.5">·</span>
              {t('quiz.outOf')} <span className="text-[#0A0A0A] tabular-nums">{UNDERTONE_MAX}</span>
            </span>
            <span>
              {t('quiz.depthFromQ5', { depth })}
            </span>
          </div>
        )}

        {/* A tie is the one result worth saying out loud: it means the
            undertone questions did not decide this, question 5 did. */}
        {diff === 0 && (
          <p className="mt-2 text-sm text-[#0A0A0A] leading-relaxed max-w-prose">
            {t('quiz.tiedScores')}{' '}
            {t('quiz.compareOther', { season: seasonAt(axis.tone === 'Warm' ? 'Cool' : 'Warm', depth) })}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PersonalColorPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  // The reading answers with colours the shop actually dyes, so the archive is
  // read here rather than a palette being written by hand.
  const { dyes } = useDyeArchive();

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
      showToast(t('colorLab.resultToast', { season: t(`seasons.${finalSeason}.name`) }));
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


  const profile = diagnosedSeason ? t(`seasons.${diagnosedSeason}`) : null;
  const theory = t(`seasons.${selectedSeasonTab}`);

  return (
    <div className="w-full bg-matcha-bg min-h-screen py-10 sm:py-16 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14">

        {/* 1. HEADER. Left-aligned under a masthead rule, matching the
            catalogue and the lookbook. The centred pill that used to sit above
            the title — an icon, a border and a tracked-out line of capitals —
            said nothing the title does not, and centring it was the one layout
            every page of this kind arrives at by default. */}
        <header className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[#0A0A0A] font-mono text-[11px] uppercase tracking-[0.18em] text-matcha-muted">
            <span className="text-[#0A0A0A] font-bold">{t('quiz.eyebrow')}</span>
            <span>{SEASONS.length} seasons</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0A0A0A] tracking-tight leading-[1.05]">
              {t('quiz.heroTitle')}
            </h1>
            <p className="text-matcha-muted text-sm sm:text-base leading-relaxed">
              {t('quiz.heroBody')}
            </p>
          </div>

          {/* Mode switch, set as reading matter like every other navigation on
              the site rather than as two filled pills. */}
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2" role="tablist" aria-label={t('quiz.modeTablistAria')}>
            <button
              role="tab"
              type="button"
              aria-selected={activeTab === 'quiz'}
              onClick={handleQuizTabClick}
              className={`font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                activeTab === 'quiz'
                  ? 'text-[#0A0A0A] font-bold underline underline-offset-[6px] decoration-2 decoration-matcha-accent'
                  : 'text-matcha-muted hover:text-[#0A0A0A]'
              }`}
            >
              {t('quiz.tabQuiz')}
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={activeTab === 'theory'}
              onClick={() => setActiveTab('theory')}
              className={`font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                activeTab === 'theory'
                  ? 'text-[#0A0A0A] font-bold underline underline-offset-[6px] decoration-2 decoration-matcha-accent'
                  : 'text-matcha-muted hover:text-[#0A0A0A]'
              }`}
            >
              {t('quiz.tabTheory')}
            </button>
          </div>
        </header>

        {/* 2. TAB CONTENT */}
        {activeTab === 'quiz' ? (
          <div>
            {!diagnosedSeason && !isScanning ? (
              /* The quiz takes the whole container. The photographs are the
                 question, so every pixel of width goes to making them big
                 enough to compare. */
              <div ref={quizAnchorRef} className="space-y-8 animate-fade-in">

                {/* Progress as five rules rather than a bar inside a panel:
                    the questions are countable, so show the count. */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-2">
                    <span>{t('quiz.progress', { n: currentStep + 1, total: QUIZ_QUESTIONS.length })}</span>
                    <span>{Math.round(((currentStep + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
                  </div>
                  <div
                    className="flex gap-1.5"
                    role="progressbar"
                    aria-valuemin={1}
                    aria-valuemax={QUIZ_QUESTIONS.length}
                    aria-valuenow={currentStep + 1}
                    aria-valuetext={t('quiz.progress', { n: currentStep + 1, total: QUIZ_QUESTIONS.length })}
                  >
                    {QUIZ_QUESTIONS.map((q, i) => (
                      <span
                        key={q.id}
                        className={`h-0.5 flex-1 transition-colors duration-300 ${
                          i <= currentStep ? 'bg-[#0A0A0A]' : 'bg-matcha-border'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div ref={questionMotionRef} className="space-y-8" aria-live="polite">
                  {/* Answering is a task, not a page to read down: one question
                      at a time, nothing else competing, so it is centred and
                      given the full width. The measure is still held for the
                      question itself — centred text is only readable in a
                      short line — while the photographs below take everything
                      the container has. */}
                  <div className="max-w-3xl mx-auto text-center">
                    <span className="font-mono text-[10px] font-bold uppercase text-matcha-accent tracking-[0.18em] flex items-center justify-center gap-1.5 mb-3">
                      {QUIZ_QUESTIONS[currentStep].icon}
                      <span>{t(`quiz.q${QUIZ_QUESTIONS[currentStep].id}.category`)}</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0A0A0A] leading-snug">
                      {t(`quiz.q${QUIZ_QUESTIONS[currentStep].id}.question`)}
                    </h2>
                    {t(`quiz.q${QUIZ_QUESTIONS[currentStep].id}.subtitle`) && (
                      <p className="text-xs sm:text-sm text-matcha-muted mt-3">
                        {t(`quiz.q${QUIZ_QUESTIONS[currentStep].id}.subtitle`)}
                      </p>
                    )}

                    {/* The setup illustration follows the question it sets up,
                        at a ratio of its own and deliberately modest — the
                        images that have to be compared are the ones below. */}
                    {QUIZ_QUESTIONS[currentStep].image && (
                      <div className="mt-6 mx-auto w-full max-w-sm aspect-16/10 overflow-hidden bg-[#E4E4E4]">
                        {/* `fetchpriority` is spelled lowercase here: React 18
                            does not map the camelCase form and passes it to the
                            DOM with a warning instead. */}
                        <img
                          src={webpSrc(QUIZ_QUESTIONS[currentStep].image)}
                          data-original-src={QUIZ_QUESTIONS[currentStep].image}
                          onError={handleImageError}
                          alt=""
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
                            className="group w-full h-full text-left cursor-pointer flex flex-col outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2 focus-visible:ring-offset-matcha-bg"
                          >
                            {option.image ? (
                              <span className="block w-full aspect-3/4 overflow-hidden bg-[#E4E4E4]">
                                <img
                                  src={webpSrc(option.image)}
                                  data-original-src={option.image}
                                  onError={handleImageError}
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

                            <span className="flex justify-center gap-2 pt-3 flex-1 text-center px-1">
                              <span className="font-mono text-xs text-[#999999] group-hover:text-matcha-accent transition-colors shrink-0">
                                {letter}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-[#0A0A0A] leading-snug group-hover:underline underline-offset-4 decoration-matcha-accent decoration-2">
                                {t(`quiz.q${QUIZ_QUESTIONS[currentStep].id}.${letter}`)}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {currentStep > 0 && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="font-mono text-xs uppercase tracking-wider text-matcha-muted hover:text-[#0A0A0A] cursor-pointer inline-flex items-center gap-1.5 outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                      >
                        {t('quiz.backToPrevious')}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : isScanning ? (
              /* A compass spinning on its axis illustrated nothing about
                 matching a skin tone. The wait says what it is doing. */
              <div className="max-w-xl py-24 space-y-3" role="status" aria-live="polite">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-accent">
                  {t('quiz.analysing')}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0A0A0A] leading-tight">
                  {t('quiz.analysingLong')}
                </h2>
                <p className="text-xs font-mono text-matcha-muted">
                  {t('quiz.analysingDetail')}
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
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-accent flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      <span>{t('quiz.resultTitle')}</span>
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-[#0A0A0A] tracking-tight leading-[1.05]">
                      {profile.name} — {profile.tagline}
                    </h2>
                    <p className="font-mono text-xs text-matcha-muted">
                      {profile.undertone}
                    </p>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetQuiz}
                      className="font-mono text-xs uppercase tracking-wider text-matcha-muted hover:text-[#0A0A0A] cursor-pointer flex items-center gap-1.5 transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                    >
                      <RotateCcw size={12} />
                      <span>{t('quiz.retake')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/mix-match')}
                      className="px-5 py-3 bg-matcha-accent hover:bg-matcha-accent-hover text-white font-mono text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                    >
                      <span>{t('quiz.toStudio')}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* The answer, at the size of an answer. */}
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-1">
                    {t('colorLab.paletteTitle')}
                  </h3>
                  <p className="text-xs text-matcha-muted mb-3 max-w-[58ch]">
                    {t('colorLab.paletteNote')}
                  </p>
                  {/* The answer is drawn from stock rather than from theory: a
                      page called "find your colour" that ends on six colours
                      the shop has never dyed is a dead end. */}
                  <PaletteBand
                    palette={dyesForSeason(dyes, diagnosedSeason)}
                    innerRef={paletteMotionRef}
                    emptyLabel={t('colorLab.paletteEmpty')}
                  />
                </div>

                {/* The working behind the verdict. The palette stays the
                    answer; this is the evidence for it. */}
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-3">
                    {t('quiz.axisTitle')}
                  </h3>
                  <ColorAxis season={diagnosedSeason} reading={reading} dyes={dyes} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
                  <div className="lg:col-span-7 space-y-6">
                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-2">
                        {t('quiz.skinTraits')}
                      </h4>
                      <p className="text-sm text-[#0A0A0A] leading-relaxed max-w-prose">
                        {profile.description}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-2">
                        {t('quiz.naturalCues')}
                      </h4>
                      <ul className="divide-y divide-matcha-border border-t border-matcha-border">
                        {profile.characteristics.map((c, i) => (
                          <li key={i} className="py-2.5 text-sm text-matcha-muted">{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-6">
                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-2">
                        {t('quiz.fabrics')}
                      </h4>
                      <p className="text-sm text-[#0A0A0A] leading-relaxed">
                        {profile.fabrics}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-accent mb-2">
                        {t('quiz.avoid')}
                      </h4>
                      <ul className="divide-y divide-matcha-border border-t border-matcha-border">
                        {profile.avoid.map((c, i) => (
                          <li key={i} className="py-2.5 text-sm text-matcha-muted">{c}</li>
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
            <nav aria-label={t('quiz.seasonNavAria')} className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pb-3 border-b border-matcha-border">
              {SEASONS.map((seasonKey) => (
                <button
                  key={seasonKey}
                  type="button"
                  aria-pressed={selectedSeasonTab === seasonKey}
                  onClick={() => setSelectedSeasonTab(seasonKey)}
                  className={`font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                    selectedSeasonTab === seasonKey
                      ? 'text-[#0A0A0A] font-bold underline underline-offset-[6px] decoration-2 decoration-matcha-accent'
                      : 'text-matcha-muted hover:text-[#0A0A0A]'
                  }`}
                >
                  {seasonKey}
                </button>
              ))}
            </nav>

            <div ref={seasonMotionRef} className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted">
                    The 12-Season Architecture
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-[#0A0A0A] tracking-tight leading-[1.05] mt-1">
                    {theory.name} — {theory.tagline}
                  </h3>
                </div>
                <span className="font-mono text-xs text-matcha-muted shrink-0">
                  {theory.undertone}
                </span>
              </div>

              <p className="text-sm text-[#0A0A0A] leading-relaxed max-w-prose">
                {theory.description}
              </p>

              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-3">
                  {t('colorLab.seasonPalette', { season: theory.name, n: dyesForSeason(dyes, selectedSeasonTab).length })}
                </h4>
                <PaletteBand
                  palette={dyesForSeason(dyes, selectedSeasonTab)}
                  emptyLabel={t('colorLab.paletteEmpty')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-muted mb-2">
                    จุดสังเกตตามธรรมชาติ
                  </h4>
                  <ul className="divide-y divide-matcha-border border-t border-matcha-border">
                    {theory.characteristics.map((c, i) => (
                      <li key={i} className="py-2.5 text-sm text-matcha-muted">{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-matcha-accent mb-2">
                    {t('quiz.avoid')}
                  </h4>
                  <ul className="divide-y divide-matcha-border border-t border-matcha-border">
                    {theory.avoid.map((c, i) => (
                      <li key={i} className="py-2.5 text-sm text-matcha-muted">{c}</li>
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
