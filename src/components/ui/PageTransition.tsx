import React from "react";
import { motion, useReducedMotion } from "motion/react";

interface PageTransitionProps {
  viewKey: string;
  children: React.ReactNode;
}

/**
 * Transitions.dev PageTransition Component
 * Fluid spring-based page transition with subtle depth scaling and opacity fade.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  viewKey,
  children,
}) => {
  const reduced = useReducedMotion();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={viewKey}
      initial={{ opacity: 0, y: 8, scale: 0.998 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 28,
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};
