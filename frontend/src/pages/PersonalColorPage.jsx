import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Eye, 
  Heart, 
  ShoppingBag, 
  Info, 
  BookOpen, 
  Palette, 
  Compass, 
  Sun, 
  Droplet, 
  Layers 
} from 'lucide-react';
import { productsData } from '../data/productsData';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/product/ProductCard';

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
      { name: 'Warm Terracotta', hex: '#BC5A36' },
      { name: 'Espresso Brown', hex: '#4B3621' },
      { name: 'Matcha Forest', hex: '#2D5A27' }
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

const QUIZ_QUESTIONS = [
  {
    id: 1,
    category: 'Undertone Test',
    question: '1. เมื่อสังเกตเส้นเลือดที่ข้อมือของคุณใต้แสงธรรมชาติ เห็นเป็นสีอะไรชัดที่สุด?',
    icon: <Droplet size={18} className="text-[#2D5A27]" />,
    options: [
      { label: 'เห็นเป็นสีเขียวหรือเขียวขี้ม้า (Green / Olive)', score: 'Warm', weight: 2 },
      { label: 'เห็นเป็นสีน้ำเงินหรือม่วงชัดเจน (Blue / Purple)', score: 'Cool', weight: 2 },
      { label: 'เห็นผสมกันทั้งสีเขียวและน้ำเงิน (Blue-Green Neutral)', score: 'Neutral', weight: 1 }
    ]
  },
  {
    id: 2,
    category: 'Jewelry Reflection Test',
    question: '2. เมื่อสวมใส่เครื่องประดับ โลหะชนิดใดทำให้ผิวของคุณดูสว่างและเปล่งปลั่งที่สุด?',
    icon: <Sun size={18} className="text-[#BC5A36]" />,
    options: [
      { label: 'ทองคำ / ทองเหลือง / Yellow Gold (ช่วยขับผิวให้ดูสดใส ไม่หมอง)', score: 'Warm', weight: 2 },
      { label: 'เงิน / แพลทินัม / Silver / White Gold (ช่วยให้ผิวดูขาวผ่อง ดูคมชัด)', score: 'Cool', weight: 2 },
      { label: 'ใส่ได้ทั้งสองสี ดูดีพอๆ กัน', score: 'Neutral', weight: 1 }
    ]
  },
  {
    id: 3,
    category: 'Sun & Tanning Reaction',
    question: '3. เมื่อต้องอยู่กลางแดดจัดเป็นเวลานาน ผิวของคุณตอบสนองอย่างไร?',
    icon: <Sun size={18} className="text-amber-600" />,
    options: [
      { label: 'ผิวเปลี่ยนเป็นสีแทนได้ง่าย ไม่ค่อยไหม้แดด (Tans Easily)', score: 'Warm', weight: 2 },
      { label: 'ผิวไหม้แดง แสบง่าย และไม่ค่อยเปลี่ยนเป็นสีแทน (Burns Easily)', score: 'Cool', weight: 2 },
      { label: 'ผิวแดงเล็กน้อยในวันแรก แล้วค่อยๆ เปลี่ยนเป็นสีแทนในเวลาต่อมา', score: 'Neutral', weight: 1 }
    ]
  },
  {
    id: 4,
    category: 'Fabric Color Contrast',
    question: '4. ระหว่างเสื้อสีขาวนวล (Off-White/Ivory) กับ เสื้อสีขาวโอโม่สว่าง (Pure White) ตัวไหนใส่แล้วหน้าไม่ดูโทรม?',
    icon: <Layers size={18} className="text-[#2D5A27]" />,
    options: [
      { label: 'สีขาวนวล (Off-White / Cream) ทำให้ใบหน้าดูนวล อบอุ่น', score: 'Warm', weight: 2 },
      { label: 'สีขาวสว่างจัด (Pure Bright White) ทำให้ใบหน้าดูสว่าง คมชัด ไม่กลืน', score: 'Cool', weight: 2 },
      { label: 'ดูเข้ากับใบหน้าได้ทั้งสองสี', score: 'Neutral', weight: 1 }
    ]
  },
  {
    id: 5,
    category: 'Contrast & Intensity',
    question: '5. สีผมตามธรรมชาติ สีตา และริมฝีปากของคุณมีลักษณะอย่างไร?',
    icon: <Eye size={18} className="text-[#2D231E]" />,
    options: [
      { label: 'ผมน้ำตาลประกายทอง หรือตาสีน้ำตาลสว่าง มีความสดใส (Light & Bright)', score: 'Spring', weight: 3 },
      { label: 'ผมน้ำตาลหม่น ผิวอมชมพู ริมฝีปากสีชมพูระเรื่อ นุ่มนวล (Soft & Muted)', score: 'Summer', weight: 3 },
      { label: 'ผมน้ำตาลเข้ม ตาสีน้ำตาลเข้มลึก ผิวสองสีอบอุ่น (Deep & Warm)', score: 'Autumn', weight: 3 },
      { label: 'ผมดำสนิท ตาดำขลับ คอนทราสต์ตัดกับสีผิวชัดเจน (Vivid & Contrast)', score: 'Winter', weight: 3 }
    ]
  }
];

