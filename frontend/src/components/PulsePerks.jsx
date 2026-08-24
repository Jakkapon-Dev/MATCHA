import React, { useState, useRef } from 'react';
import { Sparkles, Zap, RotateCcw, ShieldCheck } from 'lucide-react';

export default function PulsePerks() {
  const [rotate, setRotate] = useState({ x: 4, y: -18 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const perks = [
    {
      num: '01.',
      title: 'LIGHTNING FAST SHIPPING',
      desc: 'Get your drip in 48 hours (because the streets won\'t wait to flex).',
      icon: Zap,
    },
    {
      num: '02.',
      title: 'EASY STORE CREDIT EXCHANGES',
      desc: 'Wrong size? Swap it fast and keep your fit game flawless.',
      icon: RotateCcw,
    },
    {
      num: '03.',
      title: 'SECURE CHECKOUT PROTECTION',
      desc: 'Encrypted checkout shields every drop. Shop safe, stay unstoppable.',
      icon: ShieldCheck,
    }
  ];

  // Interactive 3D Card Rotation based on Mouse Movement
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate dynamic 3D rotation angles
    const rotateX = ((y - centerY) / centerY) * -14;
    const rotateY = ((x - centerX) / centerX) * 22;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reset to subtle iconic 3D perspective angle from reference screenshot
    setRotate({ x: 3, y: -16 });
  };

  return (
    <section className="w-full bg-[#FAF8F5] text-[#2D231E] py-16 sm:py-24 px-4 sm:px-8 lg:px-12 border-b border-[#D9D3C7] select-none overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* 1. Header Title */}
        <div className="mb-10">
          <h2 className="text-4xl sm:text-6xl font-black text-[#BC5A36] tracking-tight font-sans">
            The Pulse Perks
          </h2>
        </div>

        {/* 2. Main Framed Grid Container (Matching Reference Orange Border Frame) */}
        <div className="border-2 border-[#BC5A36]/80 rounded-none grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-white shadow-xl">
          
          {/* Left Column (Col 1-7): 3D Perspective Rotating Sitting Model Card */}
          <div
            ref={cardRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex items-center justify-center border-b lg:border-b-0 lg:border-r-2 border-[#BC5A36]/80 bg-linear-to-b from-[#FAF8F5] to-white relative cursor-grab active:cursor-grabbing perspective-1000"
            style={{ perspective: '1200px' }}
          >
            {/* Subtle background glow effect */}
            <div className="absolute w-72 h-72 bg-[#BC5A36]/10 rounded-full blur-3xl pointer-events-none" />

            {/* 3D Rotating Showcase Card */}
            <div
              className="relative w-64 sm:w-80 lg:w-96 aspect-3/4 shadow-2xl transition-transform duration-200 ease-out preserve-3d group"
              style={{
                transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${isHovered ? 1.05 : 1})`,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Sitting Model Image */}
              <img
                src="/images/studio_white_bg/fashion_pose/spring/studio_pose_spring_seated_on_minimalist_stool_001.jpeg"
                alt="MatchA Seated Lookbook Model"
                className="w-full h-full object-cover rounded-none border border-white/80 shadow-2xl"
              />

              {/* Glass Glare Overlay on 3D Tilt */}
              <div
                className="absolute inset-0 bg-linear-to-tr from-transparent via-white/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ transform: 'translateZ(20px)' }}
              />

              {/* 3D Floating Badge */}
              <div
                className="absolute top-4 left-4 px-3 py-1 bg-[#BC5A36] text-white text-[10px] font-mono font-bold tracking-widest uppercase shadow-lg flex items-center gap-1.5"
                style={{ transform: 'translateZ(35px)' }}
              >
                <Sparkles size={12} className="text-[#D0DEC6]" />
                <span>3D LOOKBOOK</span>
              </div>

              {/* Interactive Rotate Hint */}
              <div
                className="absolute bottom-4 right-4 px-3 py-1 bg-black/80 text-[#FAF8F5] text-[9px] font-mono tracking-wider uppercase backdrop-blur-md shadow-lg"
                style={{ transform: 'translateZ(30px)' }}
              >
                <span>↻ MOVE MOUSE TO ROTATE</span>
              </div>
            </div>
          </div>

          {/* Right Column (Col 8-12): 3 Perk Sections with Orange Dividing Borders */}
          <div className="lg:col-span-5 flex flex-col justify-between divide-y-2 divide-[#BC5A36]/80 bg-white">
            {perks.map((perk) => {
              const Icon = perk.icon;
              
              return (
                <div
                  key={perk.num}
                  className="p-8 sm:p-10 flex flex-col justify-center flex-1 hover:bg-[#FAF8F5] transition-colors duration-300 group"
                >
                  {/* Perk Number */}
                  <span className="text-sm font-mono font-bold text-[#BC5A36] block mb-2 tracking-wider">
                    {perk.num}
                  </span>

                  {/* Perk Title */}
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#BC5A36] uppercase tracking-tight group-hover:text-[#2D231E] transition-colors duration-200 flex items-center gap-2">
                    <span>{perk.title}</span>
                  </h3>

                  {/* Perk Description */}
                  <p className="text-xs sm:text-sm text-[#6B5E55] mt-2 leading-relaxed font-sans font-medium">
                    {perk.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
