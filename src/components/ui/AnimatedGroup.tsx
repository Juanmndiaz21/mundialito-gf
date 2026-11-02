import React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

interface AnimatedGroupProps {
  children: React.ReactNode;
  className?: string;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  preset?: "fade" | "slide" | "scale" | "blur-slide";
}

const defaultPresets: Record<
  "fade" | "slide" | "scale" | "blur-slide",
  { container: Variants; item: Variants }
> = {
  fade: {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
      },
    },
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.4 } },
    },
  },
  slide: {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.09 },
      },
    },
    item: {
      hidden: { opacity: 0, y: 16 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 280, damping: 24 },
      },
    },
  },
  scale: {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
      },
    },
    item: {
      hidden: { opacity: 0, scale: 0.94 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 22 },
      },
    },
  },
  "blur-slide": {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
      },
    },
    item: {
      hidden: { opacity: 0, filter: "blur(6px)", y: 14 },
      visible: {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
      },
    },
  },
};

/**
 * Motion Primitives AnimatedGroup Component
 * Staggers animations across child elements with curated motion presets.
 */
export const AnimatedGroup: React.FC<AnimatedGroupProps> = ({
  children,
  className = "",
  variants,
  preset = "slide",
}) => {
  const reduced = useReducedMotion();
  const selectedPreset = variants || defaultPresets[preset];

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={selectedPreset.container}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={selectedPreset.item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
