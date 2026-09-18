import React, { useEffect, useRef } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Parallax, Reveal } from '../motion';
import { storePendingCoupon } from '../../config/coupons';
import { useLanguage } from '../../context/LanguageContext.jsx';

// The code this panel promotes. Named once so the button, the clipboard copy
// and the held coupon can never disagree with each other.
const PROMO_CODE = 'MATCHA15';

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

  /* The button says "claim", so it has to claim.
   *
   * It used to write `matcha_applied_coupon` to localStorage and nothing
   * anywhere read that key — the write had no effect at all. All the button
   * really did was copy the code to the clipboard and tell the visitor to type
   * it in at checkout themselves, which fails the moment they copy anything
   * else on the way there.
   *
   * The coupon is now held for the checkout screen to pick up. The clipboard
   * copy stays as a fallback for a visitor whose storage is blocked. */
  const handleClaim = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(PROMO_CODE).catch(() => {});
    }
    const held = storePendingCoupon(PROMO_CODE);
    if (onClaimPromo) {
      onClaimPromo(held);
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
          className="w-full h-full object-cover object-top sm:object-[center_15%]"
        >
          <source src="/videos/lookbook_reel.mp4" type="video/mp4" />
          <source src={videoSrc} type="video/mp4" />
        </video>
      </Parallax>

      {/* 2. One scrim, only where type actually sits.

          The footage used to be under three dimmers at once: the video at 90%
          opacity, a black gradient that never fell below 40% anywhere in the
          frame, and a second full-frame wash of the section's dark green that
          was fully opaque along the bottom edge and 90% along the top. At the
          corners almost nothing of the film survived.

          A scrim is for carrying text, so it now covers the side the text is
          on and clears the rest. On a wide screen the copy is on the left and
          the promo card on the right is opaque anyway, so the right half is
          left alone entirely; stacked on a phone the copy sits above the card,
          so the scrim runs top to bottom instead. */}
      <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-black/70 via-black/30 to-black/45 lg:bg-linear-to-r lg:from-black/78 lg:via-black/45 lg:to-transparent" />

      {/* 3. Main Content Container: Left Headline + Right Floating Glass Card */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-10 sm:gap-14">
        
        {/* Left Side: Editorial Cinematic Title */}
        <Reveal y={44} duration={0.8} className="max-w-xl text-center lg:text-left">
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#F1F1F1] tracking-tight uppercase leading-[0.95] drop-shadow-xl">
            {t('video.titleTop')} <br />
            <span>{t('video.titleBottom')}</span>
          </h2>
          <p className="mt-6 text-xs sm:text-sm text-neutral-300 font-mono max-w-md leading-relaxed drop-shadow">
            {t('video.description')}
          </p>
        </Reveal>

        {/* Right Side: Floating Glass Promotion Card (Glassmorphism).
            Entrance lives on the wrapper so the card keeps its own hover lift. */}
        <Reveal x={64} y={0} delay={0.15} duration={0.8} className="w-full max-w-md">
        <div className="w-full bg-[#F1F1F1] p-6 sm:p-8">
          
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C91D1D] flex items-center gap-1.5">
              <Sparkles size={11} />
              <span>{t('video.promoBadge')}</span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666666]">
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
            className="mt-6 w-full py-4 bg-[#C91D1D] hover:bg-[#A81515] text-white font-mono text-xs uppercase tracking-[0.15em] transition-colors cursor-pointer flex items-center justify-center gap-2 group"
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
