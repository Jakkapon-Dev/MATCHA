import React, { useEffect, useRef } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Parallax, Reveal } from '../motion';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function VdoSection({ onClaimPromo }) {
  const { t } = useLanguage();
  // Remote video is a fallback: the browser tries the local lookbook source first.
  const videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-stylish-model-posing-outdoors-in-the-city-41222-large.mp4";

  const videoRef = useRef(null);

  // ไฟล์วิดีโอไม่ถูกดาวน์โหลดตอนเปิดหน้าแรก (preload="none") จนกว่าส่วนนี้จะเลื่อนมาถึงจอ
  // ระหว่างนั้นคนดูเห็นภาพ poster ไปก่อน — พอเลื่อนพ้นไปแล้วก็หยุดเล่นเพื่อไม่ให้กินแบตฟรี ๆ
  //
  // ต้องสั่ง play() เองเพราะ preload="none" กับ attribute autoplay ทำงานขัดกัน
  // (เบราว์เซอร์จะโหลดไฟล์ทันทีถ้าเจอ autoplay) การเล่นแบบเงียบด้วยสคริปต์ไม่ต้องรอ
  // ให้ผู้ใช้แตะก่อน ตราบใดที่ยังมี muted + playsInline ครบ จึงเล่นเองได้บนมือถือด้วย
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (typeof IntersectionObserver !== 'function') {
      el.play().catch(() => {});
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleClaim = (e) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText('MATCHA15').catch(() => {});
    }
    try {
      localStorage.setItem('matcha_applied_coupon', 'MATCHA15');
    } catch {}
    if (onClaimPromo) {
      onClaimPromo();
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-[#1A2218] overflow-hidden flex items-center justify-center border-y border-[#042509]/30 select-none py-16 sm:py-24">
      
      {/* 1. Full-Height Background Video (Anchored to top to prevent head crop).
          วิดีโอเลื่อนสวนทางกับข้อความด้านหน้าเล็กน้อย จึงต้องกินพื้นที่เกินขอบ
          section ไว้ 8% ไม่งั้นจะเห็นขอบว่างตอนมันไหลขึ้น-ลง */}
      <Parallax
        distance={48}
        className="absolute inset-0 overflow-hidden pointer-events-none"
        innerClassName="absolute inset-[-8%]"
      >
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="none"
          poster="/videos/lookbook_reel_poster.webp"
          className="w-full h-full object-cover object-top sm:object-[center_15%] opacity-90"
        >
          <source src="/videos/lookbook_reel.mp4" type="video/mp4" />
          <source src={videoSrc} type="video/mp4" />
        </video>
      </Parallax>

      {/* 2. Film Gradient Overlays for Readability & Depth */}
      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-black/65 pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-t from-[#1A2218] via-transparent to-[#1A2218]/90 pointer-events-none" />

      {/* 3. Main Content Container: Left Headline + Right Floating Glass Card */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-10 sm:gap-14">
        
        {/* Left Side: Editorial Cinematic Title */}
        <Reveal y={44} duration={0.8} className="max-w-xl text-center lg:text-left">
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#F1F1F1] tracking-tight uppercase leading-[0.95] drop-shadow-xl">
            {t('video.titleTop')} <br />
            <span className="text-[#518F5C] font-light">{t('video.titleBottom')}</span>
          </h2>
          <p className="mt-6 text-xs sm:text-sm text-neutral-300 font-mono max-w-md leading-relaxed drop-shadow">
            {t('video.description')}
          </p>
        </Reveal>

        {/* Right Side: Floating Glass Promotion Card (Glassmorphism).
            Entrance lives on the wrapper so the card keeps its own hover lift. */}
        <Reveal x={64} y={0} delay={0.15} duration={0.8} className="w-full max-w-md">
        <div className="w-full backdrop-blur-2xl bg-[#F1F1F1]/95 border border-white/60 shadow-2xl rounded-3xl p-6 sm:p-8 transform hover:scale-[1.02] transition-transform duration-300">
          
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 bg-[#C91D1D] text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm flex items-center gap-1.5">
              <Sparkles size={11} />
              <span>{t('video.promoBadge')}</span>
            </span>
            <span className="text-[10px] font-mono text-[#042509] font-bold bg-[#518F5C] px-2.5 py-1 rounded-md">
              {t('video.promoCode')}
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#000000] leading-tight">
            {t('video.promoTitle')}
          </h3>

          <p className="text-xs text-[#666666] mt-3 leading-relaxed font-sans">
            {t('video.promoBody')}
          </p>

          {/* Promo behavior is owned by the parent (for example, navigation or cart rules). */}
          <button 
            onClick={handleClaim}
            className="mt-6 w-full py-4 bg-[#C91D1D] hover:bg-[#A81515] text-white font-bold font-mono text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-[#C91D1D]/30 active:scale-95 cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>{t('video.promoCta')}</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>

        </div>
        </Reveal>

      </div>

    </section>
  );
}
