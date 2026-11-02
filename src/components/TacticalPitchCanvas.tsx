import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Phase } from "../domain/types";
import { PHASE_ORDER } from "../domain/campaigns";
import { prefersReducedMotion } from "./MotionSystem";

interface TacticalPitchCanvasProps {
  nextPhase: Phase | null;
  campaignIndex: number;
  winsToTitle: number;
}

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uActiveIndex;
  uniform vec2 uPointer;

  float boxLine(vec2 uv, vec2 minB, vec2 maxB, float thickness) {
    vec2 dMin = abs(uv - minB);
    vec2 dMax = abs(uv - maxB);
    bool inX = uv.x >= minB.x - thickness && uv.x <= maxB.x + thickness;
    bool inY = uv.y >= minB.y - thickness && uv.y <= maxB.y + thickness;
    float edgeX = min(dMin.x, dMax.x);
    float edgeY = min(dMin.y, dMax.y);
    float hLine = inX ? smoothstep(thickness, thickness * 0.25, edgeY) : 0.0;
    float vLine = inY ? smoothstep(thickness, thickness * 0.25, edgeX) : 0.0;
    return max(hLine, vLine);
  }

  void main() {
    vec2 uv = vUv;

    vec3 baseDark = vec3(0.043, 0.059, 0.047);
    vec3 surfaceGreen = vec3(0.075, 0.102, 0.082);
    vec3 lineGreen = vec3(0.133, 0.773, 0.369);
    vec3 goldTone = vec3(0.918, 0.702, 0.031);

    float stripe = step(0.5, fract(uv.x * 10.0));
    vec3 col = mix(baseDark, surfaceGreen, stripe * 0.35 + 0.25);

    float outer = boxLine(uv, vec2(0.06, 0.10), vec2(0.94, 0.90), 0.0045);
    float midLine = smoothstep(0.004, 0.001, abs(uv.x - 0.5)) *
                    step(0.10, uv.y) * step(uv.y, 0.90);
    float centerDist = length((uv - vec2(0.5, 0.5)) * vec2(1.6, 1.0));
    float centerCircle = smoothstep(0.005, 0.001, abs(centerDist - 0.14));
    float leftArea = boxLine(uv, vec2(0.06, 0.28), vec2(0.20, 0.72), 0.004);
    float rightArea = boxLine(uv, vec2(0.80, 0.28), vec2(0.94, 0.72), 0.004);

    float pitchLines = max(max(outer, midLine), max(centerCircle, max(leftArea, rightArea)));
    col = mix(col, lineGreen, pitchLines * 0.34);

    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      vec2 nodePos = vec2(0.16 + fi * 0.17, 0.50 + sin(fi * 1.4) * 0.14);
      float d = length((uv - nodePos) * vec2(1.55, 1.0));
      float isCompleted = step(fi, uActiveIndex - 0.5);
      float isCurrent = 1.0 - step(0.4, abs(fi - uActiveIndex));

      float core = smoothstep(0.022, 0.008, d);
      float pulse = 0.035 + 0.018 * sin(uTime * 2.6);
      float ring = smoothstep(0.005, 0.001, abs(d - pulse)) * isCurrent;

      vec3 nodeCol = fi > 3.5 ? goldTone : lineGreen;
      col += nodeCol * core * (0.35 + 0.55 * max(isCompleted, isCurrent));
      col += nodeCol * ring * 0.75;
    }

    float ptrDist = length((uv - uPointer) * vec2(1.5, 1.0));
    float spotlight = smoothstep(0.38, 0.0, ptrDist);
    col += lineGreen * spotlight * 0.09;

    float vignette = smoothstep(0.95, 0.25, length(uv - vec2(0.5)));
    col *= (0.72 + 0.28 * vignette);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const TacticalPitchCanvas: React.FC<TacticalPitchCanvasProps> = ({
  nextPhase,
  campaignIndex,
  winsToTitle,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady, setWebglReady] = useState<boolean>(false);

  const activeIdx = nextPhase ? PHASE_ORDER.indexOf(nextPhase) : 4;

  useEffect(() => {
    const container = mountRef.current;
    if (!container || prefersReducedMotion()) {
      setWebglReady(false);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      });
    } catch {
      setWebglReady(false);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x0b0f0c, 1);

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 180;
    renderer.setSize(width, height, false);

    const canvas = renderer.domElement;
    canvas.className = "w-full h-full block";
    canvas.setAttribute("aria-hidden", "true");
    container.innerHTML = "";
    container.appendChild(canvas);
    setWebglReady(true);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 20);
    camera.position.set(0, -1.05, 1.85);
    camera.lookAt(0, 0, 0);

    const uniforms = {
      uTime: { value: 0 },
      uActiveIndex: { value: activeIdx },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    };

    const geometry = new THREE.PlaneGeometry(2.5, 1.45, 1, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let targetPtrX = 0.5;
    let targetPtrY = 0.5;
    let isVisible = true;
    let isTabActive = !document.hidden;
    let rafId = 0;
    const startTime = performance.now();

    const renderFrame = (now: number) => {
      if (!renderer || !isVisible || !isTabActive) {
        rafId = 0;
        return;
      }
      uniforms.uTime.value = (now - startTime) * 0.001;
      uniforms.uPointer.value.x +=
        (targetPtrX - uniforms.uPointer.value.x) * 0.08;
      uniforms.uPointer.value.y +=
        (targetPtrY - uniforms.uPointer.value.y) * 0.08;

      mesh.rotation.x = (uniforms.uPointer.value.y - 0.5) * 0.08;
      mesh.rotation.y = (uniforms.uPointer.value.x - 0.5) * 0.12;

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(renderFrame);
    };

    const ensureLoop = () => {
      if (rafId === 0 && isVisible && isTabActive) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      targetPtrX = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      targetPtrY = Math.max(
        0,
        Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
      );
    };

    const handleResize = () => {
      if (!renderer || !container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 180;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const handleVisibility = () => {
      isTabActive = !document.hidden;
      if (isTabActive) ensureLoop();
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      setWebglReady(false);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = Boolean(entry && entry.isIntersecting);
        if (isVisible) ensureLoop();
      },
      { threshold: 0.05 }
    );

    io.observe(container);
    container.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    canvas.addEventListener("webglcontextlost", handleContextLost);

    ensureLoop();

    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      io.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      geometry.dispose();
      material.dispose();
      renderer?.dispose();
    };
  }, [activeIdx]);

  return (
    <div className="relative w-full h-[148px] sm:h-[168px] rounded-[8px] bg-[#0b0f0c] border border-[var(--line-strong)] overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />

      {!webglReady && (
        <svg
          viewBox="0 0 400 160"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        >
          <rect width="400" height="160" fill="#0B0F0C" />
          <rect
            x="20"
            y="16"
            width="360"
            height="128"
            rx="4"
            fill="#131A15"
            stroke="#22C55E"
            strokeOpacity="0.45"
            strokeWidth="1.5"
          />
          <line
            x1="200"
            y1="16"
            x2="200"
            y2="144"
            stroke="#22C55E"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          <circle
            cx="200"
            cy="80"
            r="26"
            fill="none"
            stroke="#22C55E"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          {[0, 1, 2, 3, 4].map((idx) => {
            const cx = 64 + idx * 68;
            const cy = 80 + (idx % 2 === 0 ? -12 : 12);
            const active = idx <= activeIdx;
            return (
              <g key={idx}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={idx === activeIdx ? 8 : 5}
                  fill={active ? "#22C55E" : "#2A352D"}
                />
              </g>
            );
          })}
        </svg>
      )}

      <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between gap-2 pointer-events-none">
        <span className="px-2 py-0.5 rounded-[4px] bg-[#0b0f0c]/90 border border-[var(--line-strong)] font-mono-tech text-[11px] text-[var(--win)]">
          M-0{campaignIndex}
        </span>
        <span className="px-2 py-0.5 rounded-[4px] bg-[#0b0f0c]/90 border border-[var(--line-strong)] text-xs font-medium text-[var(--text)]">
          A {winsToTitle} {winsToTitle === 1 ? "victoria" : "victorias"} del título
        </span>
      </div>
    </div>
  );
};

