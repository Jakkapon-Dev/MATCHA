import React from 'react';
import WelcomeIntro from '../components/WelcomeIntro';

export default function LandingPage({ onEnterWebsite }) {
  return (
    <div className="w-full min-h-screen bg-[#1A2218]">
      {/* Frame 1: Welcome Intro Screen with Enter Website CTA */}
      <WelcomeIntro onEnterWebsite={onEnterWebsite} />
    </div>
  );
}
