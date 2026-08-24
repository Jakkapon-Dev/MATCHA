import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function ChooseYourFit({ onSelectFit }) {
  const [activeFit, setActiveFit] = useState(null);

  const fits = [
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

  return (
    <section className="w-full bg-[#FAF8F5] text-[#2D231E] py-20 px-4 sm:px-8 lg:px-12 border-b border-[#D9D3C7] relative">
      
      {/* Title Header */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between mb-14">
        <div>
          <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#BC5A36] uppercase">
            SIGNATURE SILHOUETTES
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#2D231E] tracking-tight mt-1">
            Choose Your Fit
          </h2>
        </div>
        <p className="text-xs text-[#6B5E55] max-w-xs mt-3 sm:mt-0 font-mono leading-relaxed">
          Crafted in premium Japanese & organic fabrics, tailored for every individual aesthetic and colorway.
        </p>
      </div>

      {/* Grid of 4 Multi-Color Fit Showcase Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {fits.map((fit) => (
          <div
            key={fit.id}
            onMouseEnter={() => setActiveFit(fit.id)}
            onMouseLeave={() => setActiveFit(null)}
            onClick={() => onSelectFit(fit)}
            className="cursor-pointer flex flex-col bg-white rounded-2xl border border-[#D9D3C7] shadow-md hover:shadow-xl hover:border-[#2D5A27] transition-all duration-300 overflow-hidden group relative"
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
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#2D5A27] text-white text-[10px] font-mono font-bold rounded-md tracking-wider">
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

    </section>
  );
}
