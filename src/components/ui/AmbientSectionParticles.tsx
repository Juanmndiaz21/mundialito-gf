import React, { useEffect, useRef } from "react";

export interface AmbientSectionParticlesProps {
  className?: string;
  theme?: "stadium" | "gold" | "crimson";
  densityDivisor?: number;
  maxDpr?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  sway: number;
  phase: number;
  rotation: number;
  spin: number;
  alpha: number;
  color: string;
  depth: number;
}

const THEME_COLORS: Record<string, string[]> = {
  stadium: [
    "rgba(34, 197, 94, 0.65)", // emerald
    "rgba(74, 222, 128, 0.55)", // light green
    "rgba(234, 179, 8, 0.60)", // gold
    "rgba(255, 255, 255, 0.70)", // floodlight white
    "rgba(229, 57, 53, 0.50)", // club red accent
  ],
  gold: [
    "rgba(234, 179, 8, 0.75)",
    "rgba(251, 191, 36, 0.65)",
    "rgba(254, 240, 138, 0.70)",
    "rgba(255, 255, 255, 0.60)",
  ],
  crimson: [
    "rgba(229, 57, 53, 0.70)",
    "rgba(239, 68, 68, 0.60)",
    "rgba(254, 202, 202, 0.60)",
    "rgba(255, 255, 255, 0.50)",
  ],
};

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9283.13) * 43758.5453;
  return x - Math.floor(x);
}

export const AmbientSectionParticles: React.FC<AmbientSectionParticlesProps> = ({
  className = "",
  theme = "stadium",
  densityDivisor = 18000,
  maxDpr = 2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = THEME_COLORS[theme] || THEME_COLORS.stadium;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = mediaQuery.matches;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let animationFrameId = 0;
    let isVisible = false;
    let lastTime = 0;

    const pointer = {
      x: -9999,
      y: -9999,
      force: 0,
    };

    function createParticle(index: number, randomY = true): Particle {
      const depth = 0.25 + pseudoRandom(index + 5) * 0.75;
      const color = colors[Math.floor(pseudoRandom(index + 7) * colors.length)];

      return {
        x: pseudoRandom(index + 1) * width,
        y: randomY ? pseudoRandom(index + 2) * height : height + 15,
        size: 2.5 + depth * 5.5,
        speedY: -(12 + depth * 22), // gentle upward night drift
        speedX: (pseudoRandom(index + 6) - 0.5) * 8,
        sway: 8 + pseudoRandom(index + 3) * 16,
        phase: pseudoRandom(index + 4) * Math.PI * 2,
        rotation: pseudoRandom(index + 8) * Math.PI * 2,
        spin: (pseudoRandom(index + 9) - 0.5) * 1.5,
        alpha: 0.15 + depth * 0.45,
        color,
        depth,
      };
    }

    function resize() {
      if (!canvas || !parent) return;
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = isReducedMotion
        ? 12
        : Math.max(20, Math.min(55, Math.round((width * height) / densityDivisor)));

      particles = Array.from({ length: targetCount }, (_, i) =>
        particles[i] || createParticle(i)
      );

      lastTime = 0;
      draw(0);
    }

    function draw(time: number) {
      if (!ctx) return;
      const dt = lastTime ? Math.min(0.034, (time - lastTime) / 1000) : 0;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!isReducedMotion && dt > 0) {
          // Pointer disturbance
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          const maxDist = 120;

          if (dist < maxDist && pointer.force > 0) {
            const push = (1 - dist / maxDist) * pointer.force * 70 * dt;
            p.x += (dx / Math.max(1, dist)) * push;
            p.y += (dy / Math.max(1, dist)) * push;
          }

          // Gentle ambient flight dynamics
          p.phase += dt * (0.9 + p.depth);
          p.x += (Math.sin(p.phase) * p.sway + p.speedX) * dt;
          p.y += p.speedY * dt;
          p.rotation += p.spin * dt;

          // Recycle particle at the bottom when it drifts off the top
          if (p.y < -20 || p.x < -30 || p.x > width + 30) {
            Object.assign(p, createParticle(i + Math.round(time), false), {
              x: pseudoRandom(i + time) * width,
            });
          }
        }

        // Render particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        // Stadium spark ellipse
        ctx.ellipse(0, 0, p.size * 0.45, p.size, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle specular highlight on larger particles
        if (p.size > 5) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.beginPath();
          ctx.arc(0, -p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      pointer.force *= 0.94;
    }

    function renderLoop(time: number) {
      draw(time);
      if (isVisible && !isReducedMotion && !document.hidden) {
        animationFrameId = requestAnimationFrame(renderLoop);
      } else {
        animationFrameId = 0;
      }
    }

    function startSimulation() {
      if (!animationFrameId && isVisible && !isReducedMotion && !document.hidden) {
        lastTime = 0;
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    }

    function stopSimulation() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    }

    // Pointer handlers on parent container
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.force = 1;
    };

    const handlePointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      pointer.force = 0;
    };

    parent.addEventListener("pointermove", handlePointerMove, { passive: true });
    parent.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    // Observers
    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(parent);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          startSimulation();
        } else {
          stopSimulation();
        }
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(parent);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopSimulation();
      } else if (isVisible) {
        startSimulation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
      if (isReducedMotion) {
        stopSimulation();
        draw(0);
      } else if (isVisible) {
        startSimulation();
      }
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    resize();

    return () => {
      stopSimulation();
      parent.removeEventListener("pointermove", handlePointerMove);
      parent.removeEventListener("pointerleave", handlePointerLeave);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, [theme, densityDivisor, maxDpr]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${className}`.trim()}
    />
  );
};

