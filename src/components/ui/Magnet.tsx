import React, { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

interface MagnetProps {
  children: React.ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  className?: string;
  id?: string;
}

/**
 * React Bits Magnet Component
 * Gently pulls interactive targets toward the cursor on proximity.
 */
export const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 30,
  disabled = false,
  magnetStrength = 2.5,
  className = "",
  id,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || reduced || !ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distX = Math.abs(centerX - e.clientX);
    const distY = Math.abs(centerY - e.clientY);

    if (distX < width / 2 + padding && distY < height / 2 + padding) {
      setPosition({
        x: (e.clientX - centerX) / magnetStrength,
        y: (e.clientY - centerY) / magnetStrength,
      });
    } else {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  if (disabled || reduced) {
    return (
      <div id={id} className={`inline-block ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", damping: 15, stiffness: 150, mass: 0.1 }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};
