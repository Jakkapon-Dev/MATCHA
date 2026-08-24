import React, { useEffect, useRef, useState } from 'react';

/**
 * Reusable Scroll Reveal component that animates its children
 * smoothly from subtle blur + offset to crystal clear focus when scrolled into view.
 */
export default function ScrollReveal({ 
  children, 
  className = '', 
  delay = 0, 
  direction = 'up', // 'up', 'down', 'none'
  threshold = 0.15 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    const currentElem = elementRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      if (currentElem) {
        observer.unobserve(currentElem);
      }
    };
  }, [threshold]);

  const getInitialTransform = () => {
    if (direction === 'up') return 'translate-y-8';
    if (direction === 'down') return '-translate-y-8';
    return 'translate-y-0';
  };

  return (
    <div
      ref={elementRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-800 ease-out transform ${
        isVisible
          ? 'opacity-100 translate-y-0 filter-none'
          : `opacity-0 ${getInitialTransform()} blur-[4px]`
      } ${className}`}
    >
      {children}
    </div>
  );
}
