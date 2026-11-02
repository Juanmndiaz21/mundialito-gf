import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
}

/**
 * React Bits BlurText Component
 * Animates text reveals with soft directional blur and progressive stagger.
 */
export const BlurText: React.FC<BlurTextProps> = ({
  text,
  delay = 50,
  className = "",
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
}) => {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  const reduced = useReducedMotion();

  if (reduced) {
    return <span className={className}>{text}</span>;
  }

  const defaultFrom =
    direction === "top"
      ? { filter: "blur(10px)", opacity: 0, transform: "translate3d(0, -20px, 0)" }
      : { filter: "blur(10px)", opacity: 0, transform: "translate3d(0, 20px, 0)" };

  const defaultTo = {
    filter: "blur(0px)",
    opacity: 1,
    transform: "translate3d(0, 0, 0)",
  };

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {elements.map((element, index) => (
        <motion.span
          key={index}
          initial={defaultFrom}
          animate={inView ? defaultTo : defaultFrom}
          transition={{
            duration: 0.5,
            delay: (index * delay) / 1000,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="inline-block"
        >
          {element}
          {animateBy === "words" && index < elements.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </span>
  );
};

