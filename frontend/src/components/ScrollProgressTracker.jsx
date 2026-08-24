import React, { useState, useEffect } from 'react';

export default function ScrollProgressTracker() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeFrame, setActiveFrame] = useState({ num: '01', title: 'LOOKBOOK 2026' });

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) return;
      const currentScroll = window.scrollY;
      const progress = (currentScroll / totalScroll) * 100;
      setScrollProgress(progress);

      // Determine active section frame based on scroll position
      const sections = [
        { id: 'brand-hero', num: '01', title: 'EDITORIAL MIX@MATCH' },
        { id: 'fit-guide', num: '02', title: 'CHOOSE YOUR FIT' },
        { id: 'cinematic-reel', num: '03', title: 'CINEMATIC MOVEMENT' },
        { id: 'pulse-perks', num: '04', title: 'THE PULSE PERKS' },
        { id: 'street-favorites', num: '05', title: 'STREET FAVORITES' },
        { id: 'warehouse-sale', num: '06', title: 'LAST CALL ARCHIVE' },
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.45) {
            setActiveFrame({ num: sections[i].num, title: sections[i].title });
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* 1. Top Global Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-transparent z-50 pointer-events-none">
        <div
          className="h-full bg-linear-to-r from-[#2D5A27] via-[#BC5A36] to-[#2D5A27] transition-all duration-150 ease-out shadow-xs"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. Floating Lookbook Frame Tracker Badge (Bottom-Left Corner) */}
      <div className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-2.5 px-3.5 py-1.5 bg-[#2D231E]/90 text-white rounded-full backdrop-blur-md border border-white/15 shadow-xl pointer-events-none transition-all duration-300">
        <span className="w-2 h-2 rounded-full bg-[#BC5A36] animate-pulse" />
        <span className="text-[10px] font-mono font-bold tracking-widest text-[#D0DEC6]">
          FRAME {activeFrame.num} // 06
        </span>
        <span className="text-[#6B5E55] text-xs">|</span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-white">
          {activeFrame.title}
        </span>
      </div>
    </>
  );
}
