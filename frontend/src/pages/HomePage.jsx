import React from 'react';
import BrandHero from '../components/BrandHero';
import ChooseYourFit from '../components/ChooseYourFit';
import VdoSection from '../components/VdoSection';
import PulsePerks from '../components/PulsePerks';
import StreetFavorites from '../components/StreetFavorites';
import LastCallWarehouse from '../components/LastCallWarehouse';
import JoinDropList from '../components/JoinDropList';
import ScrollReveal from '../components/ScrollReveal';

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
    <div className="w-full">
      {/* Frame 1: MatchA Brand Hero Editorial Lookbook */}
      <div id="brand-hero" />
      <BrandHero onShopNow={handleScrollToFit} />

      {/* Frame 2: Choose Your Fit / Mix & Match */}
      <div id="fit-guide" />
      <ScrollReveal delay={100}>
        <ChooseYourFit onSelectFit={onSelectFit} />
      </ScrollReveal>

      {/* Frame 3: VDO & Promo Banner */}
      <div id="cinematic-reel" />
      <ScrollReveal delay={150}>
        <VdoSection onClaimPromo={onClaimPromo} />
      </ScrollReveal>

      {/* Frame 4: The Pulse Perks */}
      <div id="pulse-perks" />
      <ScrollReveal delay={150}>
        <PulsePerks />
      </ScrollReveal>

      {/* Frame 5: Street Favorites */}
      <div id="street-favorites" />
      <ScrollReveal delay={150}>
        <StreetFavorites onAddToCart={onAddToCart} onQuickView={onQuickView} />
      </ScrollReveal>

      {/* Frame 6: Last Call Warehouse */}
      <div id="warehouse-sale" />
      <ScrollReveal delay={150}>
        <LastCallWarehouse onExploreWarehouse={onExploreWarehouse} />
      </ScrollReveal>

      {/* Frame 7: Join The Drop List */}
      <ScrollReveal delay={200}>
        <JoinDropList onSubscribe={onSubscribe} />
      </ScrollReveal>
    </div>
  );
}
