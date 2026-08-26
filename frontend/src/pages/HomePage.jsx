import React from 'react';
import BrandHero from '../components/home/BrandHero';
import ChooseYourFit from '../components/home/ChooseYourFit';
import StreetFavorites from '../components/home/StreetFavorites';
import BrandLoop from '../components/home/BrandLoop';
import VdoSection from '../components/home/VdoSection';
import PulsePerks from '../components/home/PulsePerks';
import JoinDropList from '../components/home/JoinDropList';

export default function HomePage({
  onSelectFit,
  onClaimPromo,
  onAddToCart,
  onQuickView,
  onExploreWarehouse,
  onSubscribe,
}) {
  const handleScrollToFit = () => {
    const el = document.getElementById('fit-guide');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full bg-[#FAF8F5]">
      
      {/* 1. MASTER HERO: Editorial 4-Slice Interactive Lookbook Cover */}
      <section id="brand-hero">
        <BrandHero onShopNow={handleScrollToFit} />
      </section>

      {/* 2. CHOOSE YOUR SILHOUETTE: 2K Studio Model with 6 Borderless Floating Cards */}
      <section id="fit-guide">
        <ChooseYourFit onSelectFit={onSelectFit} />
      </section>

      {/* 3. STREET FAVORITES & ARCHIVE: Continuous Framed Carousel with Real Product Shots */}
      <section id="street-favorites">
        <StreetFavorites 
          onAddToCart={onAddToCart} 
          onQuickView={onQuickView}
          onExploreCatalog={onExploreWarehouse}
        />
      </section>

      {/* ReactVibe Infinite Brand Loop Ticker */}
      <BrandLoop />

      {/* 4. CINEMATIC TEXTURE REEL: Urban Motion Video + 15% Special Promo Glass Card */}
      <section id="cinematic-reel">
        <VdoSection onClaimPromo={onClaimPromo} />
      </section>

      {/* 5. THE PULSE PERKS: 3D Rotating Model Card + 3-Tier Benefit Grid */}
      <section id="pulse-perks">
        <PulsePerks />
      </section>

      {/* 6. VIP METAL PASS & JOIN DROP LIST: 3D Black Card + Newsletter Access */}
      <section id="vip-drop">
        <JoinDropList onSubscribe={onSubscribe} />
      </section>

    </div>
  );
}
