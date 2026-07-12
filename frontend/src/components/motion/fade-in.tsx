"use client";

/**
 * Standard mount animation — a short fade + 6px rise, tween-eased. Motion
 * is used sparingly in this system (DD-024): no spring overshoot, no
 * bounce, nothing that draws attention to itself — the point is that
 * content settles in rather than pops in, not that the motion is felt.
 * `viewport` defaults to false (animate on mount); set true for
 * whileInView on long pages so sections below the fold animate in on
 * scroll instead of all at once.
 *
 * Deliberately not variants-based: a static variants object doesn't merge
 * per-instance `delay` into its own transition cleanly (the variant's
 * transition wins over a component-level `transition` prop), so the
 * transition + delay are composed directly per instance instead.
 */

import { motion } from "motion/react";

export function FadeIn({
  children,
  delay = 0,
  className,
  viewport = false,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  viewport?: boolean;
}) {
  const animateProps = { opacity: 1, y: 0 };
  const initial = { opacity: 0, y: 6 };
  const transition = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const, delay };

  if (viewport) {
    return (
      <motion.div
        initial={initial}
        whileInView={animateProps}
        viewport={{ once: true, margin: "-80px" }}
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div initial={initial} animate={animateProps} transition={transition} className={className}>
      {children}
    </motion.div>
  );
}
