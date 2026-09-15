import { useEffect, useRef } from 'react';

// Reveal each [data-reveal] element inside the subtree once, the first time it
// scrolls into view. Pass a signature (a route, say) to re-arm after the
// subtree is replaced. What a reveal looks like is left to the stylesheets.
export default function useScrollReveal(signature) {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.add('revealed');
        observer.unobserve(target);
      });
    }, { threshold: 0.08 });

    const arm = (scope) => {
      if (scope.matches?.('[data-reveal]')) observer.observe(scope);
      scope.querySelectorAll?.('[data-reveal]').forEach((element) => observer.observe(element));
    };

    root.querySelectorAll('[data-reveal]').forEach((element) => element.classList.remove('revealed'));
    // Commit the reset so a re-arm starts a fresh CSS animation.
    void root.offsetWidth;
    arm(root);

    // Most pages fill in after the first paint — products arrive from the API,
    // a filter rebuilds a list — so targets that mount later must be picked up
    // too, or they simply never reveal.
    const mutations = new MutationObserver((records) => {
      records.forEach(({ addedNodes }) => addedNodes.forEach((node) => {
        if (node.nodeType === 1) arm(node);
      }));
    });
    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [signature]);
  return rootRef;
}
