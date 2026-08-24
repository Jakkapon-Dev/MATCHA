import React from 'react';
import BrandHero from '../components/BrandHero';
import ChooseYourFit from '../components/ChooseYourFit';
import VdoSection from '../components/VdoSection';
import PulsePerks from '../components/PulsePerks';
import StreetFavorites from '../components/StreetFavorites';
import LastCallWarehouse from '../components/LastCallWarehouse';
import JoinDropList from '../components/JoinDropList';

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
      {/* Frame 2 & 3: MatchA Brand Hero Editorial Lookbook */}
      <div id="brand-hero" />
      <BrandHero onShopNow={handleScrollToFit} />

      {/* Frame 4: Choose Your Fit / Mix & Match */}
      <div id="fit-guide" />
      <ChooseYourFit onSelectFit={onSelectFit} />

      {/* Frame 5: VDO & Promo Banner */}
      <VdoSection onClaimPromo={onClaimPromo} />

      {/* Frame 6: The Pulse Perks */}
      <div id="pulse-perks" />
      <PulsePerks />

      {/* Frame 7: Street Favorites */}
      <div id="street-favorites" />
      <StreetFavorites onAddToCart={onAddToCart} onQuickView={onQuickView} />

      {/* Frame 8: Last Call Warehouse */}
      <div id="warehouse-sale" />
      <LastCallWarehouse onExploreWarehouse={onExploreWarehouse} />

      {/* Frame 9: Join The Drop List */}
      <JoinDropList onSubscribe={onSubscribe} />
    </div>
  );
}
