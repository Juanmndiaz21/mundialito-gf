import React, { useRef } from "react";
import { motion, useInView, useReducedMotion, type Variants, type Transition } from "motion/react";

interface InViewProps {
  children: React.ReactNode;
  variants?: Variants;
  transition?: Transition;
  viewOptions?: {
    once?: boolean;
    amount?: number | "some" | "all";
  };
  className?: string;
}

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const defaultTransition: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
};

/**
 * Motion Primitives InView Component
 * Animates elements cleanly when entering the viewport.
 */
export const InView: React.FC<InViewProps> = ({
  children,
  variants = defaultVariants,
  transition = defaultTransition,
  viewOptions = { once: true, amount: 0.2 },
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, viewOptions);
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
};
