import React, { useRef, useState } from 'react';

/**
 * ReactVibe-inspired SpotlightCard:
 * Tracks the mouse cursor over the card surface and casts an interactive
 * radial spotlight glow that highlights textures and borders.
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(188, 90, 54, 0.12)', // MatchA Terracotta
  borderColor = 'rgba(45, 90, 39, 0.3)', // MatchA Green
  ...props
}) {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl border border-[#D9D3C7] bg-white transition-colors duration-300 ${className}`}
      {...props}
    >
      {/* Interactive Radial Spotlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 z-10"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 75%)`,
        }}
      />
      {children}
    </div>
  );
}
