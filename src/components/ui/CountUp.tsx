import React, { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  decimals?: number;
  decimalSeparator?: string;
  thousandSeparator?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * React Bits CountUp Component
 * Smoothly interpolates numeric values on view entry using spring/ease physics.
 */
export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 1.4,
  className = "",
  decimals = 0,
  decimalSeparator = ",",
  thousandSeparator = ".",
  prefix = "",
  suffix = "",
}) => {
  const [value, setValue] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setValue(to);
      return;
    }

    if (!inView) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const startVal = direction === "down" ? to : from;
    const endVal = direction === "down" ? from : to;

    const timeout = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = (timestamp - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out quart
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = startVal + (endVal - startVal) * ease;
        setValue(current);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setValue(endVal);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, [inView, to, from, direction, delay, duration, reduced]);

  const formatted = (() => {
    const parts = value.toFixed(decimals).split(".");
    const integerPart = parts[0].replace(
      /\B(?=(\d{3})+(?!\d))/g,
      thousandSeparator
    );
    return decimals > 0 && parts[1]
      ? `${integerPart}${decimalSeparator}${parts[1]}`
      : integerPart;
  })();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

