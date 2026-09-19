import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';

/* Shared motion primitives.

   Two behaviours cover the whole home page: something arrives once when it is
   scrolled to (Reveal), and something drifts against the scroll for depth
   (Parallax). Keeping both here means a single place decides what the house
   easing is and what happens under prefers-reduced-motion.

   Neither primitive ever hides content permanently. A Reveal that is never
   observed is still painted by the browser at its `whileInView` state, and a
   Parallax without script is a plain wrapper — a failed animation costs layout
   nothing. */

// Fast departure, long settle, no overshoot. Deliberately the same curve the
// CSS motion layer already uses, so a Motion reveal and a CSS reveal elsewhere
// on the site read as one system rather than two.
export const EASE = [0.16, 1, 0.3, 1];

/** Plays once, the first time the element scrolls into view. */
export function Reveal({
  children,
  y = 28,
  x = 0,
  scale = 1,
  delay = 0,
  duration = 0.7,
  amount = 0.2,
  className = '',
  style,
  ...rest
}) {
  const reduced = useReducedMotion();

  // Reduced motion reduces rather than removes: the travel is dropped, the
  // fade stays, so the page still reads as alive without anything sliding.
  const from = reduced ? { opacity: 0 } : { opacity: 0, y, x, scale };

  return (
    <motion.div
      className={className}
      style={style}
      initial={from}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, amount }}
      transition={{ duration: reduced ? 0.4 : duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Drifts its contents against the scroll while the section crosses the screen.

    `distance` is half the total travel in pixels: the child starts `distance`
    below its layout position and ends `distance` above it. Give background and
    far elements a small number and foreground elements a larger one — the gap
    between the two is what reads as depth.

    The measured element and the moving element are deliberately different
    nodes. Measuring a node that is itself being translated feeds the transform
    back into the scroll progress that produced it, and the drift creeps. */
export function Parallax({
  children,
  distance = 60,
  className = '',
  innerClassName = '',
  style,
  ...rest
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Springing the scroll value lets the drift carry a beat past the last wheel
  // frame instead of stopping dead, which is what makes it sit with Lenis.
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [distance, -distance]), {
    stiffness: 140,
    damping: 30,
    mass: 0.3,
  });

  return (
    <div ref={ref} className={className} style={style} {...rest}>
      <motion.div className={innerClassName} style={reduced ? undefined : { y }}>
        {children}
      </motion.div>
    </div>
  );
}
