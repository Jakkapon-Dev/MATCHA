import React from 'react';
import { Plus } from 'lucide-react';

export default function LastCallWarehouse({ onAddToCart, onQuickView, onExploreWarehouse }) {
  // Archive clearance products from warehouse matching the reference screenshot
  const warehouseProducts = [
    {
      id: 'LC-01',
      name: 'Camouflage Bandana',
      price: '$9.99',
      image: '/images/products/standalone/silk_scarf.jpg',
      category: 'Accessories',
    },
    {
      id: 'LC-02',
      name: 'Balloon Jeans',
      price: '$9.99',
      image: '/images/products/winter/bottoms/jeans/color_2_cobalt.jpeg',
      category: 'Denim',
    },
    {
      id: 'LC-03',
      name: 'Asymmetrical Lace Skirt',
      price: '$9.99',
      image: '/images/products/standalone/peach_skirt.jpg',
      category: 'Skirts',
    },
    {
      id: 'LC-04',
      name: 'Strawberry Striped Tee',
      price: '$9.99',
      image: '/images/products/spring/tops/polo-shirts/color_1_coral.jpeg',
      category: 'T-Shirts',
    },
  ];

  return (
    <section id="warehouse-sale" className="w-full bg-[#FAF8F5] text-[#2D231E] py-16 sm:py-24 px-4 sm:px-8 lg:px-12 border-b border-[#D9D3C7] overflow-hidden select-none">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Grid: Left side has Title + Product list; Right side has Lookbook Model + Black Cutout Typography */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (Col 1-7): Header & Horizontal Product Grid */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            
            {/* Title matching reference */}
            <div className="mb-8 sm:mb-12">
              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#BC5A36] tracking-tight font-sans leading-none">
                Last Call<br />Warehouse
              </h2>
            </div>

            {/* Horizontal Product Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {warehouseProducts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onQuickView && onQuickView(item)}
                  className="flex flex-col group cursor-pointer"
                >
                  {/* Clean White Image Box with Bottom-Right '+' Button */}
                  <div className="relative w-full aspect-4/5 bg-white border border-[#D9D3C7] overflow-hidden p-3 flex items-center justify-center shadow-xs group-hover:border-[#BC5A36] transition-colors">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* '+' Quick Add Button in Bottom Right Corner */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart && onAddToCart(item);
                      }}
                      title="Quick Add"
                      className="absolute bottom-2 right-2 w-6 h-6 bg-white hover:bg-[#BC5A36] text-[#BC5A36] hover:text-white border border-[#BC5A36]/40 flex items-center justify-center transition-colors shadow-xs active:scale-90 cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Product Title and Price underneath in Terracotta Orange */}
                  <div className="mt-2 flex justify-between items-baseline gap-1 text-[10px] sm:text-xs font-mono text-[#BC5A36] font-medium">
                    <span className="truncate group-hover:underline">{item.name}</span>
                    <span className="font-bold shrink-0">{item.price}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column (Col 8-12): Impactful Lookbook Model with Stacked Black Highlight Cutout Typography */}
          <div className="lg:col-span-6 relative aspect-4/5 sm:aspect-square lg:aspect-4/5 max-h-160 rounded-none overflow-hidden bg-[#FAF8F5] flex items-center justify-center">
            
            {/* Background Model Image */}
            <img
              src="/images/studio_white_bg/standing_straight/spring/studio_straight_spring_wearing_mustard_yellow_blazer_001.jpeg"
              alt="MatchA Archive Warehouse Model"
              className="w-full h-full object-cover object-top opacity-95"
            />

            {/* Subtle Gradient Veil */}
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Stacked Black Sticker Badge Typography (Exact Match to Reference Screenshot) */}
            <div 
              onClick={onExploreWarehouse}
              className="absolute inset-0 flex flex-col items-center justify-center p-4 cursor-pointer group"
            >
              <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-center font-sans uppercase font-black tracking-tight text-white transition-transform duration-300 group-hover:scale-105">
                <span className="bg-black px-3.5 py-0.5 sm:py-1 text-base sm:text-2xl lg:text-3xl leading-tight shadow-md">
                  Steal These
                </span>
                <span className="bg-black px-3.5 py-0.5 sm:py-1 text-base sm:text-2xl lg:text-3xl leading-tight shadow-md">
                  Archive
                </span>
                <span className="bg-black px-3.5 py-0.5 sm:py-1 text-base sm:text-2xl lg:text-3xl leading-tight shadow-md">
                  Pieces
                </span>
                <span className="bg-black px-3.5 py-0.5 sm:py-1 text-base sm:text-2xl lg:text-3xl leading-tight shadow-md">
                  Before They
                </span>
                <span className="bg-black px-3.5 py-0.5 sm:py-1 text-base sm:text-2xl lg:text-3xl leading-tight shadow-md">
                  Disappear
                </span>
                <span className="bg-black px-3.5 py-0.5 sm:py-1 text-base sm:text-2xl lg:text-3xl leading-tight shadow-md">
                  Forever. No
                </span>
                <span className="bg-black px-3.5 py-0.5 sm:py-1 text-base sm:text-2xl lg:text-3xl leading-tight shadow-md">
                  Restocks Are
                </span>
                <span className="bg-black px-3.5 py-0.5 sm:py-1 text-base sm:text-2xl lg:text-3xl leading-tight shadow-md">
                  Planned For
                </span>
                <span className="bg-black px-3.5 py-0.5 sm:py-1 text-base sm:text-2xl lg:text-3xl leading-tight shadow-md">
                  These Items
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
