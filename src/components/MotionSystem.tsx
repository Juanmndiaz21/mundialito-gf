import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.11,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    let active = true;
    if (document.fonts && document.fonts.ready) {
      void document.fonts.ready.then(() => {
        if (active) ScrollTrigger.refresh();
      });
    }

    return () => {
      active = false;
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
};

export function useViewChoreography<T extends HTMLElement>(
  deps: React.DependencyList = []
): React.RefObject<T | null> {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const hero = el.querySelector<HTMLElement>("[data-animate='hero']");
      if (hero) {
        gsap.fromTo(
          hero,
          { y: 10 },
          {
            y: 0,
            duration: 0.45,
            ease: "expo.out",
            clearProps: "transform",
          }
        );
      }
    }, el);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}
