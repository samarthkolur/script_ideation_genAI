"use client";

/**
 * Container/item pair for staggered list reveals (variant grids, feature
 * cards, project cards) — each item fades+rises in ~50ms after the last,
 * so a freshly-generated set of variants visibly "arrives" rather than
 * popping in all at once. Subtle by design (DD-024): a short rise, no
 * scale/bounce — motion here signals "list changed," nothing more.
 */

import { motion, type Variants } from "motion/react";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

export function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
