import { useLayoutEffect, useRef } from 'react';

// Animate committed UI changes without remounting inputs or losing focus.
export default function useChangeMotion(signature, mode = 'panel') {
  const ref = useRef(null);
  const previous = useRef(new Map());
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root?.animate) return;
    // Reduce, don't remove: the same beats play, minus the travel.
    const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const animations = [];
    const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
    if (mode === 'outfit') {
      const items = Array.from(root.querySelectorAll('[data-motion-item]'));
      const changed = items.filter(item => previous.current.get(item.dataset.motionSlot) !== item.dataset.motionItem);
      changed.forEach((item, index) => {
        animations.push(item.animate(reduced ? [
          { opacity: 0.4, backgroundColor: '#D0DEC6' },
          { opacity: 1, backgroundColor: '#FFFFFF' },
        ] : [
          { opacity: 0.4, transform: 'translateX(12px)', backgroundColor: '#D0DEC6' },
          { opacity: 1, transform: 'translateX(0)', backgroundColor: '#FFFFFF' },
        ], { duration: 420, delay: changed.length > 1 ? index * 65 : 0, easing: ease, fill: 'backwards' }));
      });
      previous.current = new Map(items.map(item => [item.dataset.motionSlot, item.dataset.motionItem]));
    } else if (mode === 'grid') {
      Array.from(root.children).slice(0, 12).forEach((item, index) => {
        animations.push(item.animate(reduced
          ? [{ opacity: 0.35 }, { opacity: 1 }]
          : [{ opacity: 0.35, translate: '0 12px' }, { opacity: 1, translate: '0 0' }],
          { duration: 320, delay: Math.min(index * 25, 150), easing: ease, fill: 'backwards' }));
      });
    } else {
      animations.push(root.animate(mode === 'route' || reduced
        ? [{ opacity: 0.4 }, { opacity: 1 }]
        : [{ opacity: 0.35, translate: '10px 0' }, { opacity: 1, translate: '0 0' }],
      { duration: mode === 'route' ? 240 : 300, easing: ease }));
    }
    return () => animations.forEach(animation => animation.cancel());
  }, [signature, mode]);
  return ref;
}
