"use client";

import { useEffect, useRef } from "react";

/**
 * Adapted from Magic UI's FlickeringGrid (MIT) —
 * https://magicui.design/docs/components/flickering-grid
 *
 * Changes from the original, all of them about running on a phone at a
 * conference rather than on a desktop landing page:
 *  - honours prefers-reduced-motion: draws one static frame and stops
 *  - capped frame rate; a flicker reads fine far below 60fps
 *  - device pixel ratio capped at 2 (3x phones tripled the fill cost for
 *    texture nobody can resolve)
 *  - stops the loop entirely when off-screen instead of running rAF and
 *    returning early
 *  - clamps delta time, so returning to a backgrounded tab does not re-roll
 *    every square in one frame
 *  - no canvas-size React state; the canvas element is sized directly, which
 *    drops a re-render per resize
 *  - the upstream `width`/`height` props are deliberately not carried over:
 *    the grid always fills its container, and a reflow keeps the squares it
 *    already has rather than re-randomising the whole field
 */

type FlickeringGridProps = {
  squareSize?: number;
  gridGap?: number;
  /** Chance per second that a given square picks a new opacity. */
  flickerChance?: number;
  /** Any CSS colour; parsed once on the client. */
  color?: string;
  maxOpacity?: number;
  fps?: number;
  className?: string;
};

/** Resolves any CSS colour to an "rgba(r, g, b," prefix via a 1x1 canvas. */
function rgbaPrefix(color: string) {
  const probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  const ctx = probe.getContext("2d");
  if (!ctx) return "rgba(255, 255, 255,";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b},`;
}

export function FlickeringGrid({
  squareSize = 3,
  gridGap = 7,
  flickerChance = 0.25,
  color = "rgb(255, 255, 255)",
  maxOpacity = 0.16,
  fps = 20,
  className = "",
}: FlickeringGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!container || !canvas || !ctx) return;

    const prefix = rgbaPrefix(color);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pitch = squareSize + gridGap;

    let cols = 0;
    let rows = 0;
    let dpr = 1;
    let squares = new Float32Array(0);
    let frame: number | null = null;
    let lastDraw = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const size = squareSize * dpr;
      const step = pitch * dpr;
      for (let x = 0; x < cols; x += 1) {
        for (let y = 0; y < rows; y += 1) {
          const opacity = squares[x * rows + y];
          if (opacity < 0.01) continue;
          ctx.fillStyle = `${prefix}${opacity})`;
          ctx.fillRect(x * step, y * step, size, size);
        }
      }
    };

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const nextCols = Math.ceil(width / pitch);
      const nextRows = Math.ceil(height / pitch);
      const next = new Float32Array(nextCols * nextRows);

      // Carry over every square that still exists, so dragging a window edge
      // reflows the grid instead of re-rolling the whole field on each frame
      // of the drag. Only newly exposed cells get a fresh value.
      const keptCols = Math.min(cols, nextCols);
      const keptRows = Math.min(rows, nextRows);
      for (let x = 0; x < nextCols; x += 1) {
        for (let y = 0; y < nextRows; y += 1) {
          next[x * nextRows + y] =
            x < keptCols && y < keptRows ? squares[x * rows + y] : Math.random() * maxOpacity;
        }
      }

      cols = nextCols;
      rows = nextRows;
      squares = next;
      draw();
    };

    const interval = 1000 / fps;

    const tick = (time: number) => {
      const elapsed = time - lastDraw;
      if (elapsed >= interval) {
        lastDraw = time;
        const delta = Math.min(elapsed / 1000, 0.1);
        for (let i = 0; i < squares.length; i += 1) {
          if (Math.random() < flickerChance * delta) {
            squares[i] = Math.random() * maxOpacity;
          }
        }
        draw();
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame !== null || reduceMotion.matches) return;
      lastDraw = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (frame === null) return;
      cancelAnimationFrame(frame);
      frame = null;
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    const onMotionPreferenceChange = () => {
      stop();
      resize();
      start();
    };
    reduceMotion.addEventListener("change", onMotionPreferenceChange);

    /**
     * A hidden document gets no ResizeObserver callbacks and no animation
     * frames, so a window resized in a background tab comes back with a canvas
     * sized for the old layout. Re-measure whenever we become visible again,
     * and keep a plain resize listener as a second net.
     */
    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
        return;
      }
      resize();
      start();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("resize", resize);

    resize();
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      reduceMotion.removeEventListener("change", onMotionPreferenceChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", resize);
    };
  }, [squareSize, gridGap, flickerChance, color, maxOpacity, fps]);

  return (
    <div ref={containerRef} aria-hidden className={`h-full w-full ${className}`}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
