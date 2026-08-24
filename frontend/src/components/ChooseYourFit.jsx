import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function ChooseYourFit({ onSelectFit }) {
  const [activeFit, setActiveFit] = useState(null);

  // The 4 Signature Fit Silhouettes mapped to Location Lifestyle Outfits
  const topFits = [
    {
      id: 1,
      title: 'Oversized Boxy',
      size: 'Loose Streetwear Cut',
      code: 'FIT-01',
      image: '/images/location_lifestyle/urban_street/spring/location_urban_street_spring_wearing_oversized_denim_ja_001.jpeg',
      tag: 'Oversized Denim'
    },
    {
      id: 2,
      title: 'Slim Tailored',
      size: 'Form Fitting Structure',
      code: 'FIT-02',
      image: '/images/location_lifestyle/urban_street/spring/location_urban_street_spring_posing_in_trench_coat_001.jpeg',
      tag: 'Tailored Trench'
    },
  ];

  const bottomFits = [
    {
      id: 3,
      title: 'Street Relaxed',
      size: 'Casual Drop Shoulder',
      code: 'FIT-03',
      image: '/images/location_lifestyle/urban_street/spring/location_urban_street_spring_adjusting_hoodie_001.jpeg',
      tag: 'Bomber & Hoodie'
    },
    {
      id: 4,
      title: 'Crop Sculpt',
      size: 'Contemporary Cropped',
      code: 'FIT-04',
      image: '/images/location_lifestyle/urban_street/winter/location_urban_street_winter_wearing_black_blazer_dress_001.jpeg',
      tag: 'Sculpted Blazer'
    },
  ];

  const allFits = [...topFits, ...bottomFits];

  return (
    <section className="w-full bg-[#FAF8F5] text-[#2D231E] py-20 px-4 sm:px-8 lg:px-12 border-b border-[#D9D3C7] relative overflow-hidden">
      
      {/* 1. Section Header Title */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between mb-16 relative z-20">
        <div>
          <span className="text-xs font-mono font-bold tracking-[0.25em] text-[#BC5A36] uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#BC5A36]" />
            SIGNATURE SILHOUETTES
          </span>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-[#2D231E] tracking-tight mt-1">
            Choose Your Fit
          </h2>
        </div>
        <p className="text-xs text-[#6B5E55] max-w-xs mt-3 sm:mt-0 font-mono leading-relaxed">
          Crafted in premium Japanese & organic fabrics, tailored for every individual aesthetic and aesthetic silhouette.
        </p>
      </div>

      {/* 2. Main Interactive Split Canvas (Center Nude Model Background + Floating Top/Bottom Fit Cards) */}
      <div className="max-w-6xl mx-auto relative rounded-3xl overflow-hidden border border-[#D9D3C7] shadow-xl bg-white">
        
        {/* Background Canvas: Female Nude Beige Model */}
        <div className="absolute inset-0 flex flex-col pointer-events-none select-none z-0">
          
          {/* Part A: ส่วนบน (Upper Torso & Tank Top Canvas) */}
          <div className="relative w-full h-1/2 overflow-hidden border-b border-[#D9D3C7]/40 bg-[#FAF8F5]">
            <img
              src="/images/studio_white_bg/standing_straight/spring/studio_straight_spring_nude_beige_tank_tailored_pants_001.jpeg"
              alt="Fit Canvas Upper Body"
              className="absolute inset-0 w-full h-[200%] object-contain object-top opacity-35 sm:opacity-45 blur-[0.3px]"
            />
            <div className="absolute inset-0 bg-linear-to-b from-white/70 via-transparent to-white/80" />
            <div className="absolute top-4 left-6 px-3 py-1 bg-[#2D231E]/10 backdrop-blur-md rounded-full text-[10px] font-mono font-bold tracking-widest text-[#2D231E] uppercase">
              PART 01 // UPPER SILHOUETTES
            </div>
          </div>

          {/* Part B: ส่วนล่าง (Lower Pants & Footwear Canvas) */}
          <div className="relative w-full h-1/2 overflow-hidden bg-[#FAF8F5]">
            <img
              src="/images/studio_white_bg/standing_straight/spring/studio_straight_spring_nude_beige_tank_tailored_pants_001.jpeg"
              alt="Fit Canvas Lower Body"
              className="absolute inset-0 w-full h-[200%] top-[-100%] object-contain object-bottom opacity-35 sm:opacity-45 blur-[0.3px]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-white/70 via-transparent to-white/80" />
            <div className="absolute bottom-4 left-6 px-3 py-1 bg-[#2D231E]/10 backdrop-blur-md rounded-full text-[10px] font-mono font-bold tracking-widest text-[#2D231E] uppercase">
              PART 02 // LOWER SILHOUETTES
            </div>
          </div>

        </div>

        {/* Center Floating Badge matching the reference: [Choose Your Fit] */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none select-none hidden md:block">
          <div className="px-6 py-2.5 bg-[#2D231E] text-[#FAF8F5] text-sm font-mono font-bold tracking-[0.25em] uppercase rounded-full shadow-2xl border border-white/20 flex items-center gap-2 backdrop-blur-md">
            <Sparkles size={14} className="text-[#D0DEC6]" />
            <span>MATCH A // FIT MATRIX</span>
          </div>
        </div>

        {/* 3. Floating Interactive Fit Cards Grid on Top of the Canvas */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {allFits.map((fit) => (
            <div
              key={fit.id}
              onMouseEnter={() => setActiveFit(fit.id)}
              onMouseLeave={() => setActiveFit(null)}
              onClick={() => onSelectFit && onSelectFit(fit)}
              className="cursor-pointer flex flex-col bg-white/95 backdrop-blur-md rounded-2xl border border-[#D9D3C7] shadow-lg hover:shadow-2xl hover:border-[#2D5A27] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group"
            >
              {/* Image Container with Zoom & Badge */}
              <div className="relative w-full aspect-[4/5] bg-[#D0DEC6]/30 overflow-hidden">
                <img
                  src={fit.image}
                  alt={fit.title}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
                />
                
                {/* Top Code Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#2D231E]/80 backdrop-blur-md text-[#FAF8F5] text-[10px] font-mono font-bold rounded-md tracking-wider">
                  {fit.code}
                </div>

                {/* Top Tag Badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#2D5A27] text-white text-[10px] font-mono font-bold rounded-md tracking-wider shadow-sm">
                  {fit.tag}
                </div>

                {/* Hover overlay indicator */}
                <div className="absolute inset-0 bg-[#2D5A27]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-4 py-2 bg-[#2D5A27] text-white text-xs font-bold uppercase rounded-full tracking-wider shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <span>Select Fit</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>

              {/* Card Content & Details */}
              <div className="p-5 flex flex-col flex-1 justify-between bg-white">
                <div>
                  <h3 className="text-base font-bold text-[#2D231E] group-hover:text-[#2D5A27] transition-colors">
                    {fit.title}
                  </h3>
                  <p className="text-xs text-[#6B5E55] mt-1 font-mono">{fit.size}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D9D3C7]/40 flex items-center justify-between text-xs text-[#2D5A27] font-bold font-mono">
                  <span>EXPLORE FIT</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>

    </section>
  );
}
