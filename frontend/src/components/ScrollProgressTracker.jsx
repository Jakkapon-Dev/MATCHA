import React, { useState, useEffect, useRef } from 'react';

export default function ScrollProgressTracker() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafId = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (totalScroll <= 0) return;
        const currentScroll = window.scrollY || window.pageYOffset;
        const progress = Math.min(100, Math.max(0, (currentScroll / totalScroll) * 100));
        setScrollProgress(progress);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    /* Top Global Scroll Progress Line */
    <div className="fixed top-0 left-0 right-0 h-[3px] bg-black/5 z-50 pointer-events-none">
      <div
        className="h-full bg-linear-to-r from-[#2D5A27] via-[#BC5A36] to-[#2D5A27] transition-all duration-75 ease-out shadow-xs"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}
