import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useChangeMotion from '../hooks/useChangeMotion';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Eye, 
  BookOpen, 
  Palette, 
  Compass, 
  Sun, 
  Droplet, 
  Layers 
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

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

// ค่าที่ค้างใน localStorage อาจเป็นของเวอร์ชันเก่าหรือถูกแก้มา ถ้าไม่ตรวจก่อนหน้าจะพังถาวร
const readStoredSeason = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SEASON_PROFILES[stored] ? stored : null;
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

export default function PersonalColorPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'theory' | 'palette'
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [diagnosedSeason, setDiagnosedSeason] = useState(readStoredSeason);
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

      setDiagnosedSeason(finalSeason);
      setSelectedSeasonTab(finalSeason);
      setIsScanning(false);
      try {
        localStorage.setItem(STORAGE_KEY, finalSeason);
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


  return (
    <div className="w-full bg-[#F1F1F1] min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">

        {/* 1. HERO HEADER: Personal Color Studio */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div data-enter className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1F1F1] border border-[#042509]/20 text-[#042509] text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Artisan Personal Color Lab & Styling Science</span>
          </div>
          <h1 data-enter="wipe" style={{ '--enter-delay': '90ms' }} className="text-3xl sm:text-5xl font-black uppercase text-[#000000] tracking-tight font-serif">
            ค้นหาโทนสีผิวประจำตัว 4 ฤดูกาล
          </h1>
          <p data-enter style={{ '--enter-delay': '190ms' }} className="text-[#666666] text-sm sm:text-base leading-relaxed">
            เลือกใส่เสื้อผ้าที่ขับออร่าของคุณด้วย <strong>ทฤษฎี Personal Color สากล</strong> จำแนกตาม 4 ฤดู ช่วยให้ทุกชุดที่คุณสวมใส่เสริมบุคลิกและสะท้อนเสน่ห์ที่เป็นเอกลักษณ์
          </p>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center justify-center gap-2 pt-4" role="tablist" aria-label="โหมดของ Personal Color Lab">
            <button
              role="tab"
              aria-selected={activeTab === 'quiz'}
              onClick={handleQuizTabClick}
              className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-[#042509] text-white shadow-md'
                  : 'bg-white border border-[#DCDCDC] text-[#666666] hover:text-[#000000]'
              }`}
            >
              <Sparkles size={14} />
              <span>Diagnostic Quiz (แบบทดสอบสีผิว)</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'theory'}
              onClick={() => setActiveTab('theory')}
              className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'theory'
                  ? 'bg-[#042509] text-white shadow-md'
                  : 'bg-white border border-[#DCDCDC] text-[#666666] hover:text-[#000000]'
              }`}
            >
              <BookOpen size={14} />
              <span>Color Theory (ทฤษฎี 4 ฤดู)</span>
            </button>
          </div>
        </div>

        {/* 2. TAB CONTENT: Interactive Quiz vs Theory Guide */}
        {activeTab === 'quiz' ? (
          <div>
            {!diagnosedSeason && !isScanning ? (
              /* Quiz Questionnaire Card */
              <div ref={quizAnchorRef} className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                
                {/* Progress Bar */}
                <div className="bg-white rounded-2xl border border-[#DCDCDC] p-4 sm:p-5 shadow-xs">
                  <div className="flex justify-between text-xs font-mono text-[#666666] mb-2 font-bold">
                    <span>คำถามที่ {currentStep + 1} จาก {QUIZ_QUESTIONS.length}</span>
                    <span className="text-[#042509]">{Math.round(((currentStep + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
                  </div>
                  <div
                    className="w-full h-2 rounded-full bg-[#F1F1F1] overflow-hidden border border-[#DCDCDC]/60"
                    role="progressbar"
                    aria-valuemin={1}
                    aria-valuemax={QUIZ_QUESTIONS.length}
                    aria-valuenow={currentStep + 1}
                    aria-valuetext={`คำถามที่ ${currentStep + 1} จาก ${QUIZ_QUESTIONS.length}`}
                  >
                    <div 
                      className="h-full bg-[#042509] transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Current Question Container */}
                <div ref={questionMotionRef} className="space-y-6" aria-live="polite">
                  {/* Question Banner Card */}
                  {QUIZ_QUESTIONS[currentStep].image ? (
                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#DCDCDC] overflow-hidden shadow-sm flex flex-col md:flex-row items-stretch min-h-[220px]">
                      <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                        <span className="text-[11px] font-mono font-bold uppercase text-[#C91D1D] tracking-wider flex items-center gap-1.5 mb-2">
                          {QUIZ_QUESTIONS[currentStep].icon}
                          <span>{QUIZ_QUESTIONS[currentStep].category}</span>
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-[#000000] leading-snug">
                          {QUIZ_QUESTIONS[currentStep].question}
                        </h2>
                        {QUIZ_QUESTIONS[currentStep].subtitle && (
                          <p className="text-xs sm:text-sm text-[#6F655C] mt-2.5 font-sans">
                            {QUIZ_QUESTIONS[currentStep].subtitle}
                          </p>
                        )}
                      </div>
                      <div className="w-full md:w-[320px] lg:w-[350px] h-[200px] sm:h-[220px] md:h-auto shrink-0 self-stretch relative overflow-hidden bg-[#F1F1F1] flex items-center justify-center border-t md:border-t-0 md:border-l border-[#DCDCDC]/60">
                        <img 
                          src={QUIZ_QUESTIONS[currentStep].image} 
                          alt={QUIZ_QUESTIONS[currentStep].question}
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                          loading={currentStep === 0 ? 'eager' : 'lazy'}
                          fetchPriority={currentStep === 0 ? 'high' : 'auto'}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#DCDCDC] p-6 sm:p-8 shadow-sm">
                      <span className="text-[11px] font-mono font-bold uppercase text-[#C91D1D] tracking-wider flex items-center gap-1.5 mb-2">
                        {QUIZ_QUESTIONS[currentStep].icon}
                        <span>{QUIZ_QUESTIONS[currentStep].category}</span>
                      </span>
                      <h2 className="text-lg sm:text-2xl font-extrabold text-[#000000] leading-snug">
                        {QUIZ_QUESTIONS[currentStep].question}
                      </h2>
                      {QUIZ_QUESTIONS[currentStep].subtitle && (
                        <p className="text-xs sm:text-sm text-[#6F655C] mt-2 font-sans">
                          {QUIZ_QUESTIONS[currentStep].subtitle}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Options List (Vertical Stack) */}
                  <div className="flex flex-col gap-3.5">
                    {QUIZ_QUESTIONS[currentStep].options.map((option, idx) => {
                      const letter = option.letter || String.fromCharCode(65 + idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(QUIZ_QUESTIONS[currentStep].id, option)}
                          className="group w-full bg-white hover:bg-[#F1F1F1] border border-[#DCDCDC] hover:border-[#042509] rounded-2xl overflow-hidden text-left transition-all hover:shadow-md cursor-pointer flex items-stretch justify-between h-[105px] sm:h-[115px]"
                        >
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center min-w-0 pr-3">
                            <span className="text-xs font-mono font-bold text-[#6F655C] group-hover:text-[#042509] transition-colors mb-1">
                              {letter}
                            </span>
                            <span className="text-xs sm:text-sm md:text-base font-bold text-[#000000] leading-snug line-clamp-2">
                              {option.label}
                            </span>
                          </div>

                          {option.image ? (
                            <div className="w-32 sm:w-44 md:w-52 h-full shrink-0 border-l border-[#DCDCDC]/40 overflow-hidden relative bg-white flex items-center justify-center">
                              <img 
                                src={option.image} 
                                alt={option.label}
                                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                style={{ objectPosition: option.imagePosition || 'center' }}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="p-5 flex items-center">
                              <ArrowRight size={18} className="text-[#666666] group-hover:text-[#042509] group-hover:translate-x-1 transition-all" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Back button if step > 0 */}
                  {currentStep > 0 && (
                    <div className="pt-2">
                      <button
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="text-xs font-mono text-[#666666] hover:text-[#000000] font-bold cursor-pointer underline inline-flex items-center gap-1"
                      >
                        ← ย้อนกลับข้อก่อนหน้า
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : isScanning ? (
              /* Scanning Animation */
              <div className="max-w-md mx-auto py-20 text-center space-y-4 bg-white rounded-3xl border border-[#DCDCDC] p-8 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-[#F1F1F1] text-[#042509] flex items-center justify-center mx-auto animate-spin">
                  <Compass size={32} />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#000000]">กำลังวิเคราะห์ข้อมูล Personal Color...</h3>
                <p className="text-xs font-mono text-[#666666]">ประมวลผลความสอดคล้องของ Undertone, Contrast และเฉดสีผ้า</p>
              </div>
            ) : (
              /* Quiz Result Presentation Card */
              <div ref={resultMotionRef} className="bg-white rounded-3xl border border-[#DCDCDC] p-6 sm:p-10 shadow-2xl space-y-8" aria-live="polite">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#DCDCDC]">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#042509] text-white text-[11px] font-mono font-bold uppercase">
                      <CheckCircle2 size={13} />
                      <span>ผลการวิเคราะห์สีผิวของคุณ</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black font-serif text-[#000000]">
                      {SEASON_PROFILES[diagnosedSeason].season} — {SEASON_PROFILES[diagnosedSeason].thaiName}
                    </h2>
                    <p className="text-xs font-mono text-[#C91D1D] font-bold">
                      {SEASON_PROFILES[diagnosedSeason].undertone}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleResetQuiz}
                      className="px-4 py-2 rounded-xl border border-[#DCDCDC] bg-[#F1F1F1] hover:bg-white text-[#000000] font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>ทำแบบทดสอบใหม่</span>
                    </button>
                    <button
                      onClick={() => navigate('/mix-match')}
                      className="px-5 py-2.5 rounded-xl bg-[#042509] hover:bg-[#1E3D1A] text-white font-mono text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <span>ไปที่ Mix & Match Studio</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Profile Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: Description & Characteristics */}
                  <div className="md:col-span-2 space-y-5">
                    <div>
                      <h4 className="font-mono text-xs font-bold uppercase text-[#666666] tracking-wider mb-2">ลักษณะเด่นของสีผิวคุณ:</h4>
                      <p className="text-sm text-[#000000] leading-relaxed">
                        {SEASON_PROFILES[diagnosedSeason].description}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F1F1F1] border border-[#DCDCDC] space-y-2">
                      <h5 className="font-mono text-xs font-bold text-[#042509] uppercase">จุดสังเกตตามธรรมชาติ:</h5>
                      <ul className="space-y-1 text-xs text-[#666666]">
                        {SEASON_PROFILES[diagnosedSeason].characteristics.map((c, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#042509]" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-mono text-xs font-bold uppercase text-[#042509] tracking-wider mb-2">เนื้อผ้าที่แนะนำ (Recommended Fabrics):</h4>
                      <p className="text-xs font-mono text-[#000000] bg-[#F1F1F1] p-3 rounded-xl border border-[#042509]/20">
                        {SEASON_PROFILES[diagnosedSeason].recommendedFabrics}
                      </p>
                    </div>
                  </div>

                  {/* Right: Signature Swatches Palette */}
                  <div className="bg-[#F1F1F1] p-5 rounded-2xl border border-[#DCDCDC] space-y-4">
                    <h4 className="font-mono text-xs font-bold uppercase text-[#000000] flex items-center justify-between">
                      <span>Signature Palette (สีที่ขับผิวที่สุด)</span>
                      <Palette size={14} className="text-[#042509]" aria-hidden="true" focusable="false" />
                    </h4>
                    <div ref={paletteMotionRef} className="grid grid-cols-2 gap-2">
                      {SEASON_PROFILES[diagnosedSeason].palette.map((color, i) => (
                        <div key={i} className="p-2 bg-white rounded-xl border border-[#DCDCDC]/60 flex items-center gap-2">
                          <span 
                            className="w-5 h-5 rounded-full border border-black/15 shrink-0 shadow-2xs" 
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-[#000000] truncate">{color.name}</p>
                            <p className="text-[9px] font-mono text-[#666666]">{color.hex}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#DCDCDC]/60">
                      <h5 className="font-mono text-[10px] font-bold uppercase text-[#C91D1D] mb-1">สีที่ควรหลีกเลี่ยง (Avoid):</h5>
                      <p className="text-xs text-[#666666]">
                        {SEASON_PROFILES[diagnosedSeason].avoidColors.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        ) : (
          /* Theory Encyclopedia (4 Seasons Deep Dive) */
          <div className="space-y-8 animate-fade-in">
            {/* Season Selector Tabs */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {Object.keys(SEASON_PROFILES).map((seasonKey) => (
                <button
                  key={seasonKey}
                  onClick={() => setSelectedSeasonTab(seasonKey)}
                  className={`px-5 py-2.5 rounded-2xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                    selectedSeasonTab === seasonKey
                      ? 'bg-[#000000] text-white shadow-lg scale-105'
                      : 'bg-white border border-[#DCDCDC] text-[#666666] hover:border-[#042509]'
                  }`}
                >
                  {seasonKey} Palette
                </button>
              ))}
            </div>

            {/* Selected Season Card */}
            <div ref={seasonMotionRef} className="bg-white rounded-3xl border border-[#DCDCDC] p-6 sm:p-10 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCDCDC]">
                <div>
                  <span className="text-xs font-mono font-bold text-[#042509] uppercase">The 12-Season Architecture</span>
                  <h3 className="text-2xl sm:text-3xl font-black font-serif text-[#000000] mt-1">
                    {SEASON_PROFILES[selectedSeasonTab].season} — {SEASON_PROFILES[selectedSeasonTab].thaiName}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#F1F1F1] border border-[#DCDCDC] font-mono text-xs font-bold text-[#C91D1D]">
                  {SEASON_PROFILES[selectedSeasonTab].undertone}
                </span>
              </div>

              <p className="text-sm text-[#000000] leading-relaxed">
                {SEASON_PROFILES[selectedSeasonTab].description}
              </p>

              {/* Color Swatches Grid */}
              <div>
                <h4 className="font-mono text-xs font-bold uppercase text-[#666666] tracking-wider mb-3">
                  เฉดสีประจำฤดูกาล {selectedSeasonTab} ({SEASON_PROFILES[selectedSeasonTab].palette.length} Colors):
                </h4>
                <div ref={paletteMotionRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {SEASON_PROFILES[selectedSeasonTab].palette.map((c, i) => (
                    <div key={i} className="p-3 bg-[#F1F1F1] rounded-2xl border border-[#DCDCDC] text-center space-y-2">
                      <div 
                        className="w-12 h-12 rounded-xl mx-auto shadow-sm border border-black/10" 
                        style={{ backgroundColor: c.hex }}
                      />
                      <div>
                        <p className="text-xs font-bold text-[#000000] truncate">{c.name}</p>
                        <p className="text-[10px] font-mono text-[#666666]">{c.hex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
