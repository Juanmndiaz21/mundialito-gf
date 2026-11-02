import React, { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

interface CardSpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  radius?: number;
  color?: string;
  className?: string;
}

/**
 * Aceternity UI CardSpotlight Component
 * Casts a cursor-tracked radial glow over the card surface on hover.
 */
export const CardSpotlight: React.FC<CardSpotlightProps> = ({
  children,
  radius = 260,
  color = "rgba(255, 95, 31, 0.14)",
  className = "",
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {!reduced && isHovered && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            background: `radial-gradient(${radius}px circle at ${coords.x}px ${coords.y}px, ${color}, transparent 80%)`,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
};

