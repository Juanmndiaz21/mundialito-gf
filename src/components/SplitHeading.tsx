import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "./MotionSystem";

interface SplitHeadingProps {
  as?: "h1" | "h2" | "h3";
  id?: string;
  text: string;
  className?: string;
}

export const SplitHeading: React.FC<SplitHeadingProps> = ({
  as: Tag = "h1",
  id,
  text,
  className = "",
}) => {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const words = text.trim().split(/\s+/);

  useEffect(() => {
    const el = headingRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const targets = el.querySelectorAll("[data-split-word]");
      if (targets.length === 0) return;
      gsap.fromTo(
        targets,
        { yPercent: 32 },
        {
          yPercent: 0,
          duration: 0.46,
          stagger: 0.032,
          ease: "expo.out",
          clearProps: "transform",
        }
      );
    }, el);

    return () => ctx.revert();
  }, [text]);

  return (
    <Tag ref={headingRef} id={id} aria-label={text} className={className}>
      {words.map((word, idx) => (
        <React.Fragment key={`${word}-${idx}`}>
          <span
            aria-hidden="true"
            className="inline-block overflow-hidden align-bottom"
          >
            <span data-split-word className="inline-block">
              {word}
            </span>
          </span>
          {idx < words.length - 1 ? " " : ""}
        </React.Fragment>
      ))}
    </Tag>
  );
};
