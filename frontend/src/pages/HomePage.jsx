import React from 'react';
import BrandHero from '../components/BrandHero';
import ChooseYourFit from '../components/ChooseYourFit';
import StreetFavorites from '../components/StreetFavorites';
import VdoSection from '../components/VdoSection';
import PulsePerks from '../components/PulsePerks';
import JoinDropList from '../components/JoinDropList';
import ScrollReveal from '../components/ScrollReveal';

export default function HomePage({
  onSelectFit,
  onClaimPromo,
  onAddToCart,
  onQuickView,
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
        <ScrollReveal delay={50}>
          <ChooseYourFit onSelectFit={onSelectFit} />
        </ScrollReveal>
      </section>

      {/* 3. STREET FAVORITES & ARCHIVE: Continuous Framed Carousel with Real Product Shots */}
      <section id="street-favorites">
        <ScrollReveal delay={50}>
          <StreetFavorites onAddToCart={onAddToCart} onQuickView={onQuickView} />
        </ScrollReveal>
      </section>

      {/* 4. CINEMATIC TEXTURE REEL: Urban Motion Video + 15% Special Promo Glass Card */}
      <section id="cinematic-reel">
        <ScrollReveal delay={50}>
          <VdoSection onClaimPromo={onClaimPromo} />
        </ScrollReveal>
      </section>

      {/* 5. THE PULSE PERKS: 3D Rotating Model Card + 3-Tier Benefit Grid */}
      <section id="pulse-perks">
        <ScrollReveal delay={50}>
          <PulsePerks />
        </ScrollReveal>
      </section>

      {/* 6. VIP METAL PASS & JOIN DROP LIST: 3D Black Card + Newsletter Access */}
      <section id="vip-drop">
        <ScrollReveal delay={50}>
          <JoinDropList onSubscribe={onSubscribe} />
        </ScrollReveal>
      </section>

    </div>
  );
}
