import React from 'react';

export default function PulsePerks() {
  const perks = [
    {
      id: 1,
      title: 'Free Personal Color Consultation',
      desc: 'Get matched with your ideal color palette by our certified stylists upon ordering.'
    },
    {
      id: 2,
      title: 'Zero-Carbon Sustainable Textiles',
      desc: '100% organic cotton and eco-conscious dyes engineered for long-lasting vibrant color.'
    },
    {
      id: 3,
      title: '30-Day Express Exchange & Guarantee',
      desc: 'Not the perfect fit or undertone? Exchange hassle-free with free return shipping.'
    }
  ];

  return (
    <section className="w-full bg-[#FAF8F5] text-[#2D231E] py-20 px-6 md:px-12 border-b border-[#D9D3C7]">
      <div className="max-w-6xl mx-auto">
        
        {/* Frame 6 Title */}
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#2D231E] tracking-tight mb-12 border-b-2 border-[#2D5A27] pb-4">
          The Pulse Perks
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          
          {/* Featured Banner Left (Primary Brand Green) */}
          <div className="md:col-span-5 bg-[#2D5A27] rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl min-h-80 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
            
            <div className="z-10">
              <span className="text-xs uppercase tracking-widest text-[#D0DEC6] font-bold">Exclusive Benefits</span>
              <h3 className="text-3xl font-extrabold mt-2 leading-tight text-[#FAF8F5]">
                Designed For Everyday Rebels
              </h3>
            </div>

            <div className="z-10 mt-8">
              <p className="text-xs text-[#D0DEC6] leading-relaxed font-medium">
                Premium craftsmanship combined with personal color science.
              </p>
              <div className="mt-4 pt-4 border-t border-[#3E7536] flex items-center justify-between text-xs font-mono text-[#D0DEC6]">
                <span>MEMBER PRIVILEGES</span>
                <span>2026 EDITION</span>
              </div>
            </div>
          </div>

          {/* 3 Perks Stacked Right */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {perks.map((perk, index) => (
              <div 
                key={perk.id}
                className="p-6 bg-[#D0DEC6]/50 rounded-2xl border border-[#D9D3C7] hover:border-[#2D5A27] transition-all hover:bg-white shadow-sm flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#2D231E] text-white flex items-center justify-center font-mono font-bold text-sm shrink-0 group-hover:bg-[#2D5A27] transition-colors">
                  0{index + 1}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#2D231E] group-hover:text-[#2D5A27] transition-colors">
                    {perk.title}
                  </h4>
                  <p className="text-xs text-[#6B5E55] mt-1 leading-relaxed">
                    {perk.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
