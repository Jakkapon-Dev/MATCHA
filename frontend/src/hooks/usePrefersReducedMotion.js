import { useEffect, useState } from 'react';

// Track the OS "reduce motion" setting so motion can opt out at runtime.
const QUERY = '(prefers-reduced-motion: reduce)';

export default function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches,
  );
  useEffect(() => {
    const media = window.matchMedia?.(QUERY);
    if (!media) return;
    const handleChange = (event) => setPrefersReduced(event.matches);
    setPrefersReduced(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);
  return prefersReduced;
}