export default function PersonalColorPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, login } = useAuth();

  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'theory' | 'palette'
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [diagnosedSeason, setDiagnosedSeason] = useState(() => {
    return localStorage.getItem('matcha_personal_color') || null;
  });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedSeasonTab, setSelectedSeasonTab] = useState('Autumn');

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
  const calculateResult = (finalAnswers) => {
    setIsScanning(true);

    setTimeout(() => {
      let warmScore = 0;
      let coolScore = 0;
      let specificSeason = null;

      Object.values(finalAnswers).forEach(ans => {
        if (ans.score === 'Warm') warmScore += ans.weight;
        if (ans.score === 'Cool') coolScore += ans.weight;
        if (['Spring', 'Summer', 'Autumn', 'Winter'].includes(ans.score)) {
          specificSeason = ans.score;
        }
      });

      let finalSeason = 'Autumn';
      if (specificSeason) {
        finalSeason = specificSeason;
      } else if (warmScore > coolScore) {
        finalSeason = Math.random() > 0.5 ? 'Autumn' : 'Spring';
      } else {
        finalSeason = Math.random() > 0.5 ? 'Winter' : 'Summer';
      }

      setDiagnosedSeason(finalSeason);
      setSelectedSeasonTab(finalSeason);
      setIsScanning(false);
      localStorage.setItem('matcha_personal_color', finalSeason);
      showToast(`วิเคราะห์ผลสำเร็จ: โทนสีผิวของคุณคือ ${SEASON_PROFILES[finalSeason].thaiName} ✨`);
    }, 1200);
  };

  const handleResetQuiz = () => {
    setAnswers({});
    setCurrentStep(0);
    setDiagnosedSeason(null);
  };

  // Filter curated products matching the current active season view
  const curatedSeason = activeTab === 'theory' 
    ? selectedSeasonTab 
    : (diagnosedSeason || selectedSeasonTab);

  const recommendedProducts = productsData.filter(p => p.season.toLowerCase() === curatedSeason.toLowerCase()).slice(0, 8);

  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">

        {/* 1. HERO HEADER: Personal Color Studio */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E2ECE9] border border-[#2D5A27]/20 text-[#2D5A27] text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Artisan Personal Color Lab & Styling Science</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase text-[#2D231E] tracking-tight font-serif">
            ค้นหาโทนสีผิวประจำตัว 4 ฤดูกาล
          </h1>
          <p className="text-[#6B5E55] text-sm sm:text-base leading-relaxed">
            เลือกใส่เสื้อผ้าที่ขับออร่าของคุณด้วย <strong>ทฤษฎี Personal Color สากล</strong> จำแนกตาม 4 ฤดู ช่วยให้ทุกชุดที่คุณสวมใส่เสริมบุคลิกและสะท้อนเสน่ห์ที่เป็นเอกลักษณ์
          </p>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-[#2D5A27] text-white shadow-md'
                  : 'bg-white border border-[#D9D3C7] text-[#6B5E55] hover:text-[#2D231E]'
              }`}
            >
              <Sparkles size={14} />
              <span>Diagnostic Quiz (แบบทดสอบสีผิว)</span>
            </button>
            <button
              onClick={() => setActiveTab('theory')}
              className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'theory'
                  ? 'bg-[#2D5A27] text-white shadow-md'
                  : 'bg-white border border-[#D9D3C7] text-[#6B5E55] hover:text-[#2D231E]'
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
              <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#D9D3C7] p-6 sm:p-10 shadow-xl relative overflow-hidden animate-fade-in">
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-mono text-[#6B5E55] mb-2 font-bold">
                    <span>คำถามที่ {currentStep + 1} จาก {QUIZ_QUESTIONS.length}</span>
                    <span className="text-[#2D5A27]">{Math.round(((currentStep + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FAF8F5] overflow-hidden border border-[#D9D3C7]/60">
                    <div 
                      className="h-full bg-[#2D5A27] transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Current Question */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono font-bold uppercase text-[#BC5A36] tracking-wider flex items-center gap-1.5">
                      {QUIZ_QUESTIONS[currentStep].icon}
                      <span>{QUIZ_QUESTIONS[currentStep].category}</span>
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#2D231E] leading-snug">
                      {QUIZ_QUESTIONS[currentStep].question}
                    </h2>
                  </div>

                  {/* Options List */}
                  <div className="space-y-3">
                    {QUIZ_QUESTIONS[currentStep].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(QUIZ_QUESTIONS[currentStep].id, option)}
                        className="w-full p-4 rounded-2xl border border-[#D9D3C7] hover:border-[#2D5A27] bg-[#FAF8F5] hover:bg-white text-left font-sans text-xs sm:text-sm font-medium text-[#2D231E] transition-all hover:shadow-md flex items-center justify-between group cursor-pointer"
                      >
                        <span>{option.label}</span>
                        <ArrowRight size={16} className="text-[#6B5E55] group-hover:text-[#2D5A27] group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>

                  {/* Back button if step > 0 */}
                  {currentStep > 0 && (
                    <button
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="text-xs font-mono text-[#6B5E55] hover:text-[#2D231E] font-bold cursor-pointer underline"
                    >
                      ← ย้อนกลับข้อก่อนหน้า
                    </button>
                  )}
                </div>

              </div>
            ) : isScanning ? (
              /* Scanning Animation */
              <div className="max-w-md mx-auto py-20 text-center space-y-4 bg-white rounded-3xl border border-[#D9D3C7] p-8 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-[#E2ECE9] text-[#2D5A27] flex items-center justify-center mx-auto animate-spin">
                  <Compass size={32} />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#2D231E]">กำลังวิเคราะห์ข้อมูล Personal Color...</h3>
                <p className="text-xs font-mono text-[#6B5E55]">ประมวลผลความสอดคล้องของ Undertone, Contrast และเฉดสีผ้า</p>
              </div>
            ) : (
              /* Quiz Result Presentation Card */
              <div className="bg-white rounded-3xl border border-[#D9D3C7] p-6 sm:p-10 shadow-2xl space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#D9D3C7]">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#2D5A27] text-white text-[11px] font-mono font-bold uppercase">
                      <CheckCircle2 size={13} />
                      <span>ผลการวิเคราะห์สีผิวของคุณ</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black font-serif text-[#2D231E]">
                      {SEASON_PROFILES[diagnosedSeason].season} — {SEASON_PROFILES[diagnosedSeason].thaiName}
                    </h2>
                    <p className="text-xs font-mono text-[#BC5A36] font-bold">
                      {SEASON_PROFILES[diagnosedSeason].undertone}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleResetQuiz}
                      className="px-4 py-2 rounded-xl border border-[#D9D3C7] bg-[#FAF8F5] hover:bg-white text-[#2D231E] font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>ทำแบบทดสอบใหม่</span>
                    </button>
                    <button
                      onClick={() => navigate('/mix-match')}
                      className="px-5 py-2.5 rounded-xl bg-[#2D5A27] hover:bg-[#1E3D1A] text-white font-mono text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
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
                      <h4 className="font-mono text-xs font-bold uppercase text-[#6B5E55] tracking-wider mb-2">ลักษณะเด่นของสีผิวคุณ:</h4>
                      <p className="text-sm text-[#2D231E] leading-relaxed">
                        {SEASON_PROFILES[diagnosedSeason].description}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#D9D3C7] space-y-2">
                      <h5 className="font-mono text-xs font-bold text-[#2D5A27] uppercase">จุดสังเกตตามธรรมชาติ:</h5>
                      <ul className="space-y-1 text-xs text-[#6B5E55]">
                        {SEASON_PROFILES[diagnosedSeason].characteristics.map((c, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A27]" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-mono text-xs font-bold uppercase text-[#2D5A27] tracking-wider mb-2">เนื้อผ้าที่แนะนำ (Recommended Fabrics):</h4>
                      <p className="text-xs font-mono text-[#2D231E] bg-[#E2ECE9] p-3 rounded-xl border border-[#2D5A27]/20">
                        {SEASON_PROFILES[diagnosedSeason].recommendedFabrics}
                      </p>
                    </div>
                  </div>

                  {/* Right: Signature Swatches Palette */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#D9D3C7] space-y-4">
                    <h4 className="font-mono text-xs font-bold uppercase text-[#2D231E] flex items-center justify-between">
                      <span>Signature Palette (สีที่ขับผิวที่สุด)</span>
                      <Palette size={14} className="text-[#2D5A27]" />
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {SEASON_PROFILES[diagnosedSeason].palette.map((color, i) => (
                        <div key={i} className="p-2 bg-white rounded-xl border border-[#D9D3C7]/60 flex items-center gap-2">
                          <span 
                            className="w-5 h-5 rounded-full border border-black/15 shrink-0 shadow-2xs" 
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-[#2D231E] truncate">{color.name}</p>
                            <p className="text-[9px] font-mono text-[#6B5E55]">{color.hex}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#D9D3C7]/60">
                      <h5 className="font-mono text-[10px] font-bold uppercase text-[#BC5A36] mb-1">สีที่ควรหลีกเลี่ยง (Avoid):</h5>
                      <p className="text-xs text-[#6B5E55]">
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
                      ? 'bg-[#2D231E] text-white shadow-lg scale-105'
                      : 'bg-white border border-[#D9D3C7] text-[#6B5E55] hover:border-[#2D5A27]'
                  }`}
                >
                  {seasonKey} Palette
                </button>
              ))}
            </div>

            {/* Selected Season Card */}
            <div className="bg-white rounded-3xl border border-[#D9D3C7] p-6 sm:p-10 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9D3C7]">
                <div>
                  <span className="text-xs font-mono font-bold text-[#2D5A27] uppercase">The 12-Season Architecture</span>
                  <h3 className="text-2xl sm:text-3xl font-black font-serif text-[#2D231E] mt-1">
                    {SEASON_PROFILES[selectedSeasonTab].season} — {SEASON_PROFILES[selectedSeasonTab].thaiName}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#D9D3C7] font-mono text-xs font-bold text-[#BC5A36]">
                  {SEASON_PROFILES[selectedSeasonTab].undertone}
                </span>
              </div>

              <p className="text-sm text-[#2D231E] leading-relaxed">
                {SEASON_PROFILES[selectedSeasonTab].description}
              </p>

              {/* Color Swatches Grid */}
              <div>
                <h4 className="font-mono text-xs font-bold uppercase text-[#6B5E55] tracking-wider mb-3">
                  เฉดสีประจำฤดูกาล {selectedSeasonTab} ({SEASON_PROFILES[selectedSeasonTab].palette.length} Colors):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {SEASON_PROFILES[selectedSeasonTab].palette.map((c, i) => (
                    <div key={i} className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#D9D3C7] text-center space-y-2">
                      <div 
                        className="w-12 h-12 rounded-xl mx-auto shadow-sm border border-black/10" 
                        style={{ backgroundColor: c.hex }}
                      />
                      <div>
                        <p className="text-xs font-bold text-[#2D231E] truncate">{c.name}</p>
                        <p className="text-[10px] font-mono text-[#6B5E55]">{c.hex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. CURATED OUTFIT SHOWCASE: Products matching the Season */}
        <div className="space-y-6 pt-8 border-t border-[#D9D3C7]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#2D5A27] uppercase">
                <Sparkles size={14} />
                <span>Curated Wardrobe ({recommendedProducts.length} Looks)</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#2D231E] font-serif mt-1">
                เสื้อผ้าที่คัดสรรสำหรับโทน {SEASON_PROFILES[curatedSeason]?.season || curatedSeason}
              </h3>
              <p className="text-xs font-mono text-[#6B5E55] mt-0.5">
                {SEASON_PROFILES[curatedSeason]?.undertone}
              </p>
            </div>

            {/* Quick Season Switcher Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {Object.keys(SEASON_PROFILES).map((sKey) => (
                <button
                  key={sKey}
                  onClick={() => {
                    setSelectedSeasonTab(sKey);
                    if (activeTab !== 'theory') {
                      setDiagnosedSeason(sKey);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    curatedSeason.toLowerCase() === sKey.toLowerCase()
                      ? 'bg-[#2D5A27] text-white shadow-sm scale-105'
                      : 'bg-white border border-[#D9D3C7] text-[#6B5E55] hover:text-[#2D231E] hover:border-[#2D5A27]'
                  }`}
                >
                  {sKey}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => navigate('/catalog')}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
