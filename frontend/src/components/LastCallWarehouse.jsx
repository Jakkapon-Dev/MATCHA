import React, { useState } from 'react';

export default function LastCallWarehouse({ onExploreWarehouse }) {
  const [slide1Index, setSlide1Index] = useState(0);
  const [slide2Index, setSlide2Index] = useState(0);

  const slide1Images = [
    { title: 'Warehouse Archive - Batch A', tag: 'Up to 50% Off' },
    { title: 'Warehouse Archive - Batch B', tag: 'Limited Stock' }
  ];

  const slide2Images = [
    { title: 'Last Call Fit - Season 1', tag: 'Final Sale' },
    { title: 'Last Call Fit - Season 2', tag: 'Clearance' }
  ];

  return (
    <section className="w-full bg-[#FAF8F5] text-[#2D231E] py-20 px-6 md:px-12 border-b border-[#D9D3C7]">
      <div className="max-w-6xl mx-auto">
        
        {/* Frame 8 Title */}
        <div className="mb-12">
          <span className="text-xs uppercase tracking-widest text-[#BC5A36] font-bold">Clearance Event</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#2D231E] tracking-tight mt-1">
            Last Call Warehouse
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: 2 Slide Containers */}
          <div className="md:col-span-5 flex flex-col gap-6">
            
            {/* Slide Box 1 */}
            <div className="p-6 bg-[#D0DEC6]/50 rounded-3xl border border-[#D9D3C7] flex flex-col justify-between relative shadow-sm hover:border-[#2D5A27] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold font-mono text-[#2D5A27] uppercase tracking-wider">
                  สไลด์รูป #1 (Slideshow)
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-[#2D231E] text-white rounded-full font-mono">
                  {slide1Index + 1} / {slide1Images.length}
                </span>
              </div>

              <div className="p-6 bg-[#FAF8F5] rounded-2xl border border-[#D9D3C7] text-center py-8">
                <span className="text-3xl">📦</span>
                <h4 className="text-base font-bold text-[#2D231E] mt-2">
                  {slide1Images[slide1Index].title}
                </h4>
                <p className="text-xs text-[#BC5A36] font-bold font-mono mt-1">
                  {slide1Images[slide1Index].tag}
                </p>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setSlide1Index((prev) => (prev === 0 ? slide1Images.length - 1 : prev - 1))}
                  className="px-3 py-1 bg-white border border-[#D9D3C7] hover:bg-[#2D231E] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setSlide1Index((prev) => (prev === slide1Images.length - 1 ? 0 : prev + 1))}
                  className="px-3 py-1 bg-white border border-[#D9D3C7] hover:bg-[#2D231E] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Slide Box 2 */}
            <div className="p-6 bg-[#D0DEC6]/50 rounded-3xl border border-[#D9D3C7] flex flex-col justify-between relative shadow-sm hover:border-[#2D5A27] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold font-mono text-[#2D5A27] uppercase tracking-wider">
                  สไลด์รูป #2 (Slideshow)
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-[#2D231E] text-white rounded-full font-mono">
                  {slide2Index + 1} / {slide2Images.length}
                </span>
              </div>

              <div className="p-6 bg-[#FAF8F5] rounded-2xl border border-[#D9D3C7] text-center py-8">
                <span className="text-3xl">🏷️</span>
                <h4 className="text-base font-bold text-[#2D231E] mt-2">
                  {slide2Images[slide2Index].title}
                </h4>
                <p className="text-xs text-[#BC5A36] font-bold font-mono mt-1">
                  {slide2Images[slide2Index].tag}
                </p>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setSlide2Index((prev) => (prev === 0 ? slide2Images.length - 1 : prev - 1))}
                  className="px-3 py-1 bg-white border border-[#D9D3C7] hover:bg-[#2D231E] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setSlide2Index((prev) => (prev === slide2Images.length - 1 ? 0 : prev + 1))}
                  className="px-3 py-1 bg-white border border-[#D9D3C7] hover:bg-[#2D231E] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Large Warehouse Banner */}
          <div className="md:col-span-7 bg-[#2D5A27] rounded-3xl p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group min-h-100">
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            <div className="z-10">
              <span className="text-xs uppercase tracking-widest text-[#D0DEC6] font-bold">WAREHOUSE ARCHIVE</span>
              <h3 className="text-4xl sm:text-5xl font-extrabold mt-3 uppercase tracking-tight text-[#FAF8F5]">
                Warehouse Sale
              </h3>
              <p className="text-xs text-[#D0DEC6] mt-2 max-w-sm font-medium leading-relaxed">
                Exclusive archive pieces & last sizes before permanent retirement.
              </p>
            </div>

            <div className="z-10 mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs font-mono text-[#D0DEC6]">
                <span>STOCK STATUS: LAST FEW PIECES</span>
              </div>
              <button 
                onClick={onExploreWarehouse}
                className="px-6 py-3 bg-[#BC5A36] hover:bg-[#A64C2B] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                Explore Warehouse →
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
